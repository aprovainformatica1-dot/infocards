/* PAINEL DE DICAS DEVMAPAS — HTML/CSS/JS puro. Fala só com as APIs do próprio site
   (/api/dicas-admin e /api/dicas-imagens). Nenhuma chave do Supabase existe aqui.
   A chave administrativa fica SÓ em memória: recarregar ou fechar a página exige digitar de novo. */
'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const R = window.DicaRegras, INT = window.DicaInterpretador;
const vazio = () => ({ f: '', o: [], itens: [], q: [] });
const estado = { chave: '', dicas: [], dica: null, conteudo: vazio(), avisos: [], nao: [], imagem: null, slugManual: false, sujo: false };

const MENSAGENS = {
  chave_invalida: 'Chave administrativa incorreta.', slug_em_uso: 'Já existe uma dica com esse endereço. Escolha outro.', slug_invalido: 'Endereço inválido: use só letras minúsculas, números e hífen (mínimo 3 caracteres).',
  slug_travado: 'O endereço não pode mudar depois que a dica foi publicada.', titulo_invalido: 'Preencha o título (até 120 caracteres).', conteudo_invalido: 'A dica ainda tem pendências para publicar.',
  confirmacao_necessaria: 'É preciso confirmar.', imagem_em_uso: 'Essa imagem é usada por outra dica e não pode ser apagada.', imagem_grande: 'Imagem grande demais.', tipo_nao_aceito: 'Formato de imagem não aceito (use JPG, PNG ou WebP).',
  nao_encontrada: 'Dica não encontrada (talvez já tenha sido excluída).', configuracao: 'O servidor não está configurado (faltam variáveis de ambiente na Vercel).', falha_storage: 'Não consegui gravar o arquivo no Supabase Storage. Confira o bucket "dicas-imagens".',
  falha_rede: 'Sem conexão com o servidor. Tente de novo.',
};
const msgErro = (e) => (e && MENSAGENS[e.message]) || 'Algo deu errado (' + ((e && e.message) || 'erro') + ').';

