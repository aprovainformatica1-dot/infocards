/* CENTRAL DE OFERTAS DEVMAPAS — HTML/CSS/JS puro. Fala só com as APIs do próprio site
   (/api/ofertas-admin e /api/dicas-imagens). Nenhuma chave do Supabase existe aqui.
   A chave administrativa fica SÓ em memória (recarregar a página exige digitar de novo).
   Não usa o arquivo config/ofertas.js. */
'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const ESTILOS = [['go a', 'Claro'], ['go b', 'Arroxeado'], ['go wa', 'Verde (WhatsApp)'], ['go gr', 'Verde escuro (WhatsApp)']];
const nomeEstilo = (c) => (ESTILOS.find((e) => e[0] === c) || [0, c])[1];
const estado = { chave: '', ofertas: [], f: null, sujo: false };

const MENSAGENS = {
  chave_invalida: 'Chave administrativa incorreta.', campo_obrigatorio: 'Preencha o campo obrigatório', campo_longo: 'Texto longo demais em', url_invalida: 'Endereço inválido (use http:// ou https://) em',
  estilo_invalido: 'Escolha um dos estilos.', falta_link: 'Cadastre pelo menos um link.', muitos_links: 'No máximo 10 links.', muitas_versoes: 'No máximo 5 versões alternativas.', id_invalido: 'Identificador inválido em',
  imagem_nao_encontrada: 'A imagem da capa não foi encontrada. Envie de novo.', nao_encontrada: 'Oferta não encontrada (talvez já tenha sido removida).', imagem_grande: 'Imagem grande demais.', tipo_nao_aceito: 'Formato de imagem não aceito (use JPG, PNG ou WebP).',
  configuracao: 'O servidor não está configurado (faltam variáveis de ambiente na Vercel).', falha_consulta: 'Não consegui ler o banco. Confira se a migração do banco (supabase-ofertas-v2.sql) foi executada.',
  falha_gravacao: 'Não consegui gravar no banco.', previa_indisponivel: 'A prévia precisa da página da dica com suporte às ofertas da Central.', falha_rede: 'Sem conexão com o servidor. Tente de novo.', falha_storage: 'Não consegui gravar a imagem no Storage.',
};
const msgErro = (e) => { const b = (e && MENSAGENS[e.message]) || 'Algo deu errado (' + ((e && e.message) || 'erro') + ').'; return e && e.campo ? b + ' “' + e.campo + '”.' : b; };

