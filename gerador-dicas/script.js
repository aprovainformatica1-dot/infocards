/* GERADOR DE DICAS DEVMAPAS — HTML/CSS/JS puro. Gera um arquivo [nome].html para colocar na pasta /dicas/.
   (Um navegador não escreve direto no site: o arquivo é baixado e você o envia para /dicas/.) */
const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MIN_Q = 3, MAX_Q = 4;

// ---------- Modelo da página gerada (tudo embutido) ----------
const MODELO = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITULO__ — Dica DevMapas</title>
<style>
:root{--g:#7a4fd6;--gd:#3b1d6e;--gl:#efe8fb;--bg:#f7f4fd;--tx:#1f1a33;--mu:#6b6485;--bd:#e4def0;--ok:#16a34a;--bad:#d97706}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
[hidden]{display:none!important}
.app{max-width:560px;margin:0 auto;padding:12px 12px calc(40px + var(--barra,0px))}
.hero{background:linear-gradient(160deg,#6a3fc4,#3b1d6e);color:#fff;border-radius:24px;padding:14px 16px;text-align:center;box-shadow:0 8px 22px rgba(59,29,110,.2)}
.kick{font-size:12px;font-weight:800;letter-spacing:.14em;opacity:.9}
h1{font-size:20px;line-height:1.25;margin:6px 0 0}
.trilho{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;margin:14px 0 0;padding-bottom:4px;scrollbar-width:none}
.trilho::-webkit-scrollbar{display:none}
.slide{flex:0 0 100%;scroll-snap-align:center;background:#fff;border:1px solid var(--bd);border-radius:22px;padding:18px;box-shadow:0 4px 16px rgba(59,29,110,.08);min-width:0}
.slide h2{font-size:19px;line-height:1.3;margin:0 0 10px;color:var(--gd)}
.slide p{margin:0 0 8px;overflow-wrap:anywhere}
.mem{margin-top:12px;background:#fff9e6;border-left:5px solid #f4b400;border-radius:12px;padding:10px 12px;font-size:15px}
.mem b{display:block;font-size:12px;letter-spacing:.06em;margin-bottom:2px}
.raio{text-align:center;background:linear-gradient(#fff,var(--gl))}
.nav{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px}
.setas{flex:none;width:48px;height:48px;border-radius:50%;border:2px solid var(--bd);background:#fff;color:var(--gd);font-size:22px;font-weight:800;cursor:pointer}
.dots{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.dot{width:9px;height:9px;border-radius:99px;background:var(--bd);transition:background .2s,width .2s}
.dot.on{background:var(--g);width:22px}
.btn{display:block;width:100%;min-height:52px;border:0;border-radius:14px;padding:12px;margin-top:12px;font:inherit;font-weight:800;letter-spacing:.03em;background:var(--g);color:#fff;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.btn:active{transform:translateY(2px);box-shadow:none}
.card{background:#fff;border:1px solid var(--bd);border-radius:22px;padding:18px;margin-top:14px;box-shadow:0 4px 16px rgba(59,29,110,.08);animation:in .3s ease}
@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.passo{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--g)}
.enun{font-weight:600;margin:6px 0 12px;overflow-wrap:anywhere}
.opt{display:flex;gap:10px;align-items:center;width:100%;min-height:52px;text-align:left;font:inherit;background:#fff;border:2px solid var(--bd);border-radius:14px;padding:10px 12px;margin-bottom:8px;cursor:pointer;color:var(--tx)}
.opt b{flex:none;width:28px;height:28px;border-radius:50%;background:var(--bg);display:grid;place-items:center;font-size:13px}
.opt span{min-width:0;overflow-wrap:anywhere}
.opt.ok{border-color:var(--ok);background:#dcfce7}.opt.ok b{background:var(--ok);color:#fff}
.opt.bad{border-color:var(--bad);background:#fff4e0}.opt.bad b{background:var(--bad);color:#fff}
.opt:disabled{cursor:default}
.fb{border-radius:16px;padding:12px 14px;margin-top:4px}
.fb.ok{background:#dcfce7}.fb.bad{background:#fff4e0}
.fb h3{margin:0 0 4px;font-size:17px}.fb p{margin:4px 0}
.final{text-align:center}
.final h2{margin:0;color:var(--gd)}
.placar{font-size:40px;font-weight:800;color:var(--gd);line-height:1.2}
.frase{margin:10px 0 0;font-size:18px;font-weight:700;color:var(--gd)}
html{scroll-padding-bottom:var(--barra,0px)}
.ofertas{position:fixed;left:0;right:0;bottom:0;z-index:20;background:rgba(255,255,255,.97);border-top:1px solid var(--bd);box-shadow:0 -6px 20px rgba(59,29,110,.14);padding:8px 12px calc(8px + env(safe-area-inset-bottom,0px));max-height:34vh;overflow-y:auto;overscroll-behavior:contain}
.ofertas-in{max-width:560px;margin:0 auto;display:grid;gap:8px}
.of{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;min-height:52px;padding:8px 10px;border:2px solid var(--bd);border-radius:14px;background:#fff;color:var(--tx);text-decoration:none}
.of .t{flex:1 1 130px;min-width:0;font-size:12px;font-weight:800;letter-spacing:.03em;color:var(--gd);overflow-wrap:anywhere}
.of .b{flex:0 1 auto;max-width:100%;background:var(--g);color:#fff;font-weight:800;font-size:13px;padding:11px 14px;border-radius:12px;text-align:center}
.of.verde{border-color:#25D366;background:#e9fbef}.of.verde .t{color:#075E54}.of.verde .b{background:#25D366;color:#053b1d}
.of.escuro{border-color:#075E54}.of.escuro .t{color:#075E54}.of.escuro .b{background:#075E54}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="app">
  <header class="hero">
    <div class="kick">💡 DICA DEVMAPAS</div>
    <h1>__TITULO__</h1>
  </header>
  <section aria-label="Cards da dica">
    <div class="trilho" id="trilho" tabindex="0"></div>
    <div class="nav"><button class="setas" id="ant" aria-label="Card anterior">‹</button><div class="dots" id="dots"></div><button class="setas" id="prox" aria-label="Próximo card">›</button></div>
  </section>
  <section id="rodada" hidden aria-label="Rodada relâmpago"></section>
</div>
<aside class="ofertas" id="area-ofertas" aria-label="Ofertas" hidden></aside>
__CONFIG__<script>
const D = __DADOS__;
const NL = String.fromCharCode(10);
const $ = (id) => document.getElementById(id);
function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; }
function paragrafos(no, txt) { txt.split(NL).forEach((l) => { if (l.trim()) no.appendChild(el('p', '', l)); }); return no; }
function memorizar(txt) { const m = el('div', 'mem'); m.append(el('b', '', '🧠 PARA MEMORIZAR')); paragrafos(m, txt); return m; }

/* ----- carrossel ----- */
const trilho = $('trilho');
D.cards.forEach((c) => {
  const s = el('article', 'slide'); s.append(el('h2', '', c.t), paragrafos(el('div'), c.c));
  if (c.m) s.append(memorizar(c.m));
  trilho.append(s);
});
const raio = el('article', 'slide raio');
raio.append(el('h2', '', '⚡ RODADA RELÂMPAGO'), el('p', '', D.q.length + ' questões rápidas. Responda e veja o resultado na hora.'));
const comecar = el('button', 'btn', 'COMEÇAR RODADA'); comecar.type = 'button'; raio.append(comecar);
trilho.append(raio);
const total = trilho.children.length;
D.cards.concat([0]).forEach(() => $('dots').append(el('span', 'dot')));
function atual() { return Math.max(0, Math.min(total - 1, Math.round(trilho.scrollLeft / (trilho.clientWidth + 12)))); }
function marcar() { const a = atual(); [...$('dots').children].forEach((d, i) => d.classList.toggle('on', i === a)); }
function ir(delta) { trilho.scrollTo({ left: (atual() + delta) * (trilho.clientWidth + 12), behavior: 'smooth' }); }
trilho.addEventListener('scroll', marcar);
$('ant').addEventListener('click', () => ir(-1));
$('prox').addEventListener('click', () => ir(1));
trilho.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ir(1); if (e.key === 'ArrowLeft') ir(-1); });
marcar();

/* ----- rodada relâmpago ----- */
let qi = 0, acertos = 0;
const rodada = $('rodada');
comecar.addEventListener('click', () => { comecar.disabled = true; rodada.hidden = false; questao(); rodada.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

function questao() {
  const q = D.q[qi];
  rodada.textContent = '';
  const card = el('div', 'card');
  card.append(el('div', 'passo', '⚡ QUESTÃO ' + (qi + 1) + ' DE ' + D.q.length), el('p', 'enun', q.e));
  const opts = el('div');
  q.a.forEach((txt, i) => {
    const b = el('button', 'opt'); b.type = 'button';
    b.append(el('b', '', 'ABC'[i]), el('span', '', txt));
    b.addEventListener('click', () => responder(i, opts, card));
    opts.append(b);
  });
  card.append(opts);
  rodada.append(card);
}

function responder(i, opts, card) {
  const q = D.q[qi], certo = i === q.c;
  if (certo) acertos++;
  [...opts.children].forEach((b, k) => { b.disabled = true; if (k === q.c) b.classList.add('ok'); else if (k === i) b.classList.add('bad'); });
  const fb = el('div', 'fb ' + (certo ? 'ok' : 'bad'));
  fb.append(el('h3', '', certo ? '✅ VOCÊ ACERTOU!' : '❌ NÃO FOI DESSA VEZ!'), el('p', '', 'Resposta certa: ' + 'ABC'[q.c]), paragrafos(el('div'), q.x));
  if (q.m) fb.append(memorizar(q.m));
  const ultimo = qi === D.q.length - 1;
  const prox = el('button', 'btn', ultimo ? 'VER RESULTADO →' : 'PRÓXIMA QUESTÃO →'); prox.type = 'button';
  prox.addEventListener('click', () => { if (ultimo) fim(); else { qi++; questao(); rodada.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
  card.append(fb, prox);
  fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ----- ofertas fixas na parte inferior: só os IDs ficam salvos; os dados vêm de ../config/ofertas.js ----- */
(function () {
  if (!D.o || !D.o.length || typeof OFERTAS === 'undefined') return;
  const mapas = typeof MAPAS_INDIVIDUAIS === 'undefined' ? {} : MAPAS_INDIVIDUAIS;
  const lista = D.o.map((id) => mapas[id] || OFERTAS[id]).filter(Boolean);
  if (!lista.length) return;
  const barra = $('area-ofertas'), dentro = el('div', 'ofertas-in');
  lista.forEach((o) => {
    const cl = o.classe || '';
    const a = el('a', 'of' + (cl.indexOf('wa') >= 0 ? ' verde' : cl.indexOf('gr') >= 0 ? ' escuro' : ''));
    if (o.link && /^https?:/i.test(o.link)) { a.href = o.link; a.target = '_blank'; a.rel = 'noopener'; }
    a.append(el('span', 't', o.kick || o.nome || ''), el('span', 'b', o.botao || ''));
    dentro.append(a);
  });
  barra.append(dentro); barra.hidden = false;
  const medir = () => document.documentElement.style.setProperty('--barra', barra.offsetHeight + 'px');
  medir(); window.addEventListener('resize', medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(barra);
})();

function fim() {
  rodada.textContent = '';
  const c = el('div', 'card final');
  c.append(el('h2', '', '🎉 RODADA CONCLUÍDA!'), el('div', 'placar', acertos + '/' + D.q.length), el('p', 'frase', D.f));
  rodada.append(c);
  c.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
<\/script>
</body>
</html>`;

// ---------- Formulário simplificado: nome + material bruto + conteúdo estruturado (JSON) ----------
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

const EXEMPLO = JSON.stringify({
  titulo: 'PRINCIPAIS PROTOCOLOS',
  fraseFinal: 'Agora você já revisou os principais protocolos cobrados em concursos.',
  cards: [
    { itens: [
      { nome: 'HTTP', explicacao: 'Usado para transferência de páginas e recursos da Web.', memoria: 'HTTP → Web' },
      { nome: 'HTTPS', explicacao: 'Versão segura do HTTP, com criptografia.', memoria: 'HTTPS → Web + seguro' }
    ] },
    { itens: [
      { nome: 'DNS', explicacao: 'Traduz nomes de domínio para endereços IP.', memoria: 'DNS → nome vira IP' }
    ] }
  ],
  questoes: [
    { pergunta: 'Qual protocolo é usado para transferência de páginas e recursos da Web?', alternativas: ['HTTP', 'SMTP', 'FTP'], correta: 0,
      comentario: 'O HTTP é utilizado na transferência de páginas e recursos da Web.', memoria: 'HTTP → Web' },
    { pergunta: 'Qual protocolo traduz nomes de domínio para endereços IP?', alternativas: ['DHCP', 'DNS', 'POP3'], correta: 1,
      comentario: 'O DNS faz a tradução de nomes de domínio para endereços IP.', memoria: 'DNS → nome vira IP' },
    { pergunta: 'Qual protocolo é a versão segura do HTTP?', alternativas: ['FTP', 'IMAP', 'HTTPS'], correta: 2,
      comentario: 'O HTTPS usa criptografia para proteger a comunicação.' }
  ]
}, null, 2);
$('formato').textContent = EXEMPLO;

function slug(v) {
  return v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\.html$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}
$('nome').addEventListener('input', () => { $('prev').textContent = 'Arquivo gerado: ' + (slug($('nome').value) || 'dica') + '.html → pasta /dicas/'; });
$('exemplo').addEventListener('click', () => { $('estruturado').value = EXEMPLO; });

// ---------- Ofertas (lidas de ../config/ofertas.js; sem limite) ----------
(function () {
  const box = $('listaOfertas');
  const mapas = typeof MAPAS_INDIVIDUAIS === 'undefined' ? [] : Object.values(MAPAS_INDIVIDUAIS);
  const gerais = typeof OFERTAS === 'undefined' ? [] : Object.values(OFERTAS);
  if (typeof OFERTAS === 'undefined') { box.append(mk('p', 'msg erro', 'Não encontrei ../config/ofertas.js: não dá para escolher ofertas agora.')); return; }
  const grupo = (titulo, itens) => {
    if (!itens.length) return;
    box.append(mk('p', 'grp', titulo));
    itens.forEach((o) => {
      const l = mk('label', 'chk'), c = mk('input'); c.type = 'checkbox'; c.value = o.id; c.className = 'of-sel';
      l.append(c, mk('span', '', (o.icone || '🎁') + ' ' + (o.nome || o.id)));
      box.append(l);
    });
  };
  grupo('MAPAS INDIVIDUAIS', mapas);       // mapas individuais primeiro
  grupo('OFERTAS GERAIS', gerais);          // depois as gerais, na ordem de OFERTAS
})();


// Lê e valida o conteúdo estruturado. Não interpreta texto livre: só converte o JSON na estrutura da Dica.
function lerEstruturado(texto) {
  const t = texto.trim().replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');   // aceita o JSON dentro de um bloco ``` do ChatGPT
  let j;
  try { j = JSON.parse(t); }
  catch (e) { return { erros: ['O conteúdo estruturado não é um JSON válido (' + e.message + '). Confira vírgulas, aspas e chaves.'] }; }
  if (!j || typeof j !== 'object' || Array.isArray(j)) return { erros: ['O conteúdo estruturado precisa ser um objeto { ... } com "titulo", "cards" e "questoes".'] };
  const s = (v) => (typeof v === 'string' ? v.trim() : '');
  const erros = [], cards = [], qs = [];
  const titulo = s(j.titulo);
  if (!titulo) erros.push('Falta o "titulo" no conteúdo estruturado.');

  if (!Array.isArray(j.cards) || !j.cards.length) erros.push('É preciso ter pelo menos 1 card em "cards".');
  else j.cards.forEach((c, i) => {
    const n = 'Card ' + (i + 1) + ': ';
    const itens = c && Array.isArray(c.itens) ? c.itens : [];
    if (!itens.length) return erros.push(n + '"itens" precisa ter 1 ou 2 itens.');
    if (itens.length > 2) return erros.push(n + 'no máximo 2 itens por card (tem ' + itens.length + ').');
    let ok = true;
    itens.forEach((x, k) => {
      if (!s(x && x.nome)) { erros.push(n + 'item ' + (k + 1) + ': falta "nome".'); ok = false; }
      if (!s(x && x.explicacao)) { erros.push(n + 'item ' + (k + 1) + ': falta "explicacao".'); ok = false; }
    });
    if (ok) cards.push({
      t: s(c.titulo) || itens.map((x) => s(x.nome)).join(' + '),
      c: itens.map((x) => s(x.nome) + ': ' + s(x.explicacao)).join('\n'),
      m: itens.map((x) => s(x.memoria)).filter(Boolean).join('\n')
    });
  });

  const lista = Array.isArray(j.questoes) ? j.questoes : [];
  if (lista.length < MIN_Q || lista.length > MAX_Q) erros.push('A Rodada Relâmpago precisa de ' + MIN_Q + ' a ' + MAX_Q + ' questões em "questoes" (agora há ' + lista.length + ').');
  lista.forEach((q, i) => {
    const n = 'Questão ' + (i + 1) + ': ';
    const e = s(q && q.pergunta), x = s(q && q.comentario);
    const a = q && Array.isArray(q.alternativas) ? q.alternativas.map((v) => s(v)) : [];
    let ok = true;
    if (!e) { erros.push(n + 'falta "pergunta".'); ok = false; }
    if (a.length !== 3 || a.some((v) => !v)) { erros.push(n + '"alternativas" precisa ter exatamente 3 textos preenchidos.'); ok = false; }
    let c = q ? q.correta : undefined;
    if (typeof c === 'string' && /^[abc]$/i.test(c.trim())) c = 'abc'.indexOf(c.trim().toLowerCase());
    if (!Number.isInteger(c) || c < 0 || c > 2) { erros.push(n + '"correta" precisa ser 0, 1 ou 2 (0 = primeira alternativa, 1 = segunda, 2 = terceira).'); ok = false; }
    if (!x) { erros.push(n + 'falta "comentario".'); ok = false; }
    if (ok) qs.push({ e, a, c, x, m: s(q.memoria) });
  });
  return { erros, titulo, f: s(j.fraseFinal), cards, q: qs };
}

// ---------- Validar e gerar ----------
$('gerar').addEventListener('click', () => {
  $('ok').hidden = true; $('erro').hidden = true;
  const erros = [];
  const nome = slug($('nome').value);
  if (!$('nome').value.trim()) erros.push('Preencha o nome interno da dica.');
  else if (!nome) erros.push('O nome interno precisa ter letras ou números.');
  let L = null;
  if (!$('estruturado').value.trim()) erros.push('Cole o conteúdo estruturado (o JSON que o ChatGPT devolveu).');
  else { L = lerEstruturado($('estruturado').value); erros.push(...L.erros); }
  if (erros.length) { $('erro').textContent = erros.join('\n'); $('erro').hidden = false; $('erro').scrollIntoView({ block: 'center' }); return; }

  const ofertasIds = [...document.querySelectorAll('.of-sel:checked')].map((c) => c.value);   // ordem da lista = mapas, depois gerais
  const dados = JSON.stringify({ f: L.f, o: ofertasIds, cards: L.cards, q: L.q }).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' ');
  const html = MODELO.split('__TITULO__').join(esc(L.titulo))
    .split('__CONFIG__').join(ofertasIds.length ? '<script src="../config/ofertas.js"></' + 'script>\n' : '')
    .split('__DADOS__').join(dados);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = nome + '.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  $('ok').textContent = '✅ Dica gerada com sucesso!\nEnvie o arquivo ' + nome + '.html para a pasta /dicas/ do site (ficará em /dicas/' + nome + '.html).' + (ofertasIds.length ? '\nAs ofertas são lidas de /config/ofertas.js: mantenha essa pasta no site.' : '');
  $('ok').hidden = false;
});