// ---------------------------------------------------------------- utilidades
let toastTimer;
function aviso(texto, ehErro) {
  const t = $('toast'); t.textContent = texto; t.className = 'toast' + (ehErro ? ' erro' : ''); t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, ehErro ? 7000 : 3500);
}
async function api(url, { metodo = 'GET', corpo } = {}) {
  let resp;
  try {
    resp = await fetch(url, { method: metodo, headers: { 'x-admin-key': estado.chave, ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch (e) { throw Object.assign(new Error('falha_rede'), { status: 0 }); }
  let dados = null; try { dados = await resp.json(); } catch (e) { /* sem corpo */ }
  if (resp.status === 401) { estado.chave = ''; mostrar('vConectar'); throw Object.assign(new Error('chave_invalida'), { status: 401 }); }
  if (!resp.ok || !dados || dados.ok === false) throw Object.assign(new Error((dados && dados.erro) || 'falha_rede'), { dados, status: resp.status });
  return dados;
}
function confirmar(titulo, texto, rotulo) {
  return new Promise((resolver) => {
    $('confTitulo').textContent = titulo; $('confTexto').textContent = texto; $('confSim').textContent = rotulo || 'CONFIRMAR';
    const d = $('dlgConfirma'); const fim = (v) => { $('confSim').onclick = $('confNao').onclick = null; d.onclose = null; d.close(); resolver(v); };
    $('confSim').onclick = () => fim(true); $('confNao').onclick = () => fim(false); d.onclose = () => resolver(false); d.showModal();
  });
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); }
  catch (e) { const t = el('textarea'); t.value = texto; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch (x) { /* ignora */ } t.remove(); }
  aviso('Link copiado!');
}
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const rotuloStatus = (d) => (d.status === 'publicada' ? (d.alteracoes_pendentes ? 'Publicada · alterações não publicadas' : 'Publicada') : d.status === 'despublicada' ? 'Despublicada' : 'Rascunho');
const classeStatus = (d) => (d.status === 'publicada' ? (d.alteracoes_pendentes ? 'pend' : 'pub') : d.status === 'despublicada' ? 'off' : '');
function mostrar(v) { ['vConectar', 'vLista', 'vEditor'].forEach((id) => { $(id).hidden = id !== v; }); window.scrollTo(0, 0); }
window.addEventListener('beforeunload', (e) => { if (estado.sujo && !$('vEditor').hidden) { e.preventDefault(); e.returnValue = ''; } });

// ---------------------------------------------------------------- conexão
$('btnConectar').addEventListener('click', conectar);
$('chave').addEventListener('keydown', (e) => { if (e.key === 'Enter') conectar(); });
async function conectar() {
  const v = $('chave').value.trim(); $('erroConexao').hidden = true;
  if (!v) { $('erroConexao').textContent = 'Digite a chave administrativa.'; $('erroConexao').hidden = false; return; }
  estado.chave = v;
  try { await carregarLista(); $('chave').value = ''; mostrar('vLista'); }
  catch (e) { estado.chave = ''; $('erroConexao').textContent = msgErro(e); $('erroConexao').hidden = false; mostrar('vConectar'); }
}

// ---------------------------------------------------------------- lista
async function carregarLista() { estado.dicas = (await api('/api/dicas-admin')).dicas; renderLista(); }
$('busca').addEventListener('input', renderLista);
$('btnNova').addEventListener('click', () => abrirEditor(null));

function renderLista() {
  const box = $('lista'); box.textContent = '';
  const q = R.slugify($('busca').value).replace(/-/g, ''), qt = $('busca').value.trim().toLowerCase();
  const itens = estado.dicas.filter((d) => !qt || d.titulo.toLowerCase().includes(qt) || d.slug.includes(qt) || (q && d.slug.replace(/-/g, '').includes(q)));
  if (!itens.length) { box.append(el('p', 'vazio', estado.dicas.length ? 'Nenhuma dica encontrada.' : 'Nenhuma dica ainda. Toque em "+ NOVA DICA".')); return; }
  itens.forEach((d) => {
    const c = el('article', 'dica');
    c.append(el('h3', '', d.titulo), el('span', 'pill ' + classeStatus(d), rotuloStatus(d)), el('div', 'meta', '/dica/' + d.slug), el('div', 'meta', 'Atualizada em ' + quando(d.atualizado_em)));
    const ac = el('div', 'acoes');
    const b = (rot, fn, cls) => { const x = el('button', 'btn mini-btn ' + (cls || 'ghost'), rot); x.type = 'button'; x.addEventListener('click', fn); ac.append(x); };
    if (d.status === 'publicada') { b('Abrir', () => window.open(d.link, '_blank', 'noopener')); b('Copiar link', () => copiar(d.link)); }
    b('Visualizar', () => visualizarSalva(d));
    b('Editar', () => abrirEditor(d.id));
    if (d.status === 'publicada') b('Despublicar', () => despublicar(d)); else b('Publicar', () => publicarDaLista(d), '');
    if (d.status === 'publicada' && d.alteracoes_pendentes) b('Publicar alterações', () => publicarDaLista(d), '');
    b('Excluir', () => excluir(d), 'rem');
    c.append(ac); box.append(c);
  });
}
async function visualizarSalva(d) {
  try { const r = await api('/api/dicas-admin?id=' + d.id); await abrirPrevia({ titulo: r.dica.titulo, conteudo: r.dica.conteudo, og_imagem_id: r.dica.og_imagem_id }); }
  catch (e) { aviso(msgErro(e), true); }
}
function mostrarPendencias(e) {
  const det = e && e.dados && e.dados.detalhes;
  aviso(det ? 'Ainda não dá para publicar:\n• ' + det.slice(0, 6).join('\n• ') + (det.length > 6 ? '\n… e mais ' + (det.length - 6) : '') : msgErro(e), true);
}
async function publicarDaLista(d) {
  const rep = d.status === 'publicada';
  if (!(await confirmar(rep ? 'Substituir a versão pública?' : 'Publicar esta dica?', rep ? 'Quem abrir o link verá a nova versão (em até 1 minuto). A versão atual será substituída.' : 'Ela ficará acessível no link /dica/' + d.slug + '.', rep ? 'SUBSTITUIR' : 'PUBLICAR'))) return;
  try { const r = await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'publicar', id: d.id, confirmar: rep } }); avisoPublicacao(r); await carregarLista(); }
  catch (e) { mostrarPendencias(e); }
}
async function despublicar(d) {
  if (!(await confirmar('Despublicar?', 'O link /dica/' + d.slug + ' deixa de funcionar (em até 1 minuto). Você pode publicar de novo depois.', 'DESPUBLICAR'))) return;
  try { await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'despublicar', id: d.id } }); aviso('Dica despublicada.'); await carregarLista(); } catch (e) { aviso(msgErro(e), true); }
}
async function excluir(d) {
  if (!(await confirmar('Excluir "' + d.titulo + '"?', 'Esta ação não pode ser desfeita e o link deixa de funcionar. Os cliques já registrados no Analytics continuam guardados.', 'EXCLUIR'))) return;
  try { await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'excluir', id: d.id, confirmar: true } }); aviso('Dica excluída.'); await carregarLista(); if (!$('vEditor').hidden) mostrar('vLista'); } catch (e) { aviso(msgErro(e), true); }
}
function avisoPublicacao(r) {
  const p = r.painel_links;
  if (p && !p.ok) aviso('Dica publicada, mas NÃO foi registrada no painel de links (' + (p.erro === 'tipo_conteudo_nao_aceito' ? 'o banco não aceita o tipo "dica" em conteudos' : p.erro) + '). Ela funciona normalmente; publique de novo após corrigir.', true);
  else aviso('Dica publicada! ✅\n' + r.dica.link);
}

