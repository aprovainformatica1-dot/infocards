/* GERENCIADOR DE PÁGINAS DE VENDA — HTML/CSS/JS puro. Fala com /api/paginas-venda-admin (protegida) e, para enviar imagens,
   com a biblioteca de imagens que já existe (/api/dicas-imagens, Supabase Storage). Nenhuma chave do Supabase existe aqui.
   A chave administrativa fica SÓ em memória: recarregar ou fechar a página exige digitar de novo. */
'use strict';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const R = window.PaginaRegras;
const estado = { chave: '', paginas: [], p: null, d: R.padrao(), passo: 0, slug: '', slugManual: false, sujo: false, rel: null, texto: '' };

const PASSOS = ['Colar texto', 'Identificação', 'Cores', 'Cabeçalho', 'Hero', 'Pratique com estratégia', 'Quer ir além?', 'Depoimentos', 'Ofertas', 'Dúvidas frequentes', 'Suporte e rodapé'];
const PASSO_SECAO = [null, null, null, 'cabecalho', 'hero', 'estrategia', 'alem', 'depoimentos', 'ofertas', 'faq', 'suporte'];
// Resolução recomendada, mostrada junto de cada campo de imagem (são recomendações, não limites). Baseadas em como o site exibe cada imagem.
const IMG = {
  capa: { rec: '1000 px de largura — ex.: 1000 × 1250 px (4:5, vertical) ou 1000 × 1000 px (1:1)', nota: 'No site ela aparece com até 480 px de largura; o dobro garante nitidez no celular. A altura é livre (não corta). PNG preserva fundo transparente.', max: 1200, png: true },
  mapa: { rec: '1600 a 2000 px de largura, na proporção original', nota: 'Não corta: o mapa aparece inteiro. Quanto mais larga, mais legível o texto no celular. Prefira PNG.', max: 2000, png: true },
  depoimento: { rec: '1080 × 1920 px (9:16, vertical)', nota: 'Formato de prints e Stories. Mínimo recomendado: 720 × 1280 px. A área de exibição tem até 400 px de largura.', max: 1080, png: true },
};
const MENSAGENS = {
  chave_invalida: 'Chave administrativa incorreta.', slug_em_uso: 'Já existe uma página com esse endereço. Escolha outro.', dados_invalidos: 'Há campos a corrigir.', limite_excedido: 'Passou do limite de itens de uma lista.', conteudo_grande: 'Conteúdo grande demais.',
  imagem_nao_encontrada: 'Uma das imagens enviadas não foi encontrada na biblioteca. Envie de novo.', nao_encontrada: 'Página não encontrada.', configuracao: 'O servidor não está configurado (faltam variáveis de ambiente na Vercel).',
  falha_consulta: 'Não consegui ler o banco. Confira se as tabelas foram criadas (supabase-paginas-venda.sql).', falha_gravacao: 'Não consegui gravar no banco.', falha_rede: 'Sem conexão com o servidor. Tente de novo.', imagem_grande: 'Imagem grande demais.', tipo_nao_aceito: 'Formato não aceito (use JPG, PNG ou WebP).', falha_storage: 'Não consegui gravar a imagem no Storage.',
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
async function copiar(texto, msg) {
  try { await navigator.clipboard.writeText(texto); } catch (e) { const t = el('textarea'); t.value = texto; t.style.cssText = 'position:fixed;opacity:0'; document.body.append(t); t.select(); try { document.execCommand('copy'); } catch (x) { /* ignora */ } t.remove(); }
  aviso(msg || 'Copiado!');
}
const quando = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
function mostrar(v) { ['vConectar', 'vLista', 'vEditor'].forEach((id) => { $(id).hidden = id !== v; }); window.scrollTo(0, 0); }
const sujar = () => { estado.sujo = true; };
window.addEventListener('beforeunload', (e) => { if (estado.sujo && !$('vEditor').hidden) { e.preventDefault(); e.returnValue = ''; } });
const mover = (arr, i, dv) => { const j = i + dv; if (j < 0 || j >= arr.length) return; arr.splice(j, 0, arr.splice(i, 1)[0]); };

// ---------------------------------------------------------------- conexão e lista
$('btnConectar').addEventListener('click', conectar);
$('chave').addEventListener('keydown', (e) => { if (e.key === 'Enter') conectar(); });
async function conectar() {
  const v = $('chave').value.trim(); $('erroConexao').hidden = true;
  if (!v) { $('erroConexao').textContent = 'Digite a chave administrativa.'; $('erroConexao').hidden = false; return; }
  estado.chave = v;
  try { await carregarLista(); $('chave').value = ''; mostrar('vLista'); } catch (e) { estado.chave = ''; $('erroConexao').textContent = msgErro(e); $('erroConexao').hidden = false; mostrar('vConectar'); }
}
async function carregarLista() { estado.paginas = (await api('/api/paginas-venda-admin')).paginas; renderLista(); }
$('busca').addEventListener('input', renderLista);
$('btnNova').addEventListener('click', () => abrirEditor(null));
function renderLista() {
  const box = $('lista'); box.textContent = ''; const q = $('busca').value.trim().toLowerCase();
  const itens = estado.paginas.filter((p) => !q || p.nome.toLowerCase().includes(q) || p.slug.includes(q));
  if (!itens.length) { box.append(el('p', 'vazio', estado.paginas.length ? 'Nenhuma página encontrada.' : 'Nenhuma página ainda. Toque em "+ NOVA PÁGINA".')); return; }
  itens.forEach((p) => {
    const c = el('article', 'pagina'); c.append(el('h3', '', p.nome), el('span', 'pill' + (p.publicada ? ' pub' : ''), p.publicada ? 'Publicada' : 'Rascunho'), el('div', 'meta', '/venda/' + p.slug), el('div', 'meta', 'Atualizada em ' + quando(p.atualizado_em)));
    const ac = el('div', 'acoes'); const b = (rot, fn) => { const x = el('button', 'btn ghost mini-btn', rot); x.type = 'button'; x.addEventListener('click', fn); ac.append(x); };
    b('Editar', () => abrirEditor(p.id)); b('Visualizar', async () => { try { const r = await api('/api/paginas-venda-admin?id=' + p.id); await abrirPrevia(r.pagina.dados); } catch (e) { aviso(msgErro(e), true); } });
    if (p.publicada) { b('Abrir', () => window.open(p.link, '_blank', 'noopener')); b('Copiar link', () => copiar(p.link, 'Link copiado!')); }
    c.append(ac); box.append(c);
  });
}

// ---------------------------------------------------------------- editor
async function abrirEditor(id) {
  try {
    if (id) { const r = (await api('/api/paginas-venda-admin?id=' + id)).pagina; estado.p = r; estado.d = R.normalizar(r.dados); estado.slug = r.slug; estado.slugManual = true; }
    else { estado.p = null; estado.d = R.padrao(); estado.slug = ''; estado.slugManual = false; }
    estado.passo = id ? 1 : 0; estado.sujo = false; estado.rel = null; estado.texto = ''; renderSituacao(); renderPasso(); mostrar('vEditor');
  } catch (e) { aviso(msgErro(e), true); }
}
$('btnVoltar').addEventListener('click', async () => {
  if (estado.sujo && !(await confirmar('Sair sem salvar?', 'Há alterações que ainda não foram salvas.', 'SAIR'))) return;
  estado.sujo = false; try { await carregarLista(); } catch (e) { /* mantém a lista */ } mostrar('vLista');
});
function renderSituacao() {
  const p = estado.p; $('situacao').textContent = p ? (p.publicada ? 'Publicada' : 'Rascunho') + ' · /venda/' + p.slug : 'Nova página (ainda não salva)';
  $('btnPublicar').textContent = p && p.publicada ? 'DESPUBLICAR' : 'PUBLICAR'; $('btnCopiar').disabled = !(p && p.publicada);
}
function renderNavSemRefazer() { const nav = $('passos'); if (!nav) return; nav.querySelectorAll('.passo').forEach((b, i) => { const o = b.querySelector('.oculta'); if (o) o.remove(); if (PASSO_SECAO[i] && estado.d[PASSO_SECAO[i]] && estado.d[PASSO_SECAO[i]].visivel === false) b.append(el('small', 'oculta', ' · oculta')); }); }
function renderPasso() {
  const nav = $('passos'); nav.textContent = '';
  PASSOS.forEach((nome, i) => { const b = el('button', 'passo'); b.type = 'button'; b.append(el('b', '', String(i + 1)), document.createTextNode(nome)); if (PASSO_SECAO[i] && estado.d[PASSO_SECAO[i]] && estado.d[PASSO_SECAO[i]].visivel === false) b.append(el('small', 'oculta', ' · oculta')); if (i === estado.passo) b.setAttribute('aria-current', 'step'); b.addEventListener('click', () => { estado.passo = i; renderPasso(); }); nav.append(b); });
  const c = $('conteudo'); c.textContent = ''; [passoRapido, passoIdent, passoCores, passoCabecalho, passoHero, passoEstrategia, passoAlem, passoDepoimentos, passoOfertas, passoFaq, passoSuporte][estado.passo](c);
  $('btnAnt').disabled = estado.passo === 0; $('btnProx').disabled = estado.passo === PASSOS.length - 1;
  const ativo = nav.querySelector('[aria-current]'); if (ativo && ativo.scrollIntoView) ativo.scrollIntoView({ block: 'nearest', inline: 'center' });
}
$('btnAnt').addEventListener('click', () => { if (estado.passo > 0) { estado.passo--; renderPasso(); window.scrollTo(0, 0); } });
$('btnProx').addEventListener('click', () => { if (estado.passo < PASSOS.length - 1) { estado.passo++; renderPasso(); window.scrollTo(0, 0); } });

// ---------------------------------------------------------------- componentes de formulário (todos escrevem direto em estado.d)
function campo(alvo, rotulo, obj, chave, opcoes) {
  const o = opcoes || {}, l = el('label', '', rotulo), c = el(o.area ? 'textarea' : 'input'); if (!o.area) c.type = o.tipo || 'text';
  c.value = obj[chave] == null ? '' : obj[chave]; if (o.max) c.maxLength = o.max; if (o.ph) c.placeholder = o.ph;
  c.addEventListener('input', () => { obj[chave] = o.numero ? (c.value === '' ? null : Number(c.value)) : c.value; sujar(); if (o.aoMudar) o.aoMudar(c.value); }); l.append(c);
  if (o.dica) l.append(el('small', '', ' ' + o.dica)); alvo.append(l); return c;
}
const titulo = (alvo, t, d) => { alvo.append(el('h2', '', t)); if (d) alvo.append(el('small', '', d)); };
function acoesItem(arr, i, refazer) {
  const ln = el('div', 'linha-acoes');
  [['↑ Subir', -1], ['↓ Descer', 1]].forEach(([rot, dv]) => { const b = el('button', 'btn ghost mini-btn', rot); b.type = 'button'; b.disabled = (dv < 0 && i === 0) || (dv > 0 && i === arr.length - 1); b.addEventListener('click', () => { mover(arr, i, dv); sujar(); refazer(); }); ln.append(b); });
  const r = el('button', 'btn rem mini-btn', 'Remover'); r.type = 'button'; r.addEventListener('click', () => { arr.splice(i, 1); sujar(); refazer(); }); ln.append(r); return ln;
}
function botaoAdd(rot, fn, off) { const b = el('button', 'btn ghost', rot); b.type = 'button'; b.disabled = !!off; b.addEventListener('click', fn); return b; }
function listaTextos(alvo, arr, max, rotuloItem, ph) {         // lista simples de textos (itens incluídos, garantias): adicionar, remover, ordenar
  const box = el('div'); alvo.append(box);
  const refazer = () => { box.textContent = ''; arr.forEach((t, i) => { const b = el('div', 'bloco'); const w = { v: t }; const c = campo(b, rotuloItem + ' ' + (i + 1), { v: t }, 'v', { max: 200, ph }); c.addEventListener('input', () => { arr[i] = c.value; }); b.append(acoesItem(arr, i, refazer)); box.append(b); }); box.append(botaoAdd('+ ADICIONAR', () => { arr.push(''); sujar(); refazer(); }, arr.length >= max)); };
  refazer();
}

// ---------------------------------------------------------------- imagens: arquivo ou URL, prévia, substituir, remover (biblioteca de imagens já existente)
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const paraBase64 = (blob) => new Promise((ok, no) => { const f = new FileReader(); f.onload = () => ok(String(f.result).split(',')[1]); f.onerror = () => no(new Error('leitura')); f.readAsDataURL(blob); });
async function bitmap(file) { if (window.createImageBitmap) { try { return await createImageBitmap(file); } catch (e) { /* tenta o método antigo */ } } return new Promise((ok, no) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); ok(im); }; im.onerror = () => no(new Error('imagem_ilegivel')); im.src = u; }); }
async function reduzir(file, cfg) {                         // só reduz se passar da largura máxima; PNG primeiro (texto nítido), JPEG como reserva
  const bmp = await bitmap(file), esc = Math.min(1, cfg.max / bmp.width), w = Math.max(1, Math.round(bmp.width * esc)), h = Math.max(1, Math.round(bmp.height * esc));
  const cv = el('canvas'); cv.width = w; cv.height = h; const cx = cv.getContext('2d'); cx.drawImage(bmp, 0, 0, w, h); const LIM = 2.4 * 1024 * 1024;
  if (cfg.png) { const png = await new Promise((ok) => cv.toBlob(ok, 'image/png')); if (png && png.size <= LIM) return { blob: png, w, h }; }
  const cv2 = el('canvas'); cv2.width = w; cv2.height = h; const c2 = cv2.getContext('2d'); c2.fillStyle = '#fff'; c2.fillRect(0, 0, w, h); c2.drawImage(bmp, 0, 0, w, h);
  for (const q of [0.92, 0.82, 0.68, 0.55]) { const blob = await new Promise((ok) => cv2.toBlob(ok, 'image/jpeg', q)); if (blob && blob.size <= LIM) return { blob, w, h }; }
  throw new Error('imagem_grande');
}
async function enviarArquivo(file, tipo) {
  if (!file || !file.type.startsWith('image/')) throw new Error('tipo_nao_aceito');
  if (file.size > 25 * 1024 * 1024) throw new Error('imagem_grande');
  const cfg = IMG[tipo], dados = new Uint8Array(await file.arrayBuffer()), suf = new TextEncoder().encode('|' + cfg.max + '|' + (cfg.png ? 'png' : 'jpg'));
  const tudo = new Uint8Array(dados.length + suf.length); tudo.set(dados); tudo.set(suf, dados.length);
  const hashOrigem = hex(await crypto.subtle.digest('SHA-256', tudo));          // o mesmo arquivo com outra finalidade (outro tamanho) não reaproveita a versão menor
  let im = (await api('/api/dicas-imagens', 'POST', { acao: 'buscar_hash', hash_origem: hashOrigem })).imagem;
  if (!im) { const { blob, w, h } = await reduzir(file, cfg); im = (await api('/api/dicas-imagens', 'POST', { acao: 'enviar', nome: file.name.replace(/\.[^.]+$/, '').slice(0, 70) || 'imagem', hash_origem: hashOrigem, dados: await paraBase64(blob), largura: w, altura: h })).imagem; }
  return { url: im.url, id: im.id };
}
// ---- seletor de imagens JÁ CADASTRADAS: reúne as imagens usadas nesta página e nas outras páginas de venda salvas (miniaturas).
//      Escolher uma imagem só copia a referência (url + id): nada é enviado de novo e nada é apagado da biblioteca.
async function imagensConhecidas() {
  const mapa = new Map(); const add = (i) => { if (i && i.url && !mapa.has(i.url)) mapa.set(i.url, { url: i.url, id: i.id || null }); };
  const d0 = R.normalizar(estado.d); add(d0.hero.imagem); d0.alem.mapas.forEach((x) => add(x.imagem)); d0.depoimentos.itens.forEach((x) => add(x.imagem));
  const outras = estado.paginas.filter((p) => !(estado.p && p.id === estado.p.id));
  for (let i = 0; i < outras.length; i += 4) {
    await Promise.all(outras.slice(i, i + 4).map(async (p) => { try { const d = R.normalizar((await api('/api/paginas-venda-admin?id=' + p.id)).pagina.dados); add(d.hero.imagem); d.alem.mapas.forEach((x) => add(x.imagem)); d.depoimentos.itens.forEach((x) => add(x.imagem)); } catch (e) { /* ignora uma página que falhou */ } }));
  }
  return [...mapa.values()];
}
function escolherImagem(multiplo) {
  return new Promise((resolver) => {
    const dlg = el('dialog', 'grande'), topo = el('div', 'dlg-topo'), grade = el('div', 'bib-grade'), rod = el('div', 'dlg-acoes'); dlg.append(topo, grade, rod);
    const fechar = el('button', 'btn ghost fechar', 'FECHAR'), ok = el('button', 'btn', multiplo ? 'ADICIONAR SELECIONADAS' : 'USAR A SELECIONADA'); fechar.type = ok.type = 'button'; ok.disabled = true;
    topo.append(el('strong', '', multiplo ? 'Escolha uma ou mais imagens já usadas' : 'Escolha uma imagem já usada'), fechar); rod.append(ok);
    const sel = []; let feito = false; const fim = (v) => { if (feito) return; feito = true; dlg.close(); dlg.remove(); resolver(v); };
    fechar.addEventListener('click', () => fim([])); dlg.addEventListener('close', () => fim([])); ok.addEventListener('click', () => fim(sel.slice()));
    document.body.append(dlg); dlg.showModal(); grade.append(el('p', 'vazio', 'Carregando imagens…'));
    imagensConhecidas().then((lista) => {
      grade.textContent = ''; if (!lista.length) { grade.append(el('p', 'vazio', 'Ainda não há imagens usadas em nenhuma página. Envie um arquivo.')); return; }
      lista.forEach((im) => { const b = el('button', 'bib-item'); b.type = 'button'; const i = el('img'); i.src = im.url; i.alt = 'Miniatura'; i.loading = 'lazy'; b.append(i);
        b.addEventListener('click', () => { const k = sel.indexOf(im); if (multiplo) { if (k >= 0) sel.splice(k, 1); else sel.push(im); b.classList.toggle('on', k < 0); } else { sel.length = 0; sel.push(im); grade.querySelectorAll('.bib-item.on').forEach((x) => x.classList.remove('on')); b.classList.add('on'); } ok.disabled = !sel.length; }); grade.append(b); });
    }).catch(() => { grade.textContent = ''; grade.append(el('p', 'vazio', 'Não consegui carregar as imagens.')); });
  });
}
function controleImagem(alvo, obj, tipo, rotulo) {            // obj = { url, id } (alterado no lugar)
  const cfg = IMG[tipo], box = el('div', 'img-ctl'); if (rotulo) box.append(el('strong', '', rotulo));
  const prev = el('div', 'img-prev'), rec = el('div', 'img-rec'), st = el('small', ''); rec.append(el('strong', '', 'Recomendado: ' + cfg.rec), document.createTextNode(cfg.nota));
  const arq = el('input'); arq.type = 'file'; arq.accept = 'image/*'; arq.hidden = true;
  const acoes = el('div', 'linha-acoes'), bArq = el('button', 'btn ghost mini-btn'), bBib = el('button', 'btn ghost mini-btn', 'ESCOLHER JÁ USADA'), bUrl = el('button', 'btn ghost mini-btn', 'USAR URL'), bRem = el('button', 'btn rem mini-btn', 'REMOVER IMAGEM'); [bArq, bBib, bUrl, bRem].forEach((b) => { b.type = 'button'; });
  const urlBox = el('div', 'img-url'), urlIn = el('input'); urlIn.type = 'url'; urlIn.placeholder = 'https://... ou /img/arquivo.png'; const urlOk = el('button', 'btn mini-btn', 'USAR'); urlOk.type = 'button'; urlBox.hidden = true; urlBox.append(urlIn, urlOk);
  const pinta = () => { prev.textContent = ''; if (obj.url) { const im = el('img'); im.src = obj.url; im.alt = 'Prévia'; im.addEventListener('error', () => { prev.textContent = 'Não consegui carregar esta imagem. Confira a URL.'; }); prev.append(im); } else prev.textContent = 'Sem imagem'; bArq.textContent = obj.url ? 'TROCAR ARQUIVO' : 'ENVIAR ARQUIVO'; bRem.hidden = !obj.url; };
  bArq.addEventListener('click', () => arq.click());
  bBib.addEventListener('click', async () => { const [im] = await escolherImagem(false); if (im) { obj.url = im.url; obj.id = im.id; st.textContent = 'Imagem selecionada.'; sujar(); pinta(); } });
  arq.addEventListener('change', async () => { const f = arq.files[0]; arq.value = ''; if (!f) return; st.textContent = 'Enviando…'; try { Object.assign(obj, await enviarArquivo(f, tipo)); st.textContent = 'Imagem pronta.'; sujar(); pinta(); } catch (e) { st.textContent = 'Não consegui enviar: ' + msgErro(e); } });
  bUrl.addEventListener('click', () => { urlBox.hidden = !urlBox.hidden; if (!urlBox.hidden) urlIn.focus(); });
  urlOk.addEventListener('click', () => { const v = urlIn.value.trim(); if (!R.URL_REGEX.test(v)) { st.textContent = 'URL inválida: use https://... ou um caminho do site começando com /.'; return; } obj.url = v; obj.id = null; urlIn.value = ''; urlBox.hidden = true; st.textContent = 'Usando a URL informada.'; sujar(); pinta(); });
  bRem.addEventListener('click', () => { obj.url = ''; obj.id = null; st.textContent = 'Imagem removida desta página (o arquivo continua na biblioteca).'; sujar(); pinta(); });
  acoes.append(bArq, bBib, bUrl, bRem); box.append(prev, rec, acoes, urlBox, arq, st); pinta(); alvo.append(box); return box;
}
// lista de imagens: adicionar uma, enviar várias de uma vez, escolher já usadas, ordenar e remover (remover só tira da página)
function listaImagens(alvo, arr, tipo, max, rotuloItem) {
  const box = el('div'); alvo.append(box);
  const refazer = () => {
    box.textContent = '';
    arr.forEach((it, i) => { const b = el('div', 'bloco'); b.append(el('h4', '', rotuloItem + ' ' + (i + 1))); controleImagem(b, it.imagem, tipo); campo(b, 'Descrição da imagem (acessibilidade, opcional)', it, 'legenda', { max: 200 }); b.append(acoesItem(arr, i, refazer)); box.append(b); });
    const ln = el('div', 'linha-acoes'); ln.append(botaoAdd('+ ADICIONAR IMAGEM', () => { arr.push({ imagem: { url: '', id: null }, legenda: '' }); sujar(); refazer(); }, arr.length >= max));
    const varias = el('input'); varias.type = 'file'; varias.accept = 'image/*'; varias.multiple = true; varias.hidden = true; const st = el('small', '');
    const bV = botaoAdd('ENVIAR VÁRIAS IMAGENS', () => varias.click(), arr.length >= max); ln.append(bV, varias);
    ln.append(botaoAdd('ADICIONAR JÁ USADAS', async () => { const ims = await escolherImagem(true); ims.slice(0, max - arr.length).forEach((im) => arr.push({ imagem: { url: im.url, id: im.id }, legenda: '' })); if (ims.length) { sujar(); refazer(); } }, arr.length >= max)); box.append(ln, st);
    varias.addEventListener('change', async () => { const fs = [...varias.files].slice(0, max - arr.length); varias.value = ''; for (let k = 0; k < fs.length; k++) { st.textContent = 'Enviando ' + (k + 1) + ' de ' + fs.length + '…'; try { arr.push({ imagem: await enviarArquivo(fs[k], tipo), legenda: '' }); sujar(); } catch (e) { st.textContent = 'Não consegui enviar "' + fs[k].name + '": ' + msgErro(e); await new Promise((r) => setTimeout(r, 1500)); } } refazer(); });
  };
  refazer();
}