let toastTimer;
function aviso(t, erro) { const x = $('toast'); x.textContent = t; x.className = 'toast' + (erro ? ' erro' : ''); x.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { x.hidden = true; }, erro ? 7000 : 3500); }
async function api(url, metodo, corpo) {
  let resp;
  try { resp = await fetch(url, { method: metodo || 'GET', headers: { 'x-admin-key': estado.chave, ...(corpo ? { 'Content-Type': 'application/json' } : {}) }, body: corpo ? JSON.stringify(corpo) : undefined }); }
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
function mostrar(v) { ['vConectar', 'vLista', 'vForm'].forEach((id) => { $(id).hidden = id !== v; }); window.scrollTo(0, 0); }
const sujar = () => { estado.sujo = true; agendarPrevia(); };
window.addEventListener('beforeunload', (e) => { if (estado.sujo && !$('vForm').hidden) { e.preventDefault(); e.returnValue = ''; } });

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
async function carregar() { estado.ofertas = (await api('/api/ofertas-admin')).ofertas; renderLista(); }
$('busca').addEventListener('input', renderLista);
$('btnNova').addEventListener('click', () => abrirForm(null));

function renderLista() {
  const box = $('lista'); box.textContent = '';
  const q = $('busca').value.trim().toLowerCase();
  const itens = estado.ofertas.filter((o) => !q || o.nome.toLowerCase().includes(q) || (o.principal.titulo || '').toLowerCase().includes(q))
    .sort((a, b) => String(b.atualizado_em).localeCompare(String(a.atualizado_em)));
  if (!itens.length) { box.append(el('p', 'vazio', estado.ofertas.length ? 'Nenhuma oferta encontrada.' : 'Nenhuma oferta ainda. Toque em "+ NOVA OFERTA".')); return; }
  itens.forEach((o) => {
    const b = el('button', 'item' + (o.pausado ? ' pausada' : '')); b.type = 'button'; b.setAttribute('aria-label', 'Editar ' + o.nome);
    const capa = el('span', 'mini-capa'); if (o.capa) capa.style.backgroundImage = 'url("' + o.capa.url.replace(/"/g, '%22') + '")'; else capa.textContent = '🎁'; capa.setAttribute('aria-hidden', 'true');
    const t = el('span', 'txt'); t.append(el('span', 'nome', o.nome), el('span', 'sub', o.principal.titulo || '(sem título)'));
    const p = el('span'); p.append(el('span', 'pill', nomeEstilo(o.estilo)), el('span', 'pill', o.links.length + (o.links.length === 1 ? ' link' : ' links')));
    if (o.pausado) p.append(el('span', 'pill off', 'Pausada')); t.append(p);
    b.append(capa, t); b.addEventListener('click', () => abrirForm(o)); box.append(b);
  });
}

// ---------------------------------------------------------------- formulário
function novoForm(o) {
  return o ? JSON.parse(JSON.stringify({ id: o.id, nome: o.nome, estilo: o.estilo, capa: o.capa, capaOriginal: o.capa, principal: { id: o.principal.id, titulo: o.principal.titulo, texto: o.principal.texto, botao: o.principal.botao },
    alternativas: o.alternativas.map((a) => ({ id: a.id, nome: a.nome, titulo: a.titulo, texto: a.texto, botao: a.botao })), links: o.links.map((l) => ({ id: l.id, nome: l.nome, url: l.url, preco: l.preco })), pausado: o.pausado }))
    : { id: null, nome: '', estilo: 'go a', capa: null, capaOriginal: null, principal: { id: null, titulo: '', texto: '', botao: '' }, alternativas: [], links: [{ id: null, nome: '', url: '', preco: '' }], pausado: false };
}
function abrirForm(o) {
  estado.f = novoForm(o); estado.sujo = false; const f = estado.f;
  $('formTitulo').textContent = o ? 'Editar oferta' : 'Nova oferta';
  $('fNome').value = f.nome; $('fTitulo').value = f.principal.titulo; $('fTexto').value = f.principal.texto; $('fBotao').value = f.principal.botao;
  renderEstilos(); renderCapa(); renderLinks(); renderAlts(); $('alts').open = f.alternativas.length > 0; atualizarPausar();
  mostrar('vForm'); previa();
}
$('btnVoltar').addEventListener('click', async () => {
  if (estado.sujo && !(await confirmar('Sair sem salvar?', 'Há alterações que ainda não foram salvas.', 'SAIR'))) return;
  estado.sujo = false; estado.f = null; renderLista(); mostrar('vLista');
});
[['fNome', (f, v) => { f.nome = v; }], ['fTitulo', (f, v) => { f.principal.titulo = v; }], ['fTexto', (f, v) => { f.principal.texto = v; }], ['fBotao', (f, v) => { f.principal.botao = v; }]]
  .forEach(([id, set]) => $(id).addEventListener('input', () => { set(estado.f, $(id).value); sujar(); }));

function renderEstilos() {
  const box = $('estilos'); box.textContent = '';
  ESTILOS.forEach(([valor, rotulo]) => {
    const l = el('label', 'estilo'), r = el('input'); r.type = 'radio'; r.name = 'estilo'; r.value = valor; r.checked = estado.f.estilo === valor;
    r.addEventListener('change', () => { estado.f.estilo = valor; sujar(); }); l.append(r, el('span', '', rotulo)); box.append(l);
  });
}

// --- links (identificação interna, URL e preço: só para a administração)
function campo(rotulo, valor, aoMudar, opcoes) {
  const l = el('label', '', rotulo), c = el(opcoes && opcoes.area ? 'textarea' : 'input'); if (!(opcoes && opcoes.area)) c.type = (opcoes && opcoes.tipo) || 'text';
  c.value = valor || ''; if (opcoes && opcoes.max) c.maxLength = opcoes.max; if (opcoes && opcoes.ph) c.placeholder = opcoes.ph;
  c.addEventListener('input', () => { aoMudar(c.value); sujar(); }); l.append(c); return l;
}
const botao = (rot, fn, cls) => { const b = el('button', 'btn mini-btn ' + (cls || 'ghost'), rot); b.type = 'button'; b.style.marginTop = '10px'; b.addEventListener('click', fn); return b; };
function renderLinks() {
  const box = $('links'); box.textContent = ''; const ls = estado.f.links;
  ls.forEach((l, i) => {
    const b = el('div', 'bloco'); b.append(el('h3', '', 'Link ' + (i + 1) + (i === 0 ? ' (sugerido)' : '')));
    b.append(campo('Identificação interna', l.nome, (v) => { l.nome = v; }, { max: 80, ph: 'Ex.: Checkout à vista' }), campo('URL de destino', l.url, (v) => { l.url = v; }, { tipo: 'url', ph: 'https://' }), campo('Preço (opcional)', l.preco, (v) => { l.preco = v; }, { max: 40, ph: 'Ex.: R$ 47,00' }));
    if (ls.length > 1) b.append(botao('REMOVER LINK', () => { ls.splice(i, 1); renderLinks(); sujar(); }, 'rem'));
    box.append(b);
  });
  $('btnAddLink').disabled = ls.length >= 10;
}
$('btnAddLink').addEventListener('click', () => { estado.f.links.push({ id: null, nome: '', url: '', preco: '' }); renderLinks(); sujar(); });

// --- versões alternativas de texto
function renderAlts() {
  const box = $('altLista'); box.textContent = ''; const as = estado.f.alternativas;
  as.forEach((a, i) => {
    const b = el('div', 'bloco'); b.append(el('h3', '', 'Versão ' + (i + 1)));
    b.append(campo('Nome da versão', a.nome, (v) => { a.nome = v; }, { max: 80, ph: 'Ex.: Mais curto' }), campo('Título de destaque', a.titulo, (v) => { a.titulo = v; }, { max: 200 }),
      campo('Texto', a.texto, (v) => { a.texto = v; }, { area: true, max: 1500 }), campo('Texto do botão', a.botao, (v) => { a.botao = v; }, { max: 60 }));
    b.append(botao('REMOVER VERSÃO', () => { as.splice(i, 1); renderAlts(); sujar(); }, 'rem')); box.append(b);
  });
  $('btnAddAlt').disabled = as.length >= 5;
}
$('btnAddAlt').addEventListener('click', () => { const p = estado.f.principal; estado.f.alternativas.push({ id: null, nome: '', titulo: '', texto: '', botao: p.botao }); renderAlts(); sujar(); });

// ---------------------------------------------------------------- capa (colar, arrastar ou escolher arquivo; guardada no Supabase Storage)
function renderCapa() {
  const c = estado.f.capa, m = $('capaMiniatura');
  m.style.backgroundImage = c ? 'url("' + c.url.replace(/"/g, '%22') + '")' : ''; m.textContent = c ? '' : 'Sem capa';
  $('btnCapaRemover').hidden = !c; $('btnCapa').textContent = c ? 'TROCAR IMAGEM' : 'ESCOLHER ARQUIVO';
}
const infoCapa = (t) => { $('capaInfo').textContent = t; };
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const paraBase64 = (blob) => new Promise((ok, no) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1]); f.onerror = () => no(new Error('leitura')); f.readAsDataURL(blob); });
async function bitmap(file) {
  if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) { /* tenta o método antigo */ } }
  return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error('imagem_ilegivel')); im.src = u; });
}
async function reduzir(file) {                                // até 600 px de largura, JPEG: leve e suficiente para a capa do card
  const bmp = await bitmap(file), esc = Math.min(1, 600 / bmp.width), w = Math.max(1, Math.round(bmp.width * esc)), h = Math.max(1, Math.round(bmp.height * esc));
  const cv = el('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h); cx.drawImage(bmp, 0, 0, w, h);
  for (const q of [0.88, 0.72, 0.55]) { const blob = await new Promise((ok) => cv.toBlob(ok, 'image/jpeg', q)); if (blob && blob.size <= 2.4 * 1024 * 1024) return { blob, w, h }; }
  throw new Error('imagem_grande');
}
async function enviarCapa(file) {
  if (!file || !file.type.startsWith('image/')) { infoCapa('Esse arquivo não é uma imagem.'); return; }
  if (file.size > 25 * 1024 * 1024) { infoCapa('Imagem grande demais (máx. 25 MB).'); return; }
  try {
    infoCapa('Processando…');
    const hashOrigem = hex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));
    let img = (await api('/api/dicas-imagens', 'POST', { acao: 'buscar_hash', hash_origem: hashOrigem })).imagem;          // mesma imagem já guardada? reaproveita
    if (!img) {
      const { blob, w, h } = await reduzir(file); infoCapa('Enviando…');
      const generico = /^image\.(png|jpe?g|gif|webp)$/i.test(file.name);                                                 // imagem colada vem como "image.png"
      const nome = generico ? 'capa ' + new Date().toLocaleString('pt-BR').replace(/[/:,]/g, '-') : file.name.replace(/\.[^.]+$/, '');
      img = (await api('/api/dicas-imagens', 'POST', { acao: 'enviar', nome, hash_origem: hashOrigem, dados: await paraBase64(blob), largura: w, altura: h })).imagem;
    }
    estado.f.capa = { id: img.id, url: img.url }; renderCapa(); infoCapa('Capa pronta. Ou cole/arraste outra imagem para trocar.'); sujar();
  } catch (e) { infoCapa('Não consegui usar essa imagem: ' + (e.message === 'imagem_ilegivel' ? 'arquivo ilegível.' : msgErro(e))); }
}
$('btnCapa').addEventListener('click', () => $('arquivoCapa').click());
$('arquivoCapa').addEventListener('change', (e) => { enviarCapa(e.target.files[0]); e.target.value = ''; });
$('btnCapaRemover').addEventListener('click', () => { estado.f.capa = null; renderCapa(); infoCapa('Capa removida. Salve para confirmar.'); sujar(); });
const zona = $('capaBox');
['dragenter', 'dragover'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add('sobre'); }));
['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.remove('sobre'); }));
zona.addEventListener('drop', (e) => enviarCapa(e.dataTransfer.files[0]));
document.addEventListener('paste', (e) => {
  if ($('vForm').hidden || !e.clipboardData || !e.clipboardData.files.length) return;
  e.preventDefault(); enviarCapa(e.clipboardData.files[0]);
});

// ---------------------------------------------------------------- prévia (a página real da dica, feita pelo servidor)
let previaSeq = 0, previaTimer = null;
function agendarPrevia() { clearTimeout(previaTimer); previaTimer = setTimeout(previa, 700); }
function iframeNovo() { const v = $('iframePrevia'), n = el('iframe'); n.id = 'iframePrevia'; n.title = v.title; n.setAttribute('sandbox', v.getAttribute('sandbox')); v.replaceWith(n); return n; }
async function previa() {
  const f = estado.f; if (!f) return; const minha = ++previaSeq; $('previaEstado').textContent = 'Atualizando…';
  try {
    const r = await api('/api/ofertas-admin', 'POST', { acao: 'previa', oferta: { estilo: f.estilo, titulo: f.principal.titulo, texto: f.principal.texto, botao: f.principal.botao, capa_url: f.capa ? f.capa.url : '', link: (f.links[0] || {}).url } });
    if (minha !== previaSeq) return;                         // chegou uma resposta mais nova: descarta esta
    iframeNovo().srcdoc = r.html; $('previaEstado').textContent = '';
  } catch (e) { if (minha === previaSeq) $('previaEstado').textContent = 'Prévia indisponível: ' + msgErro(e); }
}

// ---------------------------------------------------------------- salvar e pausar
function atualizarPausar() { const b = $('btnPausar'), f = estado.f; b.hidden = !f.id; b.textContent = f.pausado ? 'REATIVAR OFERTA' : 'PAUSAR OFERTA'; }
function aplicar(oferta) {
  const i = estado.ofertas.findIndex((o) => o.id === oferta.id); if (i >= 0) estado.ofertas[i] = oferta; else estado.ofertas.push(oferta);
}
$('btnSalvar').addEventListener('click', async () => {
  const f = estado.f; if (!f) return; const b = $('btnSalvar'); b.disabled = true;
  try {
    const r = await api('/api/ofertas-admin', 'POST', { acao: 'salvar', oferta: { id: f.id, nome: f.nome, estilo: f.estilo, capa_imagem_id: f.capa ? f.capa.id : null, manter_capa_atual: !!f.id && JSON.stringify(f.capa) === JSON.stringify(f.capaOriginal), principal: f.principal, alternativas: f.alternativas, links: f.links } });
    aplicar(r.oferta); estado.f = novoForm(r.oferta); estado.sujo = false; renderLinks(); renderAlts(); renderCapa(); atualizarPausar(); $('formTitulo').textContent = 'Editar oferta'; aviso('Oferta salva ✅');
  } catch (e) { aviso(msgErro(e), true); } finally { b.disabled = false; }
});
$('btnPausar').addEventListener('click', async () => {
  const f = estado.f; if (!f || !f.id) return;
  if (!f.pausado && !(await confirmar('Pausar "' + f.nome + '"?', 'Ela some da lista do Painel de Dicas e das dicas publicadas que a usam. Você pode reativar quando quiser.', 'PAUSAR'))) return;
  try { const r = await api('/api/ofertas-admin', 'POST', { acao: 'pausar', id: f.id, pausado: !f.pausado }); aplicar(r.oferta); f.pausado = r.oferta.pausado; atualizarPausar(); aviso(f.pausado ? 'Oferta pausada.' : 'Oferta reativada ✅'); }
  catch (e) { aviso(msgErro(e), true); }
});
