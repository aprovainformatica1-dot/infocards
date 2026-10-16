/* CENTRAL DE OFERTAS DEVMAPAS — HTML/CSS/JS puro. Fala só com /api/ofertas-admin (no próprio site).
   Nenhuma chave do Supabase existe aqui. A chave administrativa fica SÓ em memória (recarregar exige digitar de novo). */
'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const estado = { chave: '', materiais: [], tipos: [], classes: [], atual: null, aba: 'dados' };

const TIPOS_ROTULO = { simulado: 'Simulado', mapa: 'Mapa', personalizado: 'Simulado personalizado', grupo: 'Grupo gratuito', cartilha: 'Cartilha' };
const CLASSES_ROTULO = { 'go a': 'Faixa superior (estilo do Simulado)', 'go b': 'Roxo claro (estilo dos Mapas)', 'go wa': 'Verde claro (estilo WhatsApp)', 'go gr': 'Verde escuro (estilo do Grupo)' };
const MENSAGENS = {
  chave_invalida: 'Chave administrativa incorreta.', campo_obrigatorio: 'Preencha o campo obrigatório', campo_longo: 'Texto longo demais no campo', url_invalida: 'Endereço inválido no campo (use http:// ou https://; a imagem precisa ser https://)',
  tipo_invalido: 'Tipo inválido.', classe_invalida: 'Estilo de card inválido.', numero_invalido: 'Número inválido no campo', muitos_paragrafos: 'No máximo 8 parágrafos.', chave_em_uso: 'Já existe um material com essa chave.',
  nao_encontrado: 'Não encontrei (talvez já tenha sido excluído).', confirmacao_necessaria: 'É preciso confirmar.', configuracao: 'O servidor não está configurado (faltam variáveis de ambiente na Vercel).',
  falha_consulta: 'Não consegui ler o banco. Confira se as tabelas da Central de Ofertas foram criadas (arquivo supabase-ofertas.sql).', falha_gravacao: 'Não consegui gravar no banco.', falha_criar_material: 'Não consegui criar o material no Analytics.', falha_rede: 'Sem conexão com o servidor. Tente de novo.',
};
const msgErro = (e) => { const base = (e && MENSAGENS[e.message]) || 'Algo deu errado (' + ((e && e.message) || 'erro') + ').'; return e && e.campo ? base + ' “' + e.campo + '”.' : base; };