// ---------------------------------------------------------------- etapas
const NOME_SECAO = { concurso: 'Concurso', cargo: 'Cargo', questoes: 'Questões', seo: 'SEO', cabecalho: 'Cabeçalho', hero: 'Hero', estrategia: 'Pratique com estratégia', alem: 'Quer ir além?', depoimentos: 'Depoimentos', ofertas: 'Ofertas', oferta1: 'Oferta 1', oferta2: 'Oferta 2', faq: 'Dúvidas frequentes', suporte: 'Suporte', rodape: 'Rodapé' };
// interruptor mostrar/ocultar (ocultar NÃO apaga o conteúdo)
function alternar(alvo, obj, rotulo) {
  const l = el('label', 'toggle'), i = el('input'); i.type = 'checkbox'; i.checked = obj.visivel !== false; const t = el('span', '', rotulo || 'Mostrar esta seção na página pública'); const nota = el('small', '', '');
  const atualiza = () => { nota.textContent = i.checked ? '' : 'Seção oculta: o conteúdo continua salvo e volta ao reativar.'; renderNavSemRefazer(); };
  i.addEventListener('change', () => { obj.visivel = i.checked; sujar(); atualiza(); }); l.append(i, t); alvo.append(l, nota); atualiza();
}
function passoRapido(c) {
  titulo(c, 'Preenchimento rápido', 'Prepare o conteúdo no ChatGPT, cole tudo aqui e o sistema distribui nos campos. Você confere e corrige nas outras etapas; nada é salvo até você tocar em Salvar.');
  const bm = el('button', 'btn ghost', 'COPIAR MODELO PARA O CHATGPT'); bm.type = 'button'; bm.addEventListener('click', () => copiar(R.modeloChatGPT(), 'Modelo copiado! Cole no ChatGPT e peça o conteúdo da página.')); c.append(bm);
  const l = el('label', '', 'Cole aqui o texto gerado'); const ta = el('textarea', 'grande'); ta.value = estado.texto; ta.placeholder = '[CONCURSO]\nPMPE\n\n[HERO]\nTítulo: ...'; ta.addEventListener('input', () => { estado.texto = ta.value; }); l.append(ta); c.append(l);
  const bi = el('button', 'btn', 'INTERPRETAR E PREENCHER OS CAMPOS'); bi.type = 'button'; c.append(bi);
  const bg = el('button', 'btn ghost', 'ESCREVER AQUI O TEXTO DOS CAMPOS ATUAIS'); bg.type = 'button'; c.append(bg);
  c.append(el('small', '', 'Links de pagamento, WhatsApp (número), imagens, cores e "mostrar/ocultar" não são lidos do texto: têm campos próprios. O que não estiver no texto fica como está.'));
  const rel = el('div', 'rapido-rel'); c.append(rel);
  const mostra = () => { rel.textContent = ''; if (!estado.rel) return; const r = estado.rel;
    if (r.encontradas.length) rel.append(el('div', 'av certo', '✅ Preenchi: ' + r.encontradas.map((k) => NOME_SECAO[k] || k).join(', ') + '.'));
    r.avisos.forEach((a) => rel.append(el('div', 'av ' + a.nivel, (a.nivel === 'erro' ? '⛔ ' : '⚠️ ') + a.msg)));
    if (r.encontradas.length) { rel.append(el('div', 'av atencao', 'Próximos passos: confira os campos nas etapas, envie as imagens e informe os links de checkout (etapa Ofertas).')); const v = el('button', 'btn', 'CONFERIR OS CAMPOS ›'); v.type = 'button'; v.addEventListener('click', () => { estado.passo = 1; renderPasso(); window.scrollTo(0, 0); }); rel.append(v); } };
  mostra();
  bi.addEventListener('click', async () => {
    if (!estado.texto.trim()) { aviso('Cole o texto primeiro.', true); return; }
    const r = R.interpretarTexto(estado.texto); estado.rel = r;
    if (r.encontradas.length) {
      const antes = JSON.stringify(R.normalizar(estado.d)), depois = JSON.stringify(R.aplicar(estado.d, r));
      const preenchido = antes !== JSON.stringify(R.padrao());
      if (preenchido && antes !== depois && !(await confirmar('Substituir os textos?', 'Só os campos presentes no texto colado serão substituídos. Imagens, links de checkout, cores, WhatsApp e seções ocultas são mantidos.', 'SUBSTITUIR'))) { estado.rel = null; mostra(); return; }
      estado.d = R.aplicar(estado.d, r); if (!estado.slugManual && !estado.slug) estado.slug = R.slugify(estado.d.identificacao.concurso + ' ' + estado.d.identificacao.cargo); sujar();
    }
    mostra();
  });
  bg.addEventListener('click', () => { estado.texto = R.gerarTexto(estado.d); ta.value = estado.texto; aviso('Texto atualizado com os campos atuais.'); });
}
function passoIdent(c) {
  titulo(c, 'Identificação'); const i = estado.d.identificacao, seo = estado.d.seo;
  const atualiza = () => { if (!estado.slugManual && !estado.p) { estado.slug = R.slugify(i.concurso + ' ' + i.cargo); sl.value = estado.slug; } };
  campo(c, 'Nome do concurso', i, 'concurso', { max: 120, ph: 'PMPE', aoMudar: atualiza }); campo(c, 'Cargo', i, 'cargo', { max: 120, ph: 'Soldado', aoMudar: atualiza });
  campo(c, 'Quantidade de questões do simulado', i, 'questoes', { tipo: 'number', numero: true, ph: '105', dica: '(vale para todo texto com {questoes})' });
  c.append(el('small', '', 'Dica: em qualquer texto das seções você pode escrever {concurso}, {cargo} e {questoes}; a página troca pelos valores acima.'));
  const l = el('label', '', 'Endereço da página (slug)'), sl = el('input'); sl.type = 'text'; sl.maxLength = 80; sl.value = estado.slug; sl.autocapitalize = 'off'; sl.spellcheck = false;
  const aviso2 = el('small', '', ''); const atualizaAviso = () => { aviso2.textContent = estado.p ? '⚠ Alterar o endereço muda a URL pública (o link antigo deixa de funcionar).' : ''; };
  sl.addEventListener('input', () => { estado.slugManual = true; estado.slug = sl.value; sujar(); info.textContent = 'Endereço público: https://devmapas.vercel.app/venda/' + (R.slugify(sl.value) || '…'); atualizaAviso(); }); sl.addEventListener('blur', () => { sl.value = estado.slug = R.slugify(sl.value); });
  l.append(sl); c.append(l); const info = el('small', '', 'Endereço público: https://devmapas.vercel.app/venda/' + (estado.slug || '…')); c.append(info, aviso2); atualizaAviso();
  c.append(el('h3', '', 'SEO e compartilhamento')); campo(c, 'Título da página (aba do navegador)', seo, 'titulo', { max: 160 }); campo(c, 'Descrição (Google e compartilhamento)', seo, 'descricao', { area: true, max: 400 });
}
function passoCores(c) {
  titulo(c, 'Cores desta página', 'Valem só para esta página; o layout, as fontes e os espaçamentos continuam os da PMPE. Se uma cor prejudicar a leitura, a página ajusta o tom automaticamente.');
  const k = estado.d.cores, g = el('div', 'cores'); c.append(g);
  [['principal', 'Principal (etiquetas, ícones)'], ['escura', 'Escura (topo, ofertas, rodapé)'], ['destaque', 'Botões / destaque'], ['fundo', 'Fundo claro']].forEach(([ch, r]) => { const l = el('label', '', r), i = el('input'); i.type = 'color'; i.value = k[ch]; i.addEventListener('input', () => { k[ch] = i.value.toUpperCase(); sujar(); }); l.append(i); g.append(l); });
  const b = el('button', 'btn ghost', 'RESTAURAR A PALETA DA PMPE'); b.type = 'button'; b.addEventListener('click', () => { Object.assign(estado.d.cores, R.CORES); sujar(); renderPasso(); }); c.append(b);
}
function passoCabecalho(c) {
  titulo(c, 'Cabeçalho', 'Faixa fixa no topo com a marca e o botão de WhatsApp.'); const x = estado.d.cabecalho; alternar(c, x);
  campo(c, 'Marca (texto ao lado do ícone)', x, 'marca', { max: 80 }); campo(c, 'Link do botão do topo', x, 'link', { tipo: 'url', ph: 'https://... ou #ofertas', dica: '(vazio = usa o WhatsApp da etapa Suporte)' });
}
function passoHero(c) {
  titulo(c, 'Hero — capa principal'); const h = estado.d.hero; alternar(c, h);
  campo(c, 'Etiqueta (aba acima do título)', h, 'etiqueta', { max: 120 }); campo(c, 'Chamada superior', h, 'eyebrow', { max: 120 });
  campo(c, 'Título', h, 'titulo', { area: true, max: 300, dica: '(envolva a palavra em destaque com [[ ]], ex.: [[PMPE]])' }); campo(c, 'Subtítulo', h, 'subtitulo', { area: true, max: 600 });
  c.append(el('h3', '', 'Aviso')); campo(c, 'Rótulo em negrito', h.aviso, 'rotulo', { max: 40, ph: 'Atenção:' }); campo(c, 'Texto do aviso', h.aviso, 'texto', { area: true, max: 400 });
  c.append(el('h3', '', 'Chips de destaque')); listaTextos(c, h.chips, R.MAX.chips, 'Chip', 'Ex.: 📝 {questoes} questões');
  c.append(el('h3', '', 'Cartão flutuante')); campo(c, 'Ícone (emoji)', h.nota, 'icone', { max: 12 }); campo(c, 'Título', h.nota, 'titulo', { max: 80 }); campo(c, 'Texto', h.nota, 'texto', { max: 120 });
  c.append(el('h3', '', 'Imagem principal')); controleImagem(c, h.imagem, 'capa'); campo(c, 'Descrição da imagem (acessibilidade)', h, 'imagemAlt', { max: 200 });
}
function passoEstrategia(c) {
  titulo(c, 'Pratique com estratégia'); const e = estado.d.estrategia; alternar(c, e);
  campo(c, 'Etiqueta', e, 'etiqueta', { max: 120 }); campo(c, 'Título', e, 'titulo', { max: 200 }); campo(c, 'Texto', e, 'texto', { area: true, max: 800 });
  c.append(el('h3', '', 'Cards de benefícios')); const bx = el('div'); c.append(bx);
  const rf = () => { bx.textContent = ''; e.cards.forEach((it, i) => { const b = el('div', 'bloco'); b.append(el('h4', '', 'Card ' + (i + 1))); campo(b, 'Ícone (emoji)', it, 'icone', { max: 12 }); campo(b, 'Título', it, 'titulo', { max: 200 }); campo(b, 'Texto', it, 'texto', { area: true, max: 600 }); b.append(acoesItem(e.cards, i, rf)); bx.append(b); }); bx.append(botaoAdd('+ ADICIONAR CARD', () => { e.cards.push({ icone: '', titulo: '', texto: '' }); sujar(); rf(); }, e.cards.length >= R.MAX.cards)); };
  rf();
  c.append(el('h3', '', 'Chamada para ação')); campo(c, 'Frase acima do botão', e, 'chamada', { max: 300 }); campo(c, 'Texto do botão', e, 'botao', { max: 80 }); campo(c, 'Destino do botão', e, 'botaoLink', { tipo: 'text', ph: '#ofertas', dica: '(vazio = rola até as ofertas)' });
}
function passoAlem(c) {
  titulo(c, 'Quer ir além? + mapas', 'Apresentação do pacote e carrossel de amostras dos mapas. A ordem da lista é a ordem de exibição.'); const a = estado.d.alem; alternar(c, a);
  campo(c, 'Etiqueta', a, 'etiqueta', { max: 120 }); campo(c, 'Título', a, 'titulo', { max: 200 }); campo(c, 'Texto', a, 'texto', { area: true, max: 800 });
  c.append(el('h3', '', 'Lista de pontos')); listaTextos(c, a.lista, R.MAX.lista, 'Ponto', 'Ex.: Conteúdo organizado por assunto');
  c.append(el('h3', '', 'Carrossel de mapas')); campo(c, 'Título das amostras', a, 'mapasTitulo', { max: 200 }); campo(c, 'Texto das amostras', a, 'mapasTexto', { max: 300 }); listaImagens(c, a.mapas, 'mapa', R.MAX.mapas, 'Mapa');
  campo(c, 'Nota abaixo do carrossel', a, 'nota', { area: true, max: 400 });
}
function passoDepoimentos(c) {
  titulo(c, 'Depoimentos', 'Prints ou imagens verticais de quem já usou. Remover aqui só tira da página; o arquivo continua na biblioteca.'); const x = estado.d.depoimentos; alternar(c, x);
  campo(c, 'Etiqueta', x, 'etiqueta', { max: 120 }); campo(c, 'Título', x, 'titulo', { max: 200 }); campo(c, 'Texto', x, 'texto', { area: true, max: 400 }); listaImagens(c, x.itens, 'depoimento', R.MAX.depoimentos, 'Depoimento');
}
function passoOfertas(c) {
  const of = estado.d.ofertas; titulo(c, 'Ofertas', 'Duas ofertas independentes, cada uma com o seu preço e o seu checkout. O link de pagamento é um campo próprio (não vem do texto colado). Não dá para publicar oferta sem link real.'); alternar(c, of, 'Mostrar a seção de ofertas');
  campo(c, 'Etiqueta', of, 'etiqueta', { max: 120 }); campo(c, 'Título', of, 'titulo', { max: 200 }); campo(c, 'Texto', of, 'texto', { area: true, max: 400 });
  [['simulado', 'Oferta 1 — Simulado individual'], ['pacote', 'Oferta 2 — Pacote completo']].forEach(([k, rot]) => {
    const o = of[k], b = el('div', 'bloco'); b.append(el('h4', '', rot)); alternar(b, o, 'Mostrar esta oferta');
    campo(b, 'Rótulo', o, 'rotulo', { max: 80, ph: 'Opção 1' }); campo(b, 'Selo de destaque (opcional)', o, 'selo', { max: 80, ph: '★ Melhor custo-benefício' });
    campo(b, 'Nome do produto', o, 'nome', { max: 160 }); campo(b, 'Descrição', o, 'descricao', { area: true, max: 1500 });
    const pr = campo(b, 'Preço', o, 'preco', { max: 40, ph: '25,00' }); const pp = campo(b, 'Preço promocional (opcional)', o, 'precoPromocional', { max: 40, ph: '19,90', dica: '(se preenchido, mostra o preço normal riscado)' });
    const av = el('small', 'erro-campo', ''); b.append(av); const confere = () => { const p = R.precoPartes(o.preco), q = R.precoPartes(o.precoPromocional); av.textContent = (o.preco && !p) ? '⚠ Preço inválido (ex.: 25,00).' : (o.precoPromocional && !q) ? '⚠ Preço promocional inválido.' : (p && q && q.valor >= p.valor) ? '⚠ O promocional deve ser menor que o preço normal.' : ''; }; pr.addEventListener('input', confere); pp.addEventListener('input', confere); confere();
    campo(b, 'Frase de diferença de preço (opcional)', o, 'diferenca', { max: 200, ph: 'Por apenas R$ 20 a mais que o simulado!' });
    b.append(el('h4', '', 'Itens incluídos')); listaTextos(b, o.itens, R.MAX.incluidos, 'Item', 'Ex.: Material digital em PDF');
    campo(b, 'Texto do botão', o, 'botao', { max: 60, ph: k === 'simulado' ? 'QUERO SÓ O SIMULADO' : 'QUERO O PACOTE COMPLETO' });
    const lk = campo(b, 'Link de checkout', o, 'link', { tipo: 'url', ph: 'https://pay.kiwify.com.br/...', dica: '(obrigatório para publicar; precisa ser o link real)' });
    const al = el('small', 'erro-campo', ''); b.append(al); const confereLink = () => { const t = String(o.link || '').trim(); al.textContent = t ? (R.problemaLink(t) ? '⚠ ' + R.problemaLink(t) : '✅ Link válido.') : ''; }; lk.addEventListener('input', confereLink); confereLink();
    campo(b, 'Nota abaixo do botão', o, 'nota', { area: true, max: 300 }); c.append(b);
  });
  c.append(el('h3', '', 'Bloco "Compra digital"')); campo(c, 'Ícone (emoji)', of.compra, 'icone', { max: 12 }); campo(c, 'Título', of.compra, 'titulo', { max: 100 }); campo(c, 'Texto', of.compra, 'texto', { area: true, max: 400 });
}
function passoFaq(c) {
  titulo(c, 'Dúvidas frequentes'); const f = estado.d.faq; alternar(c, f); campo(c, 'Etiqueta', f, 'etiqueta', { max: 120 }); campo(c, 'Título', f, 'titulo', { max: 200 }); const bf = el('div'); c.append(bf);
  const rf = () => { bf.textContent = ''; f.itens.forEach((it, i) => { const b = el('div', 'bloco'); b.append(el('h4', '', 'Pergunta ' + (i + 1))); campo(b, 'Pergunta', it, 'pergunta', { max: 300 }); campo(b, 'Resposta', it, 'resposta', { area: true, max: 2000 }); b.append(acoesItem(f.itens, i, rf)); bf.append(b); }); bf.append(botaoAdd('+ ADICIONAR PERGUNTA', () => { f.itens.push({ pergunta: '', resposta: '' }); sujar(); rf(); }, f.itens.length >= R.MAX.faq)); };
  rf();
}
function passoSuporte(c) {
  const s = estado.d.suporte, r = estado.d.rodape; titulo(c, 'Suporte e rodapé'); c.append(el('h3', '', 'Suporte e contato')); alternar(c, s, 'Mostrar a seção de suporte');
  campo(c, 'Etiqueta', s, 'etiqueta', { max: 120 }); campo(c, 'Título', s, 'titulo', { max: 200 }); campo(c, 'Texto', s, 'texto', { area: true, max: 600 }); campo(c, 'Texto do botão', s, 'botao', { max: 80 });
  campo(c, 'WhatsApp (número com DDI e DDD, só dígitos)', s.whatsapp, 'numero', { max: 20, ph: '5561999999999', dica: '(também usado no cabeçalho)' }); campo(c, 'Mensagem inicial do WhatsApp', s.whatsapp, 'mensagem', { area: true, max: 300 });
  campo(c, 'Link alternativo do botão (opcional)', s, 'link', { tipo: 'url', ph: 'https://...', dica: '(vazio = usa o WhatsApp)' });
  c.append(el('h3', '', 'Rodapé')); alternar(c, r, 'Mostrar o rodapé'); campo(c, 'Linha 1', r, 'linha1', { max: 300 }); campo(c, 'Linha 2', r, 'linha2', { max: 300 });
}

