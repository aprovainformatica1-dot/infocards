/* PAINEL DE DESAFIOS DEVMAPAS — HTML/CSS/JS puro, próprio (não usa nada do Painel de Dicas).
   Fala só com /api/desafios-admin (protegida) e, para ler os materiais, com /api/ofertas (pública, da Central de Ofertas).
   A chave administrativa fica SÓ em memória: recarregar ou fechar a página exige digitar de novo. */
'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const R = window.DesafioRegras;
const estado = { chave: '', desafios: [], d: null, q: [], rows: [], avisos: [], nao: [], slugManual: false, sujo: false, ofertas: null, ofertasErro: '' };

const MENSAGENS = {
  chave_invalida: 'Chave administrativa incorreta.', slug_em_uso: 'Já existe um desafio com esse nome de arquivo. Escolha outro.', slug_invalido: 'Nome de arquivo inválido: use letras minúsculas, números e hífen (mínimo 3 caracteres).',
  slug_travado: 'O nome do arquivo não pode mudar depois que o desafio foi publicado.', titulo_invalido: 'Preencha o título (até 120 caracteres).', conteudo_invalido: 'O desafio ainda tem pendências para publicar.',
  confirmacao_necessaria: 'É preciso confirmar.', limite_excedido: 'Passou do limite (20 questões ou 6 materiais).', nao_encontrado: 'Desafio não encontrado (talvez tenha sido removido).',
  configuracao: 'O servidor não está configurado (faltam variáveis de ambiente na Vercel).', falha_consulta: 'Não consegui ler o banco. Confira se a tabela "desafios" foi criada (supabase-desafios.sql).', falha_gravacao: 'Não consegui gravar no banco.', falha_rede: 'Sem conexão com o servidor. Tente de novo.',
};
const msgErro = (e) => (e && MENSAGENS[e.message]) || 'Algo deu errado (' + ((e && e.message) || 'erro') + ').';