// ---------------------------------------------------------------- ofertas (lidas de /config/ofertas.js; sem duplicar configuração)
const ordemOfertas = [];
(function () {
  const box = $('listaOfertas');
  if (typeof OFERTAS === 'undefined') { box.append(el('p', 'msg erro', 'Não encontrei /config/ofertas.js: não dá para escolher ofertas agora.')); return; }
  const gerais = Object.entries(OFERTAS);
  const todos = typeof MAPAS_INDIVIDUAIS === 'undefined' ? [] : Object.entries(MAPAS_INDIVIDUAIS);
  const repetidos = todos.filter(([k]) => k in OFERTAS).map(([k]) => k);
  const individuais = todos.filter(([k]) => !(k in OFERTAS));
  const grupo = (titulo, lista) => {
    if (!lista.length) return;
    box.append(el('p', 'grp', titulo));
    lista.forEach(([chave, o]) => {
      const l = el('label', 'chk'), c = el('input'); c.type = 'checkbox'; c.value = chave; c.className = 'of-sel';
      c.addEventListener('change', marcarSujo); l.append(c, el('span', '', (o.icone || '🎁') + ' ' + (o.nome || chave))); box.append(l);
    });
  };
  grupo('OFERTAS GERAIS', gerais); grupo('MAPAS E MATERIAIS INDIVIDUAIS', individuais);
  ordemOfertas.push(...individuais.map(([k]) => k), ...gerais.map(([k]) => k));   // mesma ordem do gerador antigo: individuais e depois gerais
  if (repetidos.length) box.append(el('p', 'msg erro', 'Ignorado em MAPAS_INDIVIDUAIS (mesma chave de uma oferta geral): ' + repetidos.join(', ')));
})();
const ofertasMarcadas = () => [...document.querySelectorAll('.of-sel:checked')].map((c) => c.value).sort((a, b) => ordemOfertas.indexOf(a) - ordemOfertas.indexOf(b));
function marcarOfertas(ids) {
  document.querySelectorAll('.of-sel').forEach((c) => { c.checked = ids.includes(c.value); });
  const fora = ids.filter((id) => !ordemOfertas.includes(id));
  if (fora.length) aviso('Estas ofertas salvas não existem mais em ofertas.js e serão ignoradas: ' + fora.join(', '), true);
}