// ---------------------------------------------------------------- salvar / visualizar / publicar
const slugAtual = () => R.slugify(estado.slug);
async function salvar() {
  const d = R.normalizar(estado.d), slug = slugAtual(), erros = R.validar(slug, estado.d);
  if (erros.length) { aviso('Corrija antes de salvar:\n• ' + erros.join('\n• '), true); estado.passo = 1; renderPasso(); return false; }
  try { const r = await api('/api/paginas-venda-admin', 'POST', { id: estado.p ? estado.p.id : undefined, slug, dados: d }); estado.p = r.pagina; estado.d = R.normalizar(r.pagina.dados); estado.slug = r.pagina.slug; estado.slugManual = true; estado.sujo = false; renderSituacao(); renderPasso(); return true; }
  catch (e) { aviso(e.dados && e.dados.detalhes ? 'Corrija:\n• ' + e.dados.detalhes.join('\n• ') : msgErro(e), true); return false; }
}
$('btnSalvar').addEventListener('click', async () => { if (await salvar()) aviso('Rascunho salvo ✅'); });
let previaSeq = 0;
function iframeNovo() { const v = $('iframePrevia'), n = el('iframe'); n.id = 'iframePrevia'; n.title = v.title; n.setAttribute('sandbox', v.getAttribute('sandbox')); v.replaceWith(n); return n; }
async function abrirPrevia(dados) {
  const minha = ++previaSeq;
  try { const r = await api('/api/paginas-venda-admin', 'POST', { acao: 'previa', dados }); if (minha !== previaSeq) return; iframeNovo().srcdoc = r.html; if (!$('dlgPrevia').open) $('dlgPrevia').showModal(); }
  catch (e) { if (minha === previaSeq) aviso(msgErro(e), true); }
}
$('dlgPrevia').addEventListener('close', iframeNovo); $('fecharPrevia').addEventListener('click', () => $('dlgPrevia').close());
$('btnPrevia').addEventListener('click', () => abrirPrevia(R.normalizar(estado.d)));          // mostra o que está na tela, mesmo sem salvar
$('btnPublicar').addEventListener('click', async () => {
  const p = estado.p;
  if (p && p.publicada) {
    if (!(await confirmar('Despublicar?', 'O link /venda/' + p.slug + ' deixa de funcionar (em até 1 minuto). Você pode publicar de novo depois.', 'DESPUBLICAR'))) return;
    try { estado.p = (await api('/api/paginas-venda-admin', 'POST', { acao: 'despublicar', id: p.id })).pagina; renderSituacao(); aviso('Página despublicada.'); } catch (e) { aviso(msgErro(e), true); } return;
  }
  const falta = R.validarPublicacao(estado.d); if (falta.length) { aviso('Ainda não dá para publicar:\n• ' + falta.join('\n• '), true); return; }
  if (!(await confirmar('Publicar esta página?', 'Ela ficará no ar em /venda/' + (slugAtual() || '…') + '. Depois de publicada, ao salvar uma edição ela muda no ar em até 1 minuto.', 'PUBLICAR'))) return;
  if (!(await salvar())) return;
  try { estado.p = (await api('/api/paginas-venda-admin', 'POST', { acao: 'publicar', id: estado.p.id })).pagina; renderSituacao(); aviso('Página publicada! ✅\n' + estado.p.link); }
  catch (e) { aviso(e.dados && e.dados.detalhes ? 'Ainda não dá para publicar:\n• ' + e.dados.detalhes.join('\n• ') : msgErro(e), true); }
});
$('btnCopiar').addEventListener('click', () => { if (estado.p && estado.p.publicada) copiar(estado.p.link, 'Link copiado!'); });