// ---------------------------------------------------------------- utilidades
let toastTimer;
function aviso(t, erro) { const x = $('toast'); x.textContent = t; x.className = 'toast' + (erro ? ' erro' : ''); x.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { x.hidden = true; }, erro ? 7000 : 3500); }
async function api(url, metodo, corpo) {
  let resp;
  try { resp = await fetch(url, { method: metodo || 'GET', headers: { 'x-admin-key': estado.chave, ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); }
  catch (e) { throw Object.assign(new Error('falha_rede'), { status: 0 }); }
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
  catch (e) { const t = el('textarea'); t.value = texto; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch (x) { /* ignora */ } t.remove(); }
  aviso('Link copiado!');
}
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const rotuloStatus = (d) => (d.status === 'publicado' ? (d.alteracoes_pendentes ? 'Publicado · alterações não publicadas' : 'Publicado') : d.status === 'despublicado' ? 'Despublicado' : 'Rascunho');
const classeStatus = (d) => (d.status === 'publicado' ? (d.alteracoes_pendentes ? 'pend' : 'pub') : d.status === 'despublicado' ? 'off' : '');
function mostrar(v) { ['vConectar', 'vLista', 'vEditor'].forEach((id) => { $(id).hidden = id !== v; }); window.scrollTo(0, 0); }
const sujar = () => { estado.sujo = true; };
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
async function carregarLista() { estado.desafios = (await api('/api/desafios-admin')).desafios; renderLista(); }
$('busca').addEventListener('input', renderLista);
$('btnNovo').addEventListener('click', () => abrirEditor(null));
function renderLista() {
  const box = $('lista'); box.textContent = ''; const qt = $('busca').value.trim().toLowerCase();
  const itens = estado.desafios.filter((d) => !qt || d.titulo.toLowerCase().includes(qt) || d.slug.includes(qt));
  if (!itens.length) { box.append(el('p', 'vazio', estado.desafios.length ? 'Nenhum desafio encontrado.' : 'Nenhum desafio ainda. Toque em "+ NOVO DESAFIO".')); return; }
  itens.forEach((d) => {
    const c = el('article', 'desafio');
    c.append(el('h3', '', d.titulo), el('span', 'pill ' + classeStatus(d), rotuloStatus(d)), el('div', 'meta', '/desafio/' + d.slug), el('div', 'meta', 'Atualizado em ' + quando(d.atualizado_em)));
    const ac = el('div', 'acoes');
    const b = (rot, fn, cls) => { const x = el('button', 'btn mini-btn ' + (cls === undefined ? 'ghost' : cls), rot); x.type = 'button'; x.addEventListener('click', fn); ac.append(x); };
    b('Prévia', () => previaDaLista(d)); b('Editar', () => abrirEditor(d.id));
    if (d.status === 'publicado') { b('Abrir', () => window.open(d.link, '_blank', 'noopener')); b('Copiar link', () => copiar(d.link)); if (d.alteracoes_pendentes) b('Publicar alterações', () => publicarDaLista(d), ''); b('Despublicar', () => despublicar(d)); }
    else b('Publicar', () => publicarDaLista(d), '');
    c.append(ac); box.append(c);
  });
}
async function previaDaLista(d) { try { const r = await api('/api/desafios-admin?id=' + d.id); await abrirPrevia({ titulo: r.desafio.titulo, subtitulo: r.desafio.subtitulo, conteudo: r.desafio.conteudo }); } catch (e) { aviso(msgErro(e), true); } }
function mostrarPendencias(e) {
  const det = e && e.dados && e.dados.detalhes;
  aviso(det ? 'Ainda não dá para publicar:\n• ' + det.slice(0, 6).join('\n• ') + (det.length > 6 ? '\n… e mais ' + (det.length - 6) : '') : msgErro(e), true);
}
async function publicarDaLista(d) {
  const rep = d.status === 'publicado';
  if (!(await confirmar(rep ? 'Substituir a versão pública?' : 'Publicar este desafio?', rep ? 'Quem abrir o link verá a nova versão (em até 1 minuto).' : 'Ele ficará acessível em /desafio/' + d.slug + '.', rep ? 'SUBSTITUIR' : 'PUBLICAR'))) return;
  try { const r = await api('/api/desafios-admin', 'POST', { acao: 'publicar', id: d.id, confirmar: rep }); aviso('Desafio publicado! ✅\n' + r.desafio.link); await carregarLista(); } catch (e) { mostrarPendencias(e); }
}
async function despublicar(d) {
  if (!(await confirmar('Despublicar?', 'O link /desafio/' + d.slug + ' deixa de funcionar (em até 1 minuto). Você pode publicar de novo depois.', 'DESPUBLICAR'))) return;
  try { await api('/api/desafios-admin', 'POST', { acao: 'despublicar', id: d.id }); aviso('Desafio despublicado.'); await carregarLista(); if (!$('vEditor').hidden) await recarregarAtual(); } catch (e) { aviso(msgErro(e), true); }
}

// ---------------------------------------------------------------- materiais (Central de Ofertas): primeiro o material, depois o link
async function carregarOfertas() {
  if (estado.ofertas) return;
  try {
    const r = await fetch('/api/ofertas'); const d = await r.json();
    if (!r.ok || !d || d.ok !== true) throw new Error('x');
    estado.ofertas = d.materiais.filter((m) => m.textos && m.textos.length && m.links && m.links.length); estado.ofertasErro = '';
  } catch (e) { estado.ofertasErro = 'Não consegui carregar os materiais da Central de Ofertas agora.'; }
}
const rotuloLink = (l) => l.nome + (l.preco ? ' — ' + l.preco : '');     // identificação e preço: só aqui na administração
async function renderMateriais() {
  await carregarOfertas();
  const box = $('materiais'); box.textContent = ''; $('btnAddMaterial').disabled = !estado.ofertas || estado.rows.length >= R.MAX_CARDS;
  if (estado.ofertasErro) box.append(el('p', 'msg erro', estado.ofertasErro));
  estado.rows.forEach((sel, i) => {
    const b = el('div', 'mat'); b.append(el('h3', '', 'Material ' + (i + 1)));
    const lista = estado.ofertas || [], m = sel && lista.find((x) => x.id === sel.m);
    if (sel && estado.ofertas && !m) b.append(el('p', 'msg erro', 'Este material não está mais disponível na Central de Ofertas (pausado ou removido). Escolha outro ou remova: enquanto isso ele não aparece no desafio.'));
    else if (m && !m.links.some((l) => l.id === sel.l)) b.append(el('p', 'msg erro', 'O link escolhido não existe mais. Escolha outro link.'));
    const lm = el('label', '', 'Material'), sm = el('select'); sm.append(new Option('Escolha o material…', ''));
    lista.forEach((x) => sm.append(new Option(x.nome, x.id))); sm.value = m ? m.id : ''; lm.append(sm); b.append(lm);
    const ll = el('label', '', 'Link'), sl = el('select'); ll.append(sl); b.append(ll);
    const preencherLinks = (mat, atual) => { sl.textContent = ''; if (!mat) { sl.append(new Option('Escolha primeiro o material', '')); sl.disabled = true; return; }
      sl.disabled = false; mat.links.forEach((l) => sl.append(new Option(rotuloLink(l), l.id))); sl.value = mat.links.some((l) => l.id === atual) ? atual : (mat.links.find((l) => l.principal) || mat.links[0]).id; };
    preencherLinks(m, sel && sel.l);
    sm.addEventListener('change', () => { const mat = lista.find((x) => x.id === sm.value); preencherLinks(mat, ''); estado.rows[i] = mat ? { m: mat.id, l: sl.value } : null; sujar(); });
    sl.addEventListener('change', () => { if (estado.rows[i]) estado.rows[i].l = sl.value; sujar(); });
    const rm = el('button', 'btn rem', 'REMOVER MATERIAL'); rm.type = 'button'; rm.addEventListener('click', () => { estado.rows.splice(i, 1); sujar(); renderMateriais(); }); b.append(rm);
    box.append(b);
  });
}
$('btnAddMaterial').addEventListener('click', () => { estado.rows.push(null); sujar(); renderMateriais(); });
const cardsAtuais = () => estado.rows.filter((r) => r && r.m && r.l);

// ---------------------------------------------------------------- editor
async function abrirEditor(id) {
  try {
    let d = null; if (id) d = (await api('/api/desafios-admin?id=' + id)).desafio;
    estado.d = d; estado.slugManual = !!d; estado.avisos = []; estado.nao = [];
    const c = R.normalizar(d ? d.conteudo : {}); estado.q = c.q; estado.rows = c.cards.map((x) => ({ ...x }));
    $('titulo').value = d ? d.titulo : ''; $('subtitulo').value = d ? d.subtitulo || '' : ''; $('slug').value = d ? d.slug : ''; $('texto').value = d ? d.texto_original || '' : '';
    atualizarSlugInfo(); renderSituacao(); $('cardRevisao').hidden = !estado.q.length; renderQuestoes(); await renderMateriais(); estado.sujo = false; mostrar('vEditor');
  } catch (e) { aviso(msgErro(e), true); }
}
async function recarregarAtual() { if (estado.d) { estado.d = (await api('/api/desafios-admin?id=' + estado.d.id)).desafio; renderSituacao(); } }
$('btnVoltar').addEventListener('click', async () => {
  if (estado.sujo && !(await confirmar('Sair sem salvar?', 'Há alterações que ainda não foram salvas como rascunho.', 'SAIR'))) return;
  estado.sujo = false; try { await carregarLista(); } catch (e) { /* mantém a lista antiga */ } mostrar('vLista');
});
function renderSituacao() {
  const d = estado.d;
  $('situacao').textContent = d ? rotuloStatus(d) + (d.publicado_em ? ' · publicado em ' + quando(d.publicado_em) : '') : 'Novo desafio (ainda não salvo)';
  $('btnCopiar').disabled = !(d && d.status === 'publicado'); $('btnDespublicar').hidden = !(d && d.status === 'publicado');
  $('btnPublicar').textContent = d && d.status === 'publicado' ? 'PUBLICAR ALTERAÇÕES' : 'PUBLICAR';
}
const travado = () => !!(estado.d && estado.d.primeira_publicacao_em);
function atualizarSlugInfo() { $('slug').readOnly = travado(); $('slugInfo').textContent = (travado() ? 'O nome do arquivo não muda depois de publicado: ' : 'Endereço público: ') + 'https://devmapas.vercel.app/desafio/' + ($('slug').value || '…'); }
$('titulo').addEventListener('input', () => { sujar(); if (!estado.slugManual && !travado()) { $('slug').value = R.slugify($('titulo').value); atualizarSlugInfo(); } atualizarPendencias(); });
$('subtitulo').addEventListener('input', sujar); $('texto').addEventListener('input', sujar);
$('slug').addEventListener('input', () => { estado.slugManual = true; sujar(); atualizarSlugInfo(); });
$('slug').addEventListener('blur', () => { if (!travado()) { $('slug').value = R.slugify($('slug').value); atualizarSlugInfo(); } });

$('btnInterpretar').addEventListener('click', async () => {
  const t = $('texto').value; if (!t.trim()) { aviso('Cole as questões primeiro.', true); return; }
  if (estado.q.length && !(await confirmar('Interpretar de novo?', 'Isso substitui as questões que estão em "Revisão das questões", inclusive as suas correções.', 'INTERPRETAR'))) return;
  const r = R.interpretar(t); estado.q = r.q; estado.avisos = r.avisos; estado.nao = r.nao; sujar();
  $('cardRevisao').hidden = false; renderQuestoes(); $('cardRevisao').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// --- revisão das questões
function campo(rotulo, valor, aoMudar, area) {
  const l = el('label', '', rotulo), c = el(area ? 'textarea' : 'input'); if (!area) c.type = 'text';
  c.value = valor || ''; c.addEventListener('input', () => { aoMudar(c.value); sujar(); atualizarPendencias(); }); l.append(c); return l;
}
const botao = (rot, fn, cls) => { const b = el('button', 'btn mini-btn ' + (cls || 'ghost'), rot); b.type = 'button'; b.style.marginTop = '10px'; b.addEventListener('click', () => { fn(); sujar(); }); return b; };
function renderQuestoes() {
  const av = $('avisos'); av.textContent = ''; estado.avisos.forEach((a) => av.append(el('div', 'av ' + a.nivel, (a.nivel === 'erro' ? '⛔ ' : '⚠️ ') + a.msg)));
  const box = $('questoes'); box.textContent = ''; box.append(el('p', 'sub-t', 'QUESTÕES (' + estado.q.length + ')'));
  estado.q.forEach((q, qi) => {
    const it = el('div', 'item'); it.append(el('h3', '', 'Questão ' + (qi + 1)));
    const lt = el('label', '', 'Tipo'), st = el('select'); st.append(new Option('Múltipla escolha', 'me'), new Option('Certo ou Errado', 'ce')); st.value = q.t; lt.append(st); it.append(lt);
    st.addEventListener('change', () => { q.t = st.value; q.a = q.t === 'me' ? ['', ''] : []; q.g = -1; sujar(); renderQuestoes(); });
    it.append(campo('Enunciado', q.e, (v) => { q.e = v; }, true));
    it.append(el('p', 'mini', q.t === 'me' ? 'Marque a alternativa correta (gabarito):' : 'Gabarito:'));
    if (q.t === 'ce') ['CERTO', 'ERRADO'].forEach((rot, k) => {
      const ln = el('div', 'alt'), rd = el('input'); rd.type = 'radio'; rd.name = 'g' + qi; rd.checked = q.g === k; rd.setAttribute('aria-label', 'Gabarito ' + rot); rd.addEventListener('change', () => { q.g = k; sujar(); atualizarPendencias(); }); ln.append(rd, el('strong', '', rot)); it.append(ln);
    });
    else {
      q.a.forEach((txt, k) => {
        const ln = el('div', 'alt'), rd = el('input'); rd.type = 'radio'; rd.name = 'g' + qi; rd.checked = q.g === k; rd.setAttribute('aria-label', 'Alternativa ' + 'ABCDE'[k] + ' é a correta'); rd.addEventListener('change', () => { q.g = k; sujar(); atualizarPendencias(); });
        const en = el('input'); en.type = 'text'; en.value = txt; en.setAttribute('aria-label', 'Alternativa ' + 'ABCDE'[k]); en.addEventListener('input', () => { q.a[k] = en.value; sujar(); atualizarPendencias(); });
        ln.append(el('strong', '', 'ABCDE'[k]), rd, en);
        if (q.a.length > R.MIN_ALT) ln.append(botao('✕', () => { q.a.splice(k, 1); if (q.g === k) q.g = -1; else if (q.g > k) q.g--; renderQuestoes(); }, 'rem'));
        it.append(ln);
      });
      if (q.a.length < R.MAX_ALT) it.append(botao('+ Adicionar alternativa', () => { q.a.push(''); renderQuestoes(); }));
    }
    it.append(campo('Comentário', q.x, (v) => { q.x = v; }, true), campo('Para memorizar (opcional)', q.m, (v) => { q.m = v; }, true));
    it.append(botao('Remover questão', () => { estado.q.splice(qi, 1); renderQuestoes(); }, 'rem')); box.append(it);
  });
  const nao = $('nao'); nao.textContent = '';
  if (estado.nao.length) {
    nao.append(el('p', 'sub-t', 'TRECHOS NÃO APROVEITADOS (' + estado.nao.length + ')'));
    estado.nao.forEach((n, ni) => { const b = el('div', 'nao'); b.append(el('strong', '', n.motivo), el('pre', '', n.texto), botao('Descartar', () => { estado.nao.splice(ni, 1); renderQuestoes(); }, 'rem')); nao.append(b); });
  }
  atualizarPendencias();
}
const pendencias = () => R.validar($('titulo').value, { q: estado.q, cards: cardsAtuais() });
function atualizarPendencias() {
  const p = pendencias(), box = $('pendencias'); box.className = 'msg ' + (p.length ? 'aviso' : 'ok');
  box.textContent = p.length ? 'Falta corrigir para poder publicar (' + p.length + '):\n• ' + p.join('\n• ') : '✅ Tudo certo para publicar.';
}

// ---------------------------------------------------------------- salvar / testar / publicar
const coletar = () => ({ id: estado.d ? estado.d.id : undefined, slug: $('slug').value.trim(), titulo: $('titulo').value.replace(/\s+/g, ' ').trim(), subtitulo: $('subtitulo').value.replace(/\s+/g, ' ').trim(),
  texto_original: $('texto').value, conteudo: { q: estado.q, cards: cardsAtuais() } });
async function salvar() {
  const p = coletar();
  if (!p.titulo) { aviso('Preencha o título.', true); $('titulo').focus(); return false; }
  if (!R.slugValido(p.slug)) { aviso(MENSAGENS.slug_invalido, true); $('slug').focus(); return false; }
  try { const r = await api('/api/desafios-admin', 'POST', { acao: 'salvar', ...p }); estado.d = r.desafio; estado.sujo = false; renderSituacao(); atualizarSlugInfo(); return true; }
  catch (e) { aviso(msgErro(e), true); return false; }
}
$('btnSalvar').addEventListener('click', async () => { if (await salvar()) aviso('Rascunho salvo ✅'); });

// Teste: abre a página REAL do desafio (feita pelo servidor) num quadro isolado. Pedidos numerados (o mais novo vence) e quadro novo a cada abertura.
let previaSeq = 0;
function iframeNovo() { const v = $('iframePrevia'), n = el('iframe'); n.id = 'iframePrevia'; n.title = v.title; n.setAttribute('sandbox', v.getAttribute('sandbox')); v.replaceWith(n); return n; }
async function abrirPrevia(p) {
  const minha = ++previaSeq;
  try {
    const r = await api('/api/desafios-admin', 'POST', { acao: 'previa', titulo: p.titulo, subtitulo: p.subtitulo, conteudo: p.conteudo });
    if (minha !== previaSeq) return;
    iframeNovo().srcdoc = r.html; if (!$('dlgPrevia').open) $('dlgPrevia').showModal();
  } catch (e) { if (minha === previaSeq) aviso(msgErro(e), true); }
}
$('dlgPrevia').addEventListener('close', iframeNovo);
$('btnTestar').addEventListener('click', () => {
  const p = coletar(); if (!p.titulo) { aviso('Preencha o título para testar.', true); return; }
  if (!p.conteudo.q.length) { aviso('Interprete as questões antes de testar.', true); return; } abrirPrevia(p);
});
$('fecharPrevia').addEventListener('click', () => $('dlgPrevia').close());
$('btnPublicar').addEventListener('click', async () => {
  const p = pendencias();
  if (p.length) { aviso('Ainda há ' + p.length + ' pendência(s). Veja em "Revisão das questões".', true); $('cardRevisao').hidden = false; $('pendencias').scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
  const rep = estado.d && estado.d.status === 'publicado';
  if (!(await confirmar(rep ? 'Substituir a versão pública?' : 'Publicar este desafio?', rep ? 'A versão pública atual será trocada por esta. Quem abrir o link verá a nova versão em até 1 minuto.' : 'Ele ficará acessível em /desafio/' + $('slug').value + '.', rep ? 'SUBSTITUIR' : 'PUBLICAR'))) return;
  if (!(await salvar())) return;
  try { const r = await api('/api/desafios-admin', 'POST', { acao: 'publicar', id: estado.d.id, confirmar: !!rep }); estado.d = r.desafio; renderSituacao(); atualizarSlugInfo(); aviso('Desafio publicado! ✅\n' + r.desafio.link); }
  catch (e) { mostrarPendencias(e); }
});
$('btnDespublicar').addEventListener('click', () => { if (estado.d && estado.d.status === 'publicado') despublicar(estado.d); });
$('btnCopiar').addEventListener('click', () => { if (estado.d && estado.d.status === 'publicado') copiar(estado.d.link); });
