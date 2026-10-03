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

// ---------- Formulário: cards e questões ----------
const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
function campo(rotulo, el_) { const l = mk('label', '', rotulo); l.append(el_); return l; }
function input(cls, ph) { const i = mk('input', cls); i.type = 'text'; if (ph) i.placeholder = ph; return i; }
function area(cls, ph) { const t = mk('textarea', cls); if (ph) t.placeholder = ph; return t; }

function renumerar() {
  document.querySelectorAll('.card-item h3').forEach((h, i) => { h.textContent = 'Card ' + (i + 1); });
  document.querySelectorAll('.q-item h3').forEach((h, i) => { h.textContent = 'Questão ' + (i + 1); });
  const n = document.querySelectorAll('.q-item').length;
  $('addQ').disabled = n >= MAX_Q;
  $('avisoQ').textContent = n >= MAX_Q ? 'Máximo de ' + MAX_Q + ' questões.' : (n < MIN_Q ? 'Adicione pelo menos ' + MIN_Q + ' questões.' : '');
}

function novoCard() {
  const d = mk('div', 'item card-item'); d.append(mk('h3'));
  d.append(campo('Título do card', input('c-titulo', 'Atalho Ctrl + T')), campo('Conteúdo', area('c-conteudo', 'Uma linha por parágrafo')), campo('🧠 Para memorizar (opcional)', area('c-mem')));
  const r = mk('button', 'btn rem', 'REMOVER CARD'); r.type = 'button';
  r.addEventListener('click', () => { d.remove(); renumerar(); });
  d.append(r); $('cards').append(d); renumerar();
}

function novaQuestao() {
  const d = mk('div', 'item q-item'); d.append(mk('h3'));
  const sel = mk('select', 'q-certa'); ['A', 'B', 'C'].forEach((l) => sel.add(new Option('Alternativa ' + l, l)));
  const alts = mk('div', 'alts'); ['A', 'B', 'C'].forEach((l) => alts.append(campo('Alternativa ' + l, input('q-alt'))));
  d.append(campo('Enunciado', area('q-enun')), alts, campo('Alternativa correta', sel), campo('Explicação', area('q-exp')), campo('🧠 Para memorizar (opcional)', area('q-mem')));
  const r = mk('button', 'btn rem', 'REMOVER QUESTÃO'); r.type = 'button';
  r.addEventListener('click', () => { d.remove(); renumerar(); });
  d.append(r); $('questoes').append(d); renumerar();
}

function slug(v) {
  return v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\.html$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}
$('nome').addEventListener('input', () => { $('prev').textContent = 'Arquivo gerado: ' + (slug($('nome').value) || 'dica') + '.html → pasta /dicas/'; });
$('addCard').addEventListener('click', novoCard);
$('addQ').addEventListener('click', () => { if (document.querySelectorAll('.q-item').length < MAX_Q) novaQuestao(); });

// ---------- Validar e gerar ----------
const val = (n, sel) => n.querySelector(sel).value.trim();
$('gerar').addEventListener('click', () => {
  $('ok').hidden = true; $('erro').hidden = true;
  const erros = [];
  const nome = slug($('nome').value);
  if (!$('nome').value.trim()) erros.push('Preencha o nome interno da dica.');
  else if (!nome) erros.push('O nome interno precisa ter letras ou números.');
  const titulo = $('titulo').value.trim(), frase = $('frase').value.trim();
  if (!titulo) erros.push('Preencha o título principal.');
  if (!frase) erros.push('Preencha a frase final.');

  const cards = [];
  const itens = [...document.querySelectorAll('.card-item')];
  if (!itens.length) erros.push('Adicione pelo menos 1 card de conteúdo.');
  itens.forEach((c, i) => {
    const t = val(c, '.c-titulo'), ct = val(c, '.c-conteudo');
    if (!t) erros.push('Card ' + (i + 1) + ': preencha o título.');
    if (!ct) erros.push('Card ' + (i + 1) + ': preencha o conteúdo.');
    cards.push({ t, c: ct, m: val(c, '.c-mem') });
  });

  const qs = [], qitens = [...document.querySelectorAll('.q-item')];
  if (qitens.length < MIN_Q) erros.push('A Rodada Relâmpago precisa de ' + MIN_Q + ' a ' + MAX_Q + ' questões (agora há ' + qitens.length + ').');
  qitens.forEach((q, i) => {
    const n = 'Questão ' + (i + 1) + ': ';
    const e = val(q, '.q-enun'), x = val(q, '.q-exp');
    const a = [...q.querySelectorAll('.q-alt')].map((v) => v.value.trim());
    if (!e) erros.push(n + 'preencha o enunciado.');
    a.forEach((v, k) => { if (!v) erros.push(n + 'preencha a alternativa ' + 'ABC'[k] + '.'); });
    if (!x) erros.push(n + 'preencha a explicação.');
    qs.push({ e, a, c: 'ABC'.indexOf(q.querySelector('.q-certa').value), x, m: val(q, '.q-mem') });
  });
  if (erros.length) { $('erro').textContent = erros.join('\n'); $('erro').hidden = false; $('erro').scrollIntoView({ block: 'center' }); return; }

  const ofertasIds = [...document.querySelectorAll('.of-sel:checked')].map((c) => c.value);   // ordem da lista = mapas, depois gerais
  const dados = JSON.stringify({ f: frase, o: ofertasIds, cards, q: qs }).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' ');
  const html = MODELO.split('__TITULO__').join(esc(titulo)).split('__CONFIG__').join(ofertasIds.length ? '<script src="../config/ofertas.js"></' + 'script>\n' : '')
    .split('__DADOS__').join(dados);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  a.download = nome + '.html';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  $('ok').textContent = '✅ Dica gerada com sucesso!\nEnvie o arquivo ' + nome + '.html para a pasta /dicas/ do site (ficará em /dicas/' + nome + '.html).' + (ofertasIds.length ? '\nAs ofertas são lidas de /config/ofertas.js: mantenha essa pasta no site.' : '');
  $('ok').hidden = false;
});

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

novoCard();
for (let i = 0; i < MIN_Q; i++) novaQuestao();