// ---------------------------------------------------------------- editor
function marcarSujo() { estado.sujo = true; }
async function abrirEditor(id) {
  try {
    let d = null, img = null;
    if (id) { const r = await api('/api/dicas-admin?id=' + id); d = r.dica; img = r.imagem; }
    estado.dica = d; estado.imagem = img; estado.slugManual = !!d; estado.avisos = []; estado.nao = [];
    estado.conteudo = d ? R.normalizar(d.conteudo) : vazio();
    $('titulo').value = d ? d.titulo : ''; $('slug').value = d ? d.slug : '';
    $('txtTopicos').value = d ? d.texto_original || '' : ''; $('txtQuestoes').value = d ? d.questoes_originais || '' : '';
    marcarOfertas(estado.conteudo.o); atualizarSlugInfo(); renderImagemEscolhida(); renderSituacao();
    $('cardEstrutura').hidden = !(estado.conteudo.itens.length || estado.conteudo.q.length);
    renderEstrutura(); estado.sujo = false; mostrar('vEditor');
  } catch (e) { aviso(msgErro(e), true); }
}
$('btnVoltar').addEventListener('click', async () => {
  if (estado.sujo && !(await confirmar('Sair sem salvar?', 'Há alterações que ainda não foram salvas como rascunho.', 'SAIR'))) return;
  estado.sujo = false; try { await carregarLista(); } catch (e) { /* mantém a lista antiga */ } mostrar('vLista');
});
function renderSituacao() {
  const d = estado.dica;
  $('situacao').textContent = d ? rotuloStatus(d) + (d.publicado_em ? ' · publicada em ' + quando(d.publicado_em) : '') : 'Nova dica (ainda não salva)';
  $('btnCopiar').disabled = !(d && d.status === 'publicada');
  $('btnPublicar').textContent = d && d.status === 'publicada' ? 'PUBLICAR ALTERAÇÕES' : 'PUBLICAR';
}
function travado() { return !!(estado.dica && estado.dica.primeira_publicacao_em); }
function atualizarSlugInfo() {
  $('slug').readOnly = travado();
  $('slugInfo').textContent = (travado() ? 'O endereço não muda depois de publicado: ' : 'Link público: ') + 'https://devmapas.vercel.app/dica/' + ($('slug').value || '…');
}
$('titulo').addEventListener('input', () => {
  marcarSujo();
  if (!estado.slugManual && !travado()) { $('slug').value = R.slugify($('titulo').value); atualizarSlugInfo(); }
  atualizarPendencias();
});
$('slug').addEventListener('input', () => { estado.slugManual = true; marcarSujo(); atualizarSlugInfo(); });
$('slug').addEventListener('blur', () => { if (!travado()) { $('slug').value = R.slugify($('slug').value); atualizarSlugInfo(); } });
['txtTopicos', 'txtQuestoes'].forEach((id) => $(id).addEventListener('input', marcarSujo));