let toastTimer;
function aviso(t, erro) { const x = $('toast'); x.textContent = t; x.className = 'toast' + (erro ? ' erro' : ''); x.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { x.hidden = true; }, erro ? 7000 : 3500); }
async function api(metodo, corpo) {
  let resp;
  try { resp = await fetch('/api/ofertas-admin', { method: metodo, headers: { 'x-admin-key': estado.chave, ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); }
  catch (e) { throw Object.assign(new Error('falha_rede'), { status: 0 }); }
  let dados = null; try { dados = await resp.json(); } catch (e) { /* sem corpo */ }
  if (resp.status === 401) { estado.chave = ''; mostrar('vConectar'); throw Object.assign(new Error('chave_invalida'), { status: 401 }); }
  if (!resp.ok || !dados || dados.ok === false) throw Object.assign(new Error((dados && dados.erro) || 'falha_rede'), { dados, campo: dados && dados.campo, status: resp.status });
  return dados;
}
function confirmar(titulo, texto, rotulo) {
  return new Promise((resolver) => {
    $('confTitulo').textContent = titulo; $('confTexto').textContent = texto; $('confSim').textContent = rotulo || 'CONFIRMAR';
    const d = $('dlgConfirma'); const fim = (v) => { $('confSim').onclick = $('confNao').onclick = null; d.onclose = null; d.close(); resolver(v); };
    $('confSim').onclick = () => fim(true); $('confNao').onclick = () => fim(false); d.onclose = () => resolver(false); d.showModal();
  });
}
function mostrar(v) { ['vConectar', 'vLista', 'vDetalhe'].forEach((id) => { $(id).hidden = id !== v; }); window.scrollTo(0, 0); }
function campo(rotulo, valor, { area, tipo, readonly, max, dica } = {}) {
  const l = el('label', '', rotulo), c = el(area ? 'textarea' : 'input'); if (!area) c.type = tipo || 'text';
  c.value = valor == null ? '' : valor; if (readonly) c.readOnly = true; if (max) c.maxLength = max; l.append(c);
  if (dica) l.append(el('small', '', dica)); return { l, c };
}
function seletor(rotulo, opcoes, valor) {
  const l = el('label', '', rotulo), s = el('select'); Object.entries(opcoes).forEach(([v, t]) => { const o = el('option', '', t); o.value = v; s.append(o); }); s.value = valor; l.append(s); return { l, s };
}
function marcador(rotulo, marcado) { const l = el('label', 'chk'), c = el('input'); c.type = 'checkbox'; c.checked = !!marcado; l.append(c, el('span', '', rotulo)); return { l, c }; }
const botao = (rot, fn, cls) => { const b = el('button', 'btn ' + (cls || ''), rot); b.type = 'button'; b.addEventListener('click', fn); return b; };
const mat = () => estado.materiais.find((m) => m.id === estado.atual);
function trocar(novo) { const i = estado.materiais.findIndex((m) => m.id === novo.id); if (i >= 0) estado.materiais[i] = novo; else estado.materiais.push(novo); }
async function enviar(corpo, sucesso) {
  try { const r = await api('POST', corpo); if (r.material) trocar(r.material); renderLista(); if (estado.atual) { renderCabecalho(); renderAba(); } if (sucesso) aviso(sucesso); return r; }
  catch (e) { aviso(msgErro(e), true); return null; }
}

// ---------------------------------------------------------------- conexão e lista
$('btnConectar').addEventListener('click', conectar);
$('chave').addEventListener('keydown', (e) => { if (e.key === 'Enter') conectar(); });
async function conectar() {
  const v = $('chave').value.trim(); $('erroConexao').hidden = true;
  if (!v) { $('erroConexao').textContent = 'Digite a chave administrativa.'; $('erroConexao').hidden = false; return; }
  estado.chave = v;
  try { await carregar(); $('chave').value = ''; mostrar('vLista'); }
  catch (e) { estado.chave = ''; $('erroConexao').textContent = msgErro(e); $('erroConexao').hidden = false; mostrar('vConectar'); }
}
async function carregar() { const r = await api('GET'); estado.materiais = r.materiais; estado.tipos = r.tipos; estado.classes = r.classes; renderLista(); }
$('busca').addEventListener('input', renderLista);

function pills(m) {
  const box = el('span'), o = m.oferta;
  if (!o) box.append(el('span', 'pill aviso', 'Sem vitrine ainda'));
  else box.append(el('span', 'pill ' + (o.pausado ? 'off' : 'ok'), o.pausado ? 'Pausado' : 'No ar'));
  if (!m.ativo_analytics) box.append(el('span', 'pill aviso', 'Desativado no Analytics'));
  return box;
}
function renderLista() {
  const box = $('lista'); box.textContent = '';
  const q = $('busca').value.trim().toLowerCase();
  const itens = estado.materiais.filter((m) => !q || m.nome.toLowerCase().includes(q) || (m.oferta && m.oferta.chave.includes(q)));
  if (!itens.length) box.append(el('p', 'vazio', estado.materiais.length ? 'Nenhum material encontrado.' : 'Nenhum material ainda.'));
  itens.forEach((m) => {
    const b = el('button', 'item' + (m.oferta && m.oferta.pausado ? ' pausado' : '')); b.type = 'button'; b.setAttribute('aria-label', 'Abrir ' + m.nome);
    const ic = el('span', 'ico', (m.oferta && m.oferta.icone) || '🎁'); ic.setAttribute('aria-hidden', 'true');
    const t = el('span', 'txt'); const ativos = (l) => l.filter((x) => x.ativo).length;
    t.append(el('span', 'nome', m.nome), pills(m), el('span', 'meta', (TIPOS_ROTULO[m.tipo] || m.tipo) + ' · ' + ativos(m.textos) + (ativos(m.textos) === 1 ? ' texto' : ' textos') + ' · ' + ativos(m.links) + (ativos(m.links) === 1 ? ' link' : ' links')));
    b.append(ic, t); b.addEventListener('click', () => abrirDetalhe(m.id)); box.append(b);
  });
  atualizarBannerImportar();
}

// ---------------------------------------------------------------- importar do config/ofertas.js (uma vez, a pedido)
function itensLegado() {
  if (typeof OFERTAS === 'undefined') return [];
  const todos = { ...(typeof MAPAS_INDIVIDUAIS === 'undefined' ? {} : MAPAS_INDIVIDUAIS), ...OFERTAS };
  return Object.values(todos).map((o) => ({ chave: o.id, nome: o.nome, icone: o.icone, cta: o.cta, classe: o.classe, kick: o.kick, titulo: o.titulo, textos: o.textos, importante: o.importante, botao: o.botao, imagem: o.imagem, capaEmoji: o.capaEmoji, iconeWhatsapp: o.iconeWhatsapp === true, link: o.link }));
}
function pendentesImportar() { const usadas = new Set(estado.materiais.filter((m) => m.oferta).map((m) => m.oferta.chave)); return itensLegado().filter((i) => !usadas.has(i.chave)); }
function atualizarBannerImportar() {
  const p = pendentesImportar(); $('bannerImportar').hidden = !p.length;
  $('textoImportar').textContent = p.length ? 'Encontrei ' + p.length + ' oferta(s) no arquivo antigo: ' + p.map((i) => i.nome).join(', ') + '. Importar copia os textos e links para cá, ligando cada uma ao material do Analytics que tem o mesmo link. O arquivo config/ofertas.js não é alterado.' : '';
}
$('btnImportar').addEventListener('click', async () => {
  const p = pendentesImportar(); if (!p.length) return;
  if (!(await confirmar('Importar do config/ofertas.js?', 'Serão importadas ' + p.length + ' oferta(s). Nenhum material existente do Analytics é alterado; só ganham textos e links aqui.', 'IMPORTAR'))) return;
  try {
    let r = await api('POST', { acao: 'importar_legado', itens: p }); estado.materiais = r.materiais; const rel = r.relatorio;
    let msg = rel.importados.length + ' importada(s).';
    if (rel.sem_correspondencia.length) {
      const nomes = rel.sem_correspondencia.map((x) => x.chave + ' (' + x.motivo + ')').join('\n• ');
      if (await confirmar('Criar materiais novos?', 'Não achei material no Analytics com o mesmo link para:\n• ' + nomes + '\n\nPosso CRIAR estes materiais no Analytics (nome, tipo, destino) para você. Se preferir, cancele e ligue manualmente depois.', 'CRIAR MATERIAIS')) {
        const chaves = new Set(rel.sem_correspondencia.map((x) => x.chave)); r = await api('POST', { acao: 'importar_legado', itens: p.filter((i) => chaves.has(i.chave)), criar_novos: true }); estado.materiais = r.materiais; msg += ' ' + r.relatorio.criados.length + ' criada(s) como material novo.';
        if (r.relatorio.erros.length) msg += '\nErros: ' + r.relatorio.erros.map((x) => x.chave + ': ' + x.erro).join('; ');
      } else msg += ' ' + rel.sem_correspondencia.length + ' ficou(aram) de fora.';
    }
    if (rel.erros.length) msg += '\nErros: ' + rel.erros.map((x) => x.chave + ': ' + x.erro).join('; ');
    renderLista(); aviso(msg, rel.erros.length > 0);
  } catch (e) { aviso(msgErro(e), true); }
});

// ---------------------------------------------------------------- novo material
$('btnNovo').addEventListener('click', () => {
  const f = $('formNovo'); f.textContent = '';
  const nome = campo('Nome do material', '', { max: 100 }), tipo = seletor('Tipo', TIPOS_ROTULO, 'mapa'), url = campo('Link principal (URL de compra)', '', { tipo: 'url', dica: 'Vira o destino padrão dos links rastreados.' }),
    bt = campo('Texto do botão', '', { max: 60 }), ic = campo('Ícone (emoji)', '🎁', { max: 8 }), est = seletor('Estilo do card', CLASSES_ROTULO, 'go b');
  f.append(nome.l, tipo.l, url.l, bt.l, ic.l, est.l);
  $('novoSim').onclick = async () => {
    const r = await enviarNovo({ acao: 'criar_material', nome: nome.c.value, tipo: tipo.s.value, url: url.c.value, botao: bt.c.value, icone: ic.c.value, classe: est.s.value });
    if (r) { $('dlgNovo').close(); abrirDetalhe(r.material.id); aviso('Material criado. Agora adicione os textos de oferta.'); }
  };
  $('novoNao').onclick = () => $('dlgNovo').close(); $('dlgNovo').showModal();
});
async function enviarNovo(corpo) { try { const r = await api('POST', corpo); trocar(r.material); renderLista(); return r; } catch (e) { aviso(msgErro(e), true); return null; } }

// ---------------------------------------------------------------- detalhe
function abrirDetalhe(id) { estado.atual = id; estado.aba = 'dados'; renderCabecalho(); trocarAba('dados'); mostrar('vDetalhe'); }
$('btnVoltar').addEventListener('click', () => { estado.atual = null; renderLista(); mostrar('vLista'); });
function renderCabecalho() { const m = mat(); $('detIcone').textContent = (m.oferta && m.oferta.icone) || '🎁'; $('detNome').textContent = m.nome; const p = $('detPills'); p.textContent = ''; p.append(pills(m)); }
function trocarAba(a) {
  estado.aba = a;
  document.querySelectorAll('.abas button').forEach((b) => { const sel = b.dataset.aba === a; b.setAttribute('aria-selected', String(sel)); b.tabIndex = sel ? 0 : -1; $('aba-' + b.dataset.aba).hidden = !sel; });
  renderAba();
}
document.querySelectorAll('.abas button').forEach((b, i, todos) => {
  b.addEventListener('click', () => trocarAba(b.dataset.aba));
  b.addEventListener('keydown', (e) => { if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; const n = todos[(i + (e.key === 'ArrowRight' ? 1 : todos.length - 1)) % todos.length]; n.focus(); trocarAba(n.dataset.aba); });
});
function renderAba() { ({ dados: renderDados, textos: renderTextos, links: renderLinks })[estado.aba](); }

// --- aba Dados
function renderDados() {
  const box = $('aba-dados'), m = mat(), o = m.oferta; box.textContent = '';
  if (!o) box.append(el('div', 'msg erro', 'Este material existe no Analytics, mas ainda não tem dados de vitrine. Confira os campos e salve para liberá-lo nos seletores.'));
  const nome = campo('Nome do material', m.nome, { max: 100, dica: 'Este nome também aparece no Analytics.' }), tipo = seletor('Tipo', TIPOS_ROTULO, m.tipo), ic = campo('Ícone (emoji)', o ? o.icone : '🎁', { max: 8 });
  const est = seletor('Estilo do card', CLASSES_ROTULO, o ? o.classe : 'go b'), img = campo('Imagem da capa (URL https://)', o ? o.imagem_url : '', { tipo: 'url', dica: 'Opcional. Ex.: https://devmapas.vercel.app/img/capa-mapas.png' });
  const emo = campo('Emoji da capa (aparece enquanto a imagem não carrega)', o ? o.capa_emoji : '', { max: 8 }), wa = marcador('Botão com ícone do WhatsApp', o && o.icone_whatsapp);
  const cta = campo('Nome do botão rastreado (cta)', o ? o.cta : '', { max: 40, dica: 'Mesmo campo "cta" do ofertas.js. Deixe como está se não souber.' }), ord = campo('Ordem na lista (menor aparece primeiro)', o ? o.ordem : 0, { tipo: 'number' });
  const chave = campo('Chave interna', o ? o.chave : '(gerada ao salvar)', { readonly: true, dica: 'Identifica o material nas ofertas antigas. Não muda.' }), dest = campo('Destino padrão dos links rastreados (/r/)', m.destino_url, { readonly: true, dica: 'Segue o link marcado como principal na aba Links.' });
  box.append(nome.l, tipo.l, ic.l, est.l, img.l, emo.l, wa.l, cta.l, ord.l, chave.l, dest.l);
  const ac = el('div', 'acoes');
  ac.append(botao('SALVAR DADOS', () => enviar({ acao: 'salvar_material', material_id: m.id, nome: nome.c.value, tipo: tipo.s.value, icone: ic.c.value, classe: est.s.value, imagem_url: img.c.value, capa_emoji: emo.c.value, icone_whatsapp: wa.c.checked, cta: cta.c.value, ordem: ord.c.value }, 'Dados salvos ✅')));
  const pausado = !!(o && o.pausado);
  ac.append(botao(pausado ? 'REATIVAR MATERIAL' : 'PAUSAR MATERIAL', async () => {
    if (!pausado && !(await confirmar('Pausar "' + m.nome + '"?', 'Ele some dos seletores e das dicas publicadas que o usam. Desafios já gerados não mudam e os links rastreados (/r/) continuam funcionando. Você pode reativar quando quiser.', 'PAUSAR'))) return;
    enviar({ acao: 'pausar_material', material_id: m.id, pausado: !pausado }, pausado ? 'Material reativado ✅' : 'Material pausado.');
  }, 'ghost'));
  box.append(ac);
}

// --- aba Textos
function renderTextos() {
  const box = $('aba-textos'), m = mat(); box.textContent = '';
  box.append(el('h2', '', 'Textos de oferta'), el('p', 'mini', 'Cada texto é uma versão do anúncio (título, parágrafos e destaque). Dicas e desafios escolhem um deles.'));
  if (!m.textos.length) box.append(el('p', 'vazio', 'Nenhum texto ainda. Sem ao menos um texto e um link ativos, o material não aparece nos seletores.'));
  m.textos.forEach((t) => box.append(blocoTexto(m, t, false)));
  const novo = blocoTexto(m, null, true); box.append(novo);
  box.append(botao('+ NOVO TEXTO', () => { novo.open = true; novo.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 'ghost'));
}
function blocoTexto(m, t, ehNovo) {
  const d = el('details', 'bloco'), s = el('summary', '', ehNovo ? '＋ Novo texto' : t.nome); if (t && !t.ativo) s.append(el('span', 'pill off', 'Pausado')); d.append(s);
  const c = el('div', 'corpo'); d.append(c);
  const nome = campo('Nome interno (só aparece nos seletores)', t ? t.nome : '', { max: 80 }), kick = campo('Rótulo acima do título (opcional)', t ? t.kick : '', { max: 120 }), tit = campo('Título', t ? t.titulo : '', { max: 200 });
  const par = campo('Parágrafos (separe com uma linha em branco)', t ? t.paragrafos.join('\n\n') : '', { area: true, dica: 'Texto simples. Até 8 parágrafos.' }), imp = campo('Caixa "IMPORTANTE" (opcional)', t ? t.importante : '', { area: true, max: 500 });
  c.append(nome.l, kick.l, tit.l, par.l, imp.l);
  const corpo = () => ({ nome: nome.c.value, kick: kick.c.value, titulo: tit.c.value, paragrafos: par.c.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean), importante: imp.c.value });
  const ac = el('div', 'acoes'); c.append(ac);
  ac.append(botao('SALVAR TEXTO', () => enviar({ acao: 'salvar_texto', ...(t ? { id: t.id } : { material_id: m.id }), ...corpo() }, 'Texto salvo ✅')));
  if (t) {
    ac.append(botao(t.ativo ? 'PAUSAR' : 'REATIVAR', () => enviar({ acao: 'pausar_texto', id: t.id, ativo: !t.ativo }, t.ativo ? 'Texto pausado.' : 'Texto reativado ✅'), 'ghost'));
    ac.append(botao('EXCLUIR', async () => { if (await confirmar('Excluir este texto?', 'Dicas que usam este texto deixam de mostrar a oferta até você escolher outro. Não dá para desfazer.', 'EXCLUIR')) enviar({ acao: 'excluir_texto', id: t.id, confirmar: true }, 'Texto excluído.'); }, 'rem'));
  }
  return d;
}

// --- aba Links
function renderLinks() {
  const box = $('aba-links'), m = mat(); box.textContent = '';
  box.append(el('h2', '', 'Links'), el('p', 'mini', 'Cada link tem URL, preço e texto de botão próprios. O link PRINCIPAL é o destino padrão do material nos links rastreados (/r/).'));
  if (!m.links.length) box.append(el('p', 'vazio', 'Nenhum link ainda.'));
  m.links.forEach((l) => box.append(blocoLink(m, l, false)));
  const novo = blocoLink(m, null, true); box.append(novo);
  box.append(botao('+ NOVO LINK', () => { novo.open = true; novo.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 'ghost'));
}
function blocoLink(m, l, ehNovo) {
  const d = el('details', 'bloco'), s = el('summary', '', ehNovo ? '＋ Novo link' : l.nome + (l.preco ? ' — ' + l.preco : ''));
  if (l && l.principal) s.append(el('span', 'pill ok', 'Principal')); if (l && !l.ativo) s.append(el('span', 'pill off', 'Pausado')); d.append(s);
  const c = el('div', 'corpo'); d.append(c);
  const nome = campo('Nome interno (ex.: Checkout à vista)', l ? l.nome : '', { max: 80 }), url = campo('URL', l ? l.url : '', { tipo: 'url' }), preco = campo('Preço (texto exibido, opcional)', l ? l.preco : '', { max: 40 }), bt = campo('Texto do botão', l ? l.botao : '', { max: 60 });
  const pr = marcador('Link principal deste material', l && l.principal); c.append(nome.l, url.l, preco.l, bt.l, pr.l);
  const ac = el('div', 'acoes'); c.append(ac);
  ac.append(botao('SALVAR LINK', () => enviar({ acao: 'salvar_link', ...(l ? { id: l.id } : { material_id: m.id }), nome: nome.c.value, url: url.c.value, preco: preco.c.value, botao: bt.c.value, principal: pr.c.checked }, 'Link salvo ✅')));
  if (l) {
    ac.append(botao(l.ativo ? 'PAUSAR' : 'REATIVAR', () => enviar({ acao: 'pausar_link', id: l.id, ativo: !l.ativo }, l.ativo ? 'Link pausado.' : 'Link reativado ✅'), 'ghost'));
    ac.append(botao('EXCLUIR', async () => { if (await confirmar('Excluir este link?', 'Dicas que usam este link deixam de mostrar a oferta até você escolher outro. Não dá para desfazer.', 'EXCLUIR')) enviar({ acao: 'excluir_link', id: l.id, confirmar: true }, 'Link excluído.'); }, 'rem'));
  }
  return d;
}