$('btnInterpretar').addEventListener('click', async () => {
  const t = $('txtTopicos').value, z = $('txtQuestoes').value;
  if (!t.trim() && !z.trim()) { aviso('Cole o texto da dica primeiro.', true); return; }
  const c = estado.conteudo;
  if ((c.itens.length || c.q.length) && !(await confirmar('Interpretar de novo?', 'Isso substitui os tópicos e as questões que estão em "Conferir e corrigir", inclusive as suas correções.', 'INTERPRETAR'))) return;
  const r = INT.interpretar({ topicos: t, questoes: z });
  estado.conteudo = { f: r.f, o: ofertasMarcadas(), itens: r.cards, q: r.q }; estado.avisos = r.avisos; estado.nao = r.nao;
  marcarSujo(); $('cardEstrutura').hidden = false; renderEstrutura(); $('cardEstrutura').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// campo de texto ligado ao estado (sem redesenhar a tela a cada tecla)
function campo(rotulo, valor, aoMudar, area) {
  const l = el('label', '', rotulo), c = el(area ? 'textarea' : 'input'); if (!area) c.type = 'text';
  c.value = valor || ''; c.addEventListener('input', () => { aoMudar(c.value); marcarSujo(); atualizarPendencias(); }); l.append(c); return l;
}
function botao(rot, fn, cls) { const b = el('button', 'btn mini-btn ' + (cls || 'ghost'), rot); b.type = 'button'; b.addEventListener('click', () => { fn(); marcarSujo(); }); return b; }

function renderEstrutura() {
  const c = estado.conteudo, box = $('estrutura'); box.textContent = '';
  // avisos da interpretação
  const av = $('avisos'); av.textContent = '';
  estado.avisos.forEach((a) => av.append(el('div', 'av ' + a.nivel, (a.nivel === 'erro' ? '⛔ ' : '⚠️ ') + a.msg)));

  box.append(el('p', 'sub-t', 'TÓPICOS (' + c.itens.length + ' ' + (c.itens.length === 1 ? 'card' : 'cards') + ')'));
  c.itens.forEach((g, i) => {
    const it = el('div', 'item'); it.append(el('h3', '', 'Card ' + (i + 1)));
    g.itens.forEach((x, k) => {
      if (g.itens.length > 1) it.append(el('p', 'mini', 'Tópico ' + (k + 1) + ' deste card'));
      it.append(campo('Nome', x.n, (v) => { x.n = v; }), campo('Explicação', x.e, (v) => { x.e = v; }, true), campo('Para memorizar (opcional)', x.m, (v) => { x.m = v; }));
    });
    const ac = el('div', 'acoes');
    if (i > 0) ac.append(botao('↑ Subir', () => { c.itens.splice(i - 1, 0, c.itens.splice(i, 1)[0]); renderEstrutura(); }));
    if (i < c.itens.length - 1) ac.append(botao('↓ Descer', () => { c.itens.splice(i + 1, 0, c.itens.splice(i, 1)[0]); renderEstrutura(); }));
    const prox = c.itens[i + 1];
    if (g.itens.length === 1 && prox && prox.itens.length === 1) ac.append(botao('Juntar com o próximo', () => { g.itens.push(prox.itens[0]); c.itens.splice(i + 1, 1); renderEstrutura(); }));
    if (g.itens.length === 2) ac.append(botao('Separar em 2 cards', () => { c.itens.splice(i + 1, 0, { itens: [g.itens.pop()] }); renderEstrutura(); }));
    ac.append(botao('Remover card', async () => { c.itens.splice(i, 1); renderEstrutura(); }, 'rem'));
    it.append(ac); box.append(it);
  });
  const addC = botao('+ Adicionar card em branco', () => { c.itens.push({ itens: [{ n: '', e: '', m: '' }] }); renderEstrutura(); }); addC.style.marginTop = '12px'; box.append(addC);

  box.append(el('p', 'sub-t', 'FRASE FINAL (opcional)'), campo('Aparece ao concluir as questões', c.f, (v) => { c.f = v; }));

  box.append(el('p', 'sub-t', 'QUESTÕES EXTRAS (' + c.q.length + ')'));
  if (!c.q.length) box.append(el('p', 'mini', 'Sem questões: a dica será publicada sem a rodada de questões.'));
  c.q.forEach((q, qi) => {
    const it = el('div', 'item'); it.append(el('h3', '', 'Questão ' + (qi + 1)), campo('Enunciado', q.e, (v) => { q.e = v; }, true));
    it.append(el('p', 'mini', 'Marque a alternativa correta:'));
    q.a.forEach((txt, k) => {
      const ln = el('div', 'alt'), rd = el('input'); rd.type = 'radio'; rd.name = 'correta-' + qi; rd.checked = q.c === k; rd.setAttribute('aria-label', 'Alternativa ' + 'ABCDEF'[k] + ' é a correta');
      rd.addEventListener('change', () => { q.c = k; marcarSujo(); atualizarPendencias(); });
      const en = el('input'); en.type = 'text'; en.value = txt; en.setAttribute('aria-label', 'Alternativa ' + 'ABCDEF'[k]);
      en.addEventListener('input', () => { q.a[k] = en.value; marcarSujo(); atualizarPendencias(); });
      ln.append(el('strong', '', 'ABCDEF'[k]), rd, en);
      if (q.a.length > 3) ln.append(botao('✕', () => { q.a.splice(k, 1); if (q.c === k) q.c = -1; else if (q.c > k) q.c--; renderEstrutura(); }, 'rem'));
      it.append(ln);
    });
    if (q.a.length < 3) it.append(botao('+ Adicionar alternativa', () => { q.a.push(''); renderEstrutura(); }));
    it.append(campo('Comentário', q.x, (v) => { q.x = v; }, true), campo('Para memorizar (opcional)', q.m, (v) => { q.m = v; }));
    const ac = el('div', 'acoes'); ac.append(botao('Remover questão', () => { c.q.splice(qi, 1); renderEstrutura(); }, 'rem')); it.append(ac); box.append(it);
  });
  if (c.q.length < 10) { const addQ = botao('+ Adicionar questão em branco', () => { c.q.push({ e: '', a: ['', '', ''], c: -1, x: '', m: '' }); renderEstrutura(); }); addQ.style.marginTop = '12px'; box.append(addQ); }

  if (estado.nao.length) {
    box.append(el('p', 'sub-t', 'TRECHOS NÃO APROVEITADOS (' + estado.nao.length + ')'), el('p', 'mini', 'Não consegui classificar com segurança. Decida o que fazer com cada um:'));
    estado.nao.forEach((n, ni) => {
      const b = el('div', 'nao'); b.append(el('strong', '', n.motivo), el('pre', '', n.texto));
      const ac = el('div', 'acoes');
      ac.append(botao('Usar como tópico', () => { const l = n.texto.split('\n'); c.itens.push({ itens: [{ n: l[0], e: l.slice(1).join('\n'), m: '' }] }); estado.nao.splice(ni, 1); renderEstrutura(); }));
      ac.append(botao('Usar como frase final', () => { c.f = n.texto.replace(/^frase\s+final\s*[:\-–—]\s*/i, ''); estado.nao.splice(ni, 1); renderEstrutura(); }));
      ac.append(botao('Descartar', () => { estado.nao.splice(ni, 1); renderEstrutura(); }, 'rem'));
      b.append(ac); box.append(b);
    });
  }
  atualizarPendencias();
}
function pendencias() { return R.validar($('titulo').value, { ...estado.conteudo, o: ofertasMarcadas() }); }
function atualizarPendencias() {
  const p = pendencias(), box = $('pendencias');
  box.className = 'msg ' + (p.length ? 'aviso' : 'ok');
  box.textContent = p.length ? 'Falta corrigir para poder publicar (' + p.length + '):\n• ' + p.join('\n• ') : '✅ Tudo certo para publicar.';
}

// ---------------------------------------------------------------- salvar / prévia / publicar
function coletar() {
  return {
    id: estado.dica ? estado.dica.id : undefined, slug: $('slug').value.trim(), titulo: $('titulo').value.replace(/\s+/g, ' ').trim(),
    texto_original: $('txtTopicos').value, questoes_originais: $('txtQuestoes').value,
    conteudo: { ...estado.conteudo, o: ofertasMarcadas() }, og_imagem_id: estado.imagem ? estado.imagem.id : null,
  };
}
async function salvar() {
  const p = coletar();
  if (!p.titulo) { aviso('Preencha o título.', true); $('titulo').focus(); return false; }
  if (!R.slugValido(p.slug)) { aviso(MENSAGENS.slug_invalido, true); $('slug').focus(); return false; }
  try {
    const r = await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'salvar', ...p } });
    estado.dica = r.dica; estado.sujo = false; renderSituacao(); atualizarSlugInfo(); return true;
  } catch (e) { aviso(msgErro(e), true); return false; }
}
$('btnSalvar').addEventListener('click', async () => { if (await salvar()) aviso('Rascunho salvo ✅'); });
// Prévia. Três cuidados para poder usar "Visualizar" quantas vezes quiser sem recarregar a página:
//  1) numeração dos pedidos: se duas respostas chegarem fora de ordem, a mais antiga é descartada (antes ela sobrescrevia a nova);
//  2) iframe NOVO a cada abertura e em branco ao fechar: nada da vez anterior (rolagem, questão respondida, navegação) sobrevive;
//  3) o botão mostra "ABRINDO…" enquanto o pedido está em andamento (continua clicável: o clique mais novo sempre vence).
let previaSeq = 0;
function iframeNovo() {
  const velho = $('iframePrevia'), novo = el('iframe');
  novo.id = 'iframePrevia'; novo.title = velho.title; novo.setAttribute('sandbox', velho.getAttribute('sandbox'));
  velho.replaceWith(novo); return novo;
}
function previaOcupada(sim) { const b = $('btnPrevia'); b.textContent = sim ? 'ABRINDO…' : 'VISUALIZAR'; b.setAttribute('aria-busy', String(sim)); }
async function abrirPrevia(p) {
  const minha = ++previaSeq; previaOcupada(true);
  try {
    const r = await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'previa', titulo: p.titulo, conteudo: p.conteudo, og_imagem_id: p.og_imagem_id } });
    if (minha !== previaSeq) return;                         // já existe um pedido mais novo: descarta esta resposta
    iframeNovo().srcdoc = r.html;
    if (!$('dlgPrevia').open) $('dlgPrevia').showModal();
  } catch (e) { if (minha === previaSeq) aviso(msgErro(e), true); }
  finally { if (minha === previaSeq) previaOcupada(false); }
}
$('dlgPrevia').addEventListener('close', iframeNovo);        // ao fechar (botão ou Esc): iframe em branco
$('btnPrevia').addEventListener('click', () => { const p = coletar(); if (!p.titulo) { aviso('Preencha o título para visualizar.', true); return; } abrirPrevia(p); });
$('fecharPrevia').addEventListener('click', () => $('dlgPrevia').close());
$('btnPublicar').addEventListener('click', async () => {
  const p = pendencias();
  if (p.length) { aviso('Ainda há ' + p.length + ' pendência(s). Veja em "Conferir e corrigir".', true); $('cardEstrutura').hidden = false; $('pendencias').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  const rep = estado.dica && estado.dica.status === 'publicada';
  if (!(await confirmar(rep ? 'Substituir a versão pública?' : 'Publicar esta dica?', rep ? 'A versão pública atual será trocada por esta. Quem abrir o link verá a nova versão em até 1 minuto.' : 'Ela ficará acessível em /dica/' + $('slug').value + '.', rep ? 'SUBSTITUIR' : 'PUBLICAR'))) return;
  if (!(await salvar())) return;
  try { const r = await api('/api/dicas-admin', { metodo: 'POST', corpo: { acao: 'publicar', id: estado.dica.id, confirmar: !!rep } }); estado.dica = r.dica; renderSituacao(); atualizarSlugInfo(); avisoPublicacao(r); }
  catch (e) { mostrarPendencias(e); }
});
$('btnCopiar').addEventListener('click', () => { if (estado.dica && estado.dica.status === 'publicada') copiar(estado.dica.link); });

// ---------------------------------------------------------------- imagem de compartilhamento
function renderImagemEscolhida() {
  const b = $('imagemEscolhida'); b.textContent = '';
  if (!estado.imagem) { b.append(el('p', 'mini', 'Nenhuma imagem escolhida: o link será compartilhado sem imagem.')); return; }
  const im = el('img'); im.src = estado.imagem.url; im.alt = 'Imagem escolhida: ' + estado.imagem.nome;
  const rm = el('button', 'btn ghost', 'REMOVER IMAGEM'); rm.type = 'button'; rm.addEventListener('click', () => { estado.imagem = null; marcarSujo(); renderImagemEscolhida(); });
  b.append(im, el('p', 'mini', estado.imagem.nome), rm);
}

// ---------------------------------------------------------------- biblioteca de imagens
const lib = { q: '', pagina: 1, paginas: 1, timer: null };
$('btnImagem').addEventListener('click', () => { lib.q = ''; lib.pagina = 1; $('buscaImagem').value = ''; $('dlgImagens').showModal(); carregarImagens(); });
$('fecharImagens').addEventListener('click', () => $('dlgImagens').close());
$('buscaImagem').addEventListener('input', () => { clearTimeout(lib.timer); lib.timer = setTimeout(() => { lib.q = $('buscaImagem').value.trim(); lib.pagina = 1; carregarImagens(); }, 300); });
$('pagAnt').addEventListener('click', () => { if (lib.pagina > 1) { lib.pagina--; carregarImagens(); } });
$('pagProx').addEventListener('click', () => { if (lib.pagina < lib.paginas) { lib.pagina++; carregarImagens(); } });

async function carregarImagens() {
  const g = $('gradeImagens');
  try {
    const r = await api('/api/dicas-imagens?pagina=' + lib.pagina + (lib.q ? '&q=' + encodeURIComponent(lib.q) : ''));
    lib.paginas = r.paginas; g.textContent = '';
    if (!r.imagens.length) g.append(el('p', 'vazio', lib.q ? 'Nenhuma imagem com esse nome.' : 'A biblioteca ainda está vazia. Adicione a primeira imagem acima.'));
    r.imagens.forEach((im) => {
      const m = el('div', 'miniatura' + (estado.imagem && estado.imagem.id === im.id ? ' sel' : ''));
      const esc = el('button', 'escolher'); esc.type = 'button'; esc.setAttribute('aria-label', 'Usar a imagem ' + im.nome);
      const img = el('img'); img.src = im.url; img.alt = im.nome; img.loading = 'lazy';
      esc.append(img, el('div', 'nome', im.nome));
      esc.addEventListener('click', () => { estado.imagem = { id: im.id, nome: im.nome, url: im.url }; marcarSujo(); renderImagemEscolhida(); $('dlgImagens').close(); });
      const ex = el('button', 'btn rem', 'Excluir'); ex.type = 'button';
      ex.addEventListener('click', () => excluirImagem(im));
      m.append(esc, ex); g.append(m);
    });
    $('pagInfo').textContent = 'Página ' + r.pagina + ' de ' + r.paginas + ' · ' + r.total + (r.total === 1 ? ' imagem' : ' imagens');
    $('pagAnt').disabled = lib.pagina <= 1; $('pagProx').disabled = lib.pagina >= lib.paginas;
  } catch (e) { g.textContent = ''; g.append(el('p', 'msg erro', msgErro(e))); }
}
async function excluirImagem(im) {
  $('dlgImagens').close();
  if (await confirmar('Excluir a imagem "' + im.nome + '"?', 'Só é possível se nenhuma dica a estiver usando.', 'EXCLUIR')) {
    try { await api('/api/dicas-imagens', { metodo: 'POST', corpo: { acao: 'excluir', id: im.id } }); aviso('Imagem excluída.'); } catch (e) {
      aviso(e.message === 'imagem_em_uso' && e.dados && e.dados.dicas ? 'Imagem em uso por: ' + e.dados.dicas.join(', ') : msgErro(e), true);
    }
  }
  $('dlgImagens').showModal(); carregarImagens();
}

// --- envio: colar, arrastar/soltar ou escolher arquivo
const MAX_LARGURA = 1200, MAX_ORIGINAL = 25 * 1024 * 1024;
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const paraBase64 = (blob) => new Promise((ok, no) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1]); f.onerror = () => no(new Error('leitura')); f.readAsDataURL(blob); });
async function carregarBitmap(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) { /* tenta o método antigo */ } }
  return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error('imagem_ilegivel')); im.src = u; });
}
async function reduzir(file) {                          // até 1200 px de largura, JPEG: leve para o WhatsApp e para o Supabase
  const bmp = await carregarBitmap(file), w0 = bmp.width, h0 = bmp.height, esc = Math.min(1, MAX_LARGURA / w0);
  const w = Math.max(1, Math.round(w0 * esc)), h = Math.max(1, Math.round(h0 * esc));
  const cv = el('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(bmp, 0, 0, w, h);
  for (const q of [0.85, 0.7, 0.55]) {
    const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', q));
    if (blob && blob.size <= 2.4 * 1024 * 1024) return { blob, w, h };
  }
  throw new Error('imagem_grande');
}
async function processarArquivo(file, indice) {
  const envio = $('envio'); const nomeDigitado = $('nomeImagem').value.trim();
  if (!file.type.startsWith('image/')) { envio.textContent = '“' + file.name + '” não é uma imagem.'; return; }
  if (file.size > MAX_ORIGINAL) { envio.textContent = '“' + file.name + '” é grande demais (máx. 25 MB).'; return; }
  try {
    envio.textContent = 'Processando “' + file.name + '”…';
    const hashOrigem = hex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
    const ja = (await api('/api/dicas-imagens', { metodo: 'POST', corpo: { acao: 'buscar_hash', hash_origem: hashOrigem } })).imagem;
    if (ja) { envio.textContent = 'Essa imagem já está na biblioteca (“' + ja.nome + '”). Não foi duplicada.'; return; }
    const { blob, w, h } = await reduzir(file);
    const generico = /^image\.(png|jpe?g|gif|webp)$/i.test(file.name);                       // imagem colada vem como "image.png"
    const base = nomeDigitado ? nomeDigitado + (indice ? ' ' + (indice + 1) : '') : generico ? 'colada ' + new Date().toLocaleString('pt-BR').replace(/[/:,]/g, '-') : file.name.replace(/\.[^.]+$/, '');
    envio.textContent = 'Enviando…';
    const r = await api('/api/dicas-imagens', { metodo: 'POST', corpo: { acao: 'enviar', nome: base, hash_origem: hashOrigem, dados: await paraBase64(blob), largura: w, altura: h } });
    envio.textContent = r.duplicada ? 'Essa imagem já existia (“' + r.imagem.nome + '”). Não foi duplicada.' : '✅ “' + r.imagem.nome + '” adicionada.';
  } catch (e) { envio.textContent = 'Não consegui adicionar “' + file.name + '”: ' + (e.message === 'imagem_ilegivel' ? 'arquivo de imagem ilegível.' : msgErro(e)); }
}
async function receberArquivos(lista) {
  const arquivos = [...lista].filter(Boolean); if (!arquivos.length) return;
  for (let i = 0; i < arquivos.length; i++) await processarArquivo(arquivos[i], arquivos.length > 1 ? i : 0);
  $('nomeImagem').value = ''; lib.pagina = 1; carregarImagens();
}
$('btnArquivo').addEventListener('click', () => $('arquivo').click());
$('arquivo').addEventListener('change', (e) => { receberArquivos(e.target.files); e.target.value = ''; });
const zona = $('zona');
['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('sobre'); }));
['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.remove('sobre'); }));
zona.addEventListener('drop', (e) => receberArquivos(e.dataTransfer.files));
document.addEventListener('paste', (e) => {
  if (!$('dlgImagens').open) return;
  const arquivos = [...(e.clipboardData ? e.clipboardData.files : [])];
  if (arquivos.length) { e.preventDefault(); receberArquivos(arquivos); }
});
