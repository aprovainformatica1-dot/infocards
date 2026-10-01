/* GERADOR DE DESAFIOS DEVMAPAS — HTML/CSS/JS puro, sem dependências */
/* =========================================
   CONFIGURAÇÕES DOS CARDS — DESAFIO PADRÃO
   (usadas no tipo "Desafio geral": edite aqui UMA vez)
   ========================================= */
const BASE_IMG = "https://devmapas.vercel.app/img/";   // pasta /img/ do site
const PADRAO = {
  imagens: {
    simulado: BASE_IMG + "capa-simulado.png",
    mapas: BASE_IMG + "capa-mapas.png"
  },
  links: {
    simulado: "https://pay.kiwify.com.br/gpyqBa2",
    mapas: "https://pay.kiwify.com.br/6nLacpi",
    whatsapp: "https://wa.me/5561996169903",
    grupo: "https://chat.whatsapp.com/EB9OpUq1uOl1KA5TdiLheD?mode=gi_t"
  },
  imagemCompartilhamento: BASE_IMG + "desafio-informatica.png"   // prévia ao compartilhar (igual para todos)
};

/* =========================================
   CONFIGURAÇÕES — SIMULADO ESPECÍFICO
   (concurso, nome, descrição, capa e links vêm dos campos do gerador;
    a capa é montada como BASE_IMG + nome informado)
   ========================================= */
const ESPECIFICO = { icone: "📄" };

const EXEMPLO = document.getElementById('exemplo').textContent;
const EXEMPLO_SEM_MEM = EXEMPLO.replace(/\n*PARA MEMORIZAR:[\s\S]*$/, '');
const EXEMPLO_CE = document.getElementById('exemploCE').textContent;
const $ = id => document.getElementById(id);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- Campos das 5 questões ----------
for (let n = 1; n <= 5; n++) {
  const c = document.createElement('section');
  c.className = 'card';
  c.innerHTML = '<label for="q' + n + '">Questão ' + n + '</label><textarea id="q' + n + '" placeholder="ENUNCIADO:&#10;...&#10;&#10;A) ...&#10;B) ...&#10;&#10;GABARITO: C&#10;&#10;COMENTÁRIO:&#10;..."></textarea>';
  $('questoes').appendChild(c);
}

// ---------- Parser ----------
const semAcento = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
function parseQuestao(texto, n) {
  const q = { t: 'mc', e: '', a: {}, g: '', c: '', m: '' };
  let sec = null, alt = null, graw = '';
  for (const raw of texto.replace(/\r/g, '').split('\n')) {
    let m;
    if ((m = raw.match(/^\s*ENUNCIADO\s*:?\s*(.*)$/i))) { sec = 'e'; alt = null; q.e += m[1] + '\n'; }
    else if ((m = raw.match(/^\s*GABARITO\s*:?\s*(.*)$/i))) { graw = m[1]; sec = 'x'; alt = null; }
    else if ((m = raw.match(/^\s*COMENT[ÁA]RIO\s*:?\s*(.*)$/i))) { sec = 'c'; alt = null; q.c += m[1] + '\n'; }
    else if ((m = raw.match(/^\s*PARA\s+MEMORIZAR\s*:?\s*(.*)$/i))) { sec = 'm'; alt = null; q.m += m[1] + '\n'; }
    else if ((sec === 'e' || sec === 'a') && (m = raw.match(/^\s*\(?([A-E])\s*[\)\.\-]\s*(.*)$/i))) {
      alt = m[1].toUpperCase(); sec = 'a'; q.a[alt] = m[2].trim();
    }
    else if (sec === 'a' && alt) { if (raw.trim()) q.a[alt] += '\n' + raw.trim(); }
    else if (sec === 'e' || sec === 'c' || sec === 'm') { q[sec] += raw + '\n'; }
  }
  // remove só linhas em branco do começo e espaços do fim; o resto fica como foi colado
  ['e', 'c', 'm'].forEach(k => q[k] = q[k].replace(/^(\s*\n)+/, '').replace(/\s+$/, ''));
  const erros = [];
  if (!q.e) erros.push('falta "ENUNCIADO:"');
  if (!q.c) erros.push('falta "COMENTÁRIO:"');
  const tk = semAcento(graw).replace(/^LETRA\s+/, '').replace(/[^A-Z ]/g, ' ').trim().split(/\s+/)[0] || '';
  if (!graw.trim()) erros.push('falta "GABARITO:"');
  if (Object.keys(q.a).length === 0) {
    // Certo/Errado: sem alternativas A-E, gabarito CERTO ou ERRADO
    const g = /^(CERTO|CERTA|C)$/.test(tk) ? 'C' : /^(ERRADO|ERRADA|E)$/.test(tk) ? 'E' : '';
    if (g) { q.t = 'ce'; q.a = { C: 'CERTO', E: 'ERRADO' }; q.g = g; }
    else if (graw.trim()) erros.push('sem alternativas A) a E), o gabarito deve ser CERTO ou ERRADO (lido: "' + graw.trim() + '")');
  } else {
    if (Object.keys(q.a).length < 2) erros.push('use pelo menos 2 alternativas');
    q.g = /^[A-E]$/.test(tk) ? tk : '';
    if (graw.trim() && !q.a[q.g]) erros.push('o gabarito "' + graw.trim() + '" não corresponde a uma alternativa');
  }
  return { q, erros: erros.map(e => 'Questão ' + n + ': ' + e) };
}

// ---------- Modelo do HTML gerado (tudo embutido) ----------
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';

// Cards finais do DESAFIO GERAL (4 cards)
const CARDS_GERAL = `<div class="go a">
      <div class="capa" data-capa="simulado">📄</div>
      <div class="kick">📄 SIMULADO DE INFORMÁTICA</div>
      <h2>GOSTOU DE RESOLVER AS QUESTÕES ASSIM?</h2>
      <p>O que você acabou de fazer foi uma demonstração interativa gratuita de como trabalho minhas questões e comentários.</p>
      <p>No material completo, você encontra mais de 100 questões de Informática comentadas para continuar praticando e revisar seus conhecimentos.</p>
      <div class="importante"><span>📌 IMPORTANTE</span>O MATERIAL COMPLETO É DISPONIBILIZADO EM PDF.</div>
      <a class="btn" data-cta="simulado" target="_blank" rel="noopener">📄 QUERO MAIS QUESTÕES</a>
    </div>
    <div class="go b">
      <div class="capa" data-capa="mapas">🗺️</div>
      <div class="kick">🗺️ MAPAS DE INFORMÁTICA</div>
      <h2>E QUANDO VOCÊ PRECISAR REVISAR O CONTEÚDO?</h2>
      <p>Depois de praticar questões, você consegue perceber quais assuntos ainda precisam de atenção.</p>
      <p>Os Mapas de Informática organizam os principais conteúdos de forma resumida para facilitar suas revisões.</p>
      <a class="btn" data-cta="mapas" target="_blank" rel="noopener">🗺️ CONHECER OS MAPAS</a>
    </div>
    <div class="go wa">
      <div class="kick">🎯 SIMULADO PERSONALIZADO</div>
      <h2>ESTUDANDO PARA UM CONCURSO ESPECÍFICO?</h2>
      <p>Posso preparar um simulado personalizado de Informática, de acordo com o seu concurso e sua banca.</p>
      <a class="btn wbtn" data-cta="whatsapp" target="_blank" rel="noopener">${WA_SVG}<span>FALAR COMIGO NO WHATSAPP</span></a>
    </div>
    <div class="go gr">
      <div class="kick">💚 GRUPO GRATUITO DE ESTUDOS</div>
      <h2>QUER CONTINUAR RECEBENDO QUESTÕES E DICAS?</h2>
      <p>Entre no grupo gratuito do DevMapas e receba questões, dicas e conteúdos de Informática para concursos diretamente no WhatsApp.</p>
      <a class="btn wbtn" data-cta="grupo" target="_blank" rel="noopener">${WA_SVG}<span>ENTRAR NO GRUPO GRATUITO</span></a>
    </div>
  `;

// Cards finais do SIMULADO ESPECÍFICO (2 cards) — conteúdo dinâmico
function cardsEspecifico(d) {
  return `<div class="go a">
      <div class="capa" data-capa="simulado">${ESPECIFICO.icone}</div>
      <div class="kick">📄 SIMULADO DE INFORMÁTICA</div>
      <h2>GOSTOU DE RESOLVER AS QUESTÕES?</h2>
      <p>O que você acabou de fazer foi uma demonstração interativa gratuita com 5 questões.</p>
      <p>Para ser aprovado, não basta só estudar a teoria. Você precisa praticar muitas questões e aprender enquanto resolve.</p>
      <p>Este simulado foi feito especificamente para a ${esc(d.concurso)}, com mais de 100 questões de Informática comentadas.</p>
      <p>🧠 Estudo reverso: você resolve, identifica seus erros e aprende com comentários em formato de mini aula.</p>
      <div class="importante azul"><span>📌 IMPORTANTE</span>O MATERIAL COMPLETO É DISPONIBILIZADO EM PDF.</div>
      <a class="btn laranja" data-cta="simulado" target="_blank" rel="noopener">📄 QUERO MAIS QUESTÕES</a>
    </div>
    <div class="go wa">
      <div class="kick">💚 GRUPO GRATUITO DE ESTUDOS</div>
      <h2>ENTRE PARA O GRUPO DE ESTUDOS!</h2>
      <p>Receba diretamente no WhatsApp:</p>
      <ul class="lista">
        <li>📚 Questões de Informática para concursos</li>
        <li>💡 Dicas e conteúdos para sua preparação</li>
        <li>🧠 Materiais e desafios para praticar</li>
        <li>📢 Novidades e conteúdos do DevMapas</li>
      </ul>
      <a class="btn wbtn" data-cta="grupo" target="_blank" rel="noopener">${WA_SVG}<span>ENTRAR NO GRUPO GRATUITO</span></a>
    </div>`;
}

const MODELO = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITULO__ — DevMapas</title>
<meta name="description" content="Teste seus conhecimentos com 5 questões comentadas de Informática para concursos.">
<!-- PRÉVIA AO COMPARTILHAR: mesma imagem para todos os desafios (URL absoluta) -->
<meta property="og:type" content="website">
<meta property="og:title" content="__TITULO__ — Desafio de Informática | DevMapas">
<meta property="og:description" content="Teste seus conhecimentos com 5 questões comentadas de Informática para concursos.">
<meta property="og:image" content="__OGIMG__">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__OGIMG__">
<!-- Vercel Web Analytics (conta os acessos; só funciona no site publicado na Vercel) -->
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script>
<script defer src="/_vercel/insights/script.js"></script>
<style>
:root{--g:#7a4fd6;--gd:#3b1d6e;--gl:#efe8fb;--bg:#f7f4fd;--tx:#1f1a33;--mu:#6b6485;--bd:#e4def0;--ok:#16a34a;--bad:#d97706;--wa:#25D366}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.app{max-width:520px;margin:0 auto;padding:12px 12px 40px}
[hidden]{display:none!important}
.hero{background:linear-gradient(160deg,#6a3fc4,#3b1d6e);color:#fff;border-radius:24px;padding:12px 16px 14px;text-align:center;box-shadow:0 6px 18px rgba(59,29,110,.18)}
.brand{font-size:17px;font-weight:900;letter-spacing:.2em;line-height:1.1}
.by{font-size:10.5px;opacity:.7;margin:1px 0 0}
.line{height:1px;background:rgba(255,255,255,.22);margin:9px 28px}
h1{font-size:17px;line-height:1.2;margin:0;letter-spacing:.03em}
.sub{margin:3px 0 0;font-size:12.5px;opacity:.88}
.chip{display:inline-block;margin-top:8px;background:#fff;color:var(--gd);font-weight:800;font-size:11.5px;letter-spacing:.04em;padding:4px 12px;border-radius:99px}
.step{font-weight:800;color:var(--g);margin:12px 0 6px;font-size:12px;letter-spacing:.06em}
.dots{display:flex;gap:5px}
.dot{height:6px;flex:1;border-radius:99px;background:var(--bd);transition:background .3s}
.dot.on{background:var(--g)}
.card{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:14px;margin-top:10px;animation:in .3s ease}
@keyframes in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.enun{font-weight:600;font-size:15px;line-height:1.45;white-space:pre-wrap;margin:0 0 10px}
.opt{display:flex;gap:10px;align-items:center;width:100%;text-align:left;font:inherit;font-size:14.5px;line-height:1.35;background:#fff;border:2px solid var(--bd);border-radius:14px;padding:9px 12px;margin-bottom:7px;min-height:46px;cursor:pointer;color:var(--tx);transition:border-color .2s,background .2s}
.opt b{flex:none;width:26px;height:26px;border-radius:50%;background:var(--bg);display:grid;place-items:center;font-size:13px}
.opt span{white-space:pre-wrap;min-width:0;overflow-wrap:anywhere}
.opt.sel{border-color:var(--g);background:var(--gl)}
.opt.sel b{background:var(--g);color:#fff}
.opt.ok{border-color:var(--ok);background:#dcfce7}
.opt.ok b{background:var(--ok);color:#fff}
.opt.bad{border-color:var(--bad);background:#fff4e0}
.opt.bad b{background:var(--bad);color:#fff}
.opt:disabled{cursor:default}
.btn{display:block;width:100%;border:0;border-radius:14px;padding:14px;font:inherit;font-size:15px;font-weight:800;letter-spacing:.03em;background:var(--g);color:#fff;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.btn:active{transform:translateY(2px);box-shadow:none}
#confirmar,#proxima{position:sticky;bottom:10px;z-index:2}
.fb{border-radius:16px;padding:12px 14px;margin-top:4px;animation:in .3s ease}
.fb.ok{background:#dcfce7}.fb.bad{background:#fff4e0}
.fb h3{margin:0 0 4px;font-size:16px}
.fb p{margin:5px 0;font-size:14px;white-space:pre-wrap}
.mem{background:#fff9e6;border-left:5px solid #f4b400;border-radius:12px;padding:10px 12px;margin-top:8px;font-size:14px}
.big{font-size:44px;font-weight:800;color:var(--gd);line-height:1.1;margin:4px 0}
.bar{height:12px;background:var(--bd);border-radius:99px;overflow:hidden;margin:10px 0}
.bar i{display:block;height:100%;width:0;background:var(--g);border-radius:99px;transition:width .9s ease}
.msg{color:var(--mu);font-style:italic;font-size:14px}
.center{text-align:center}
.center h2{font-size:18px;margin:0 0 4px;color:var(--gd)}
.center p{margin:4px 0}
.center{background:linear-gradient(#fff,#f1ebfc)}
.next{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--mu);margin:18px 4px 0;text-align:center}
.go{border-radius:22px;padding:16px;margin-top:12px;border:2px solid #d9cdf3;background:#fff;text-align:center}
.go h2{font-size:16px;line-height:1.25;margin:0;color:var(--gd)}
.go p{font-size:13.5px;line-height:1.45;margin:8px 0 0;color:#4b4264}
.go .btn{margin-top:14px;padding:13px;font-size:14px}
.ico{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:23px;margin:0 auto 8px;background:var(--gl)}
.capa{width:132px;min-height:132px;margin:0 auto 12px;border-radius:16px;background:var(--gl);border:2px dashed #d6c8f3;display:grid;place-items:center;font-size:38px;overflow:hidden;box-shadow:0 4px 12px rgba(59,29,110,.14)}
.capa img{display:block;width:100%;height:auto}
.capa.has{min-height:0;border:0;font-size:0;background:#fff}
.kick{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--g);margin:0 0 6px}
.importante{margin-top:14px;background:#fff4cc;border:2px solid #f4b400;border-radius:14px;padding:10px 12px;font-size:14px;line-height:1.35;font-weight:800;color:#5a3b00}
.importante span{display:block;font-size:12px;letter-spacing:.06em;margin-bottom:3px}
.wbtn{display:flex;align-items:center;justify-content:center;gap:8px}
.wbtn svg{flex:none;width:20px;height:20px;fill:currentColor}
.go.wa .kick{color:#128C7E}
.go.wa h2{color:#075E54}
.go.gr .kick{color:#7ee2a8}
.go.gr .wbtn svg{fill:#25D366}
.go.a{border-top:6px solid var(--g)}
.go.b{background:#ece3fb;border-color:#c9b6f0}
.go.b .btn{background:var(--gd)}
.go.b .kick{color:var(--gd)}
.go.wa{background:#e9fbef;border-color:var(--wa)}
.go.wa .ico{background:var(--wa)}
.go.wa .btn{background:var(--wa);color:#053b1d;font-size:13.5px;letter-spacing:0}
.go.gr{background:#075E54;border-color:#075E54}
.go.gr h2{color:#fff}.go.gr p{color:#d3efe3}
.go.gr .ico{background:#128C7E}
.go.gr .btn{background:#fff;color:#075E54}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
.qtd{font-weight:700;color:var(--gd);font-size:14px}
.importante.azul{background:#e8f0fe;border:2px solid #c3d0f5;color:#1e3a8a;font-weight:700}
.importante.azul span{color:#1e40af}
.btn.laranja{background:#d9480f;color:#fff;box-shadow:0 3px 0 #a33708,0 6px 12px rgba(217,72,15,.22);transition:background .2s,transform .1s}
@media (hover:hover){.btn.laranja:hover{background:#c2410c;transform:translateY(-1px)}}
.btn.laranja:active{background:#b83a0a;transform:translateY(2px);box-shadow:0 1px 0 #a33708}
.go.wa .lista{list-style:none;margin:10px auto 0;padding:0;display:inline-block;text-align:left;font-size:14px;line-height:1.75;color:#2f5d4a}
</style>
</head>
<body>
<div class="app">
  <header class="hero">
    <div class="brand">DEVMAPAS</div>
    <div class="by">por Mikaelly Dias</div>
    <div class="line"></div>
    <h1>🧠 DESAFIO DE INFORMÁTICA</h1>
    <p class="sub" id="subtitulo">__SUBTITULO__</p>
    <span class="chip"><span id="titulo">__TITULO__</span> · 5 QUESTÕES</span>
  </header>

  <section id="quiz">
    <div class="step" id="prog"></div>
    <div class="dots" id="dots"></div>
    <div class="card" id="qcard">
      <p class="enun" id="enun"></p>
      <div id="opts"></div>
      <button class="btn" id="confirmar" hidden>CONFIRMAR RESPOSTA</button>
      <div id="fb" hidden></div>
      <button class="btn" id="proxima" hidden>PRÓXIMA QUESTÃO →</button>
    </div>
  </section>

  <section id="resultado" hidden>
    <div class="card center">
      <h2>🎉 DESAFIO CONCLUÍDO!</h2>
      <p>Você acertou:</p>
      <div class="big" id="placar"></div>
      <p id="pct"></p>
      <div class="bar"><i id="barra"></i></div>
      <p class="msg">Errar durante o treino faz parte. O importante é descobrir o erro antes que ele apareça na prova.</p>
    </div>
    <div class="next">PRÓXIMOS PASSOS</div>

    <!-- TEXTOS DOS CARDS: edite aqui. Os links ficam em CTA_LINKS, no final do arquivo. -->
    __CARDS__
  </section>
</div>

<script>
/* ===== EDITE OS LINKS DOS CTAs AQUI ===== */
const CTA_LINKS = __LINKS__;

/* ===== RASTREAMENTO DE CLIQUES (gerado automaticamente) =====
   Os botões listados em RASTREAR abrem /ir/<desafio>-<botão>.html (página que conta o clique
   e redireciona). Para trocar esses links, gere o desafio de novo no gerador. */
const DESAFIO_ID = "__SLUG__";
const RASTREAR = __RASTREAR__;

/* ===== IMAGENS DAS CAPAS (cards do simulado e dos mapas) =====
   Se a imagem não existir, o card mostra um espaço com emoji no lugar. */
const IMAGENS = __IMAGENS__;

/* ===== QUESTÕES (geradas automaticamente) ===== */
const QUESTOES = __DADOS__;

/* ===== LÓGICA DO DESAFIO ===== */
const $ = id => document.getElementById(id);
let i = 0, sel = null, feito = false, acertos = 0;

document.querySelectorAll('[data-cta]').forEach(a => {
  const l = CTA_LINKS[a.dataset.cta];
  if (l && l.indexOf('COLE_') !== 0) a.href = RASTREAR.indexOf(a.dataset.cta) >= 0 ? '/ir/' + DESAFIO_ID + '-' + a.dataset.cta + '.html' : l;
  else a.addEventListener('click', e => e.preventDefault());
});
if (!$('subtitulo').textContent.trim()) $('subtitulo').textContent = 'Teste seus conhecimentos';
document.querySelectorAll('[data-capa]').forEach(box => {
  const u = IMAGENS[box.dataset.capa];
  if (!u || u.indexOf('COLE_') === 0) return;
  const im = new Image();
  im.alt = 'Capa do material';
  im.onload = () => { box.appendChild(im); box.classList.add('has'); };
  im.src = u;
});

function el(tag, cls, txt) {
  const x = document.createElement(tag);
  if (cls) x.className = cls;
  if (txt !== undefined) x.textContent = txt;
  return x;
}

function render() {
  const q = QUESTOES[i];
  sel = null; feito = false;
  $('prog').textContent = 'QUESTÃO ' + (i + 1) + ' DE ' + QUESTOES.length;
  $('dots').innerHTML = '';
  QUESTOES.forEach((_, k) => $('dots').appendChild(el('span', 'dot' + (k <= i ? ' on' : ''))));
  $('enun').textContent = q.e;
  $('opts').innerHTML = '';
  Object.keys(q.a).forEach(L => {
    const b = el('button', 'opt');
    b.type = 'button';
    b.dataset.l = L;
    b.appendChild(el('b', '', L));
    b.appendChild(el('span', '', q.a[L]));
    b.addEventListener('click', () => {
      if (feito) return;
      sel = L;
      document.querySelectorAll('.opt').forEach(o => o.classList.toggle('sel', o.dataset.l === L));
      $('confirmar').hidden = false;
    });
    $('opts').appendChild(b);
  });
  $('confirmar').hidden = true; $('fb').hidden = true; $('proxima').hidden = true;
  $('qcard').style.animation = 'none'; void $('qcard').offsetWidth; $('qcard').style.animation = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

$('confirmar').addEventListener('click', () => {
  if (!sel || feito) return;
  feito = true;
  const q = QUESTOES[i], certo = sel === q.g;
  if (certo) acertos++;
  document.querySelectorAll('.opt').forEach(o => {
    o.disabled = true;
    o.classList.remove('sel');
    if (o.dataset.l === q.g) o.classList.add('ok');
    else if (o.dataset.l === sel) o.classList.add('bad');
  });
  const fb = $('fb');
  fb.className = 'fb ' + (certo ? 'ok' : 'bad');
  fb.innerHTML = '';
  fb.appendChild(el('h3', '', certo ? '✅ VOCÊ ACERTOU!' : '❌ NÃO FOI DESSA VEZ!'));
  fb.appendChild(el('p', '', 'Gabarito: ' + (q.t === 'ce' ? q.a[q.g] : q.g)));
  fb.appendChild(el('p', '', q.c));
  if (q.m) {
    const m = el('div', 'mem');
    m.appendChild(el('strong', '', '📚 PARA MEMORIZAR'));
    m.appendChild(el('p', '', q.m));
    fb.appendChild(m);
  }
  fb.hidden = false;
  $('confirmar').hidden = true;
  $('proxima').textContent = i === QUESTOES.length - 1 ? 'VER RESULTADO →' : 'PRÓXIMA QUESTÃO →';
  $('proxima').hidden = false;
  fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

$('proxima').addEventListener('click', () => {
  if (i < QUESTOES.length - 1) { i++; render(); } else resultado();
});

function resultado() {
  $('quiz').hidden = true; $('resultado').hidden = false;
  const p = Math.round(acertos / QUESTOES.length * 100);
  $('placar').textContent = acertos + '/' + QUESTOES.length;
  $('pct').textContent = p + '% de aproveitamento';
  setTimeout(() => { $('barra').style.width = p + '%'; }, 80);
  window.scrollTo({ top: 0 });
}
render();
<\/script>
</body>
</html>`;

// Página /ir/<desafio>-<botão>.html: registra a visita (Vercel Web Analytics) e redireciona
const REDIRECT_MODELO = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Abrindo… — DevMapas</title>
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};<\/script>
<script defer src="/_vercel/insights/script.js"><\/script>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f4fd;color:#3b1d6e;font:16px system-ui,sans-serif;text-align:center}
b{letter-spacing:.2em}a{display:inline-block;margin-top:12px;background:#7a4fd6;color:#fff;padding:12px 22px;border-radius:14px;text-decoration:none;font-weight:700}</style>
</head>
<body><main><b>DEVMAPAS</b><p>Abrindo o link…</p><a href="__DESTINO_HTML__">Continuar</a></main>
<script>
var DESTINO = __DESTINO_JS__, ok = false;
function ir() { if (ok) return; ok = true; location.replace(DESTINO); }
window.addEventListener('load', function () { setTimeout(ir, 700); });
setTimeout(ir, 2500);
<\/script>
</body>
</html>`;
function paginaRedirect(destino) {
  return REDIRECT_MODELO.split('__DESTINO_HTML__').join(esc(destino).replace(/"/g, '&quot;'))
    .split('__DESTINO_JS__').join(JSON.stringify(destino).replace(/</g, '\\u003c'));
}

// ---------- Utilitários ----------
function nomeArquivo(v) {
  const n = v.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\.html$/, '').replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return (n || 'desafio') + '.html';
}
$('arquivo').addEventListener('input', () => { $('prev').textContent = 'Arquivo gerado: ' + nomeArquivo($('arquivo').value); });
$('btnExemplo').addEventListener('click', () => {
  $('titulo').value = 'Desafio de Excel';
  $('arquivo').value = 'excel';
  [EXEMPLO, EXEMPLO_SEM_MEM, EXEMPLO_CE, EXEMPLO_CE.replace('GABARITO: ERRADO', 'GABARITO: CERTO'), EXEMPLO].forEach((t, k) => $('q' + (k + 1)).value = t);
  $('arquivo').dispatchEvent(new Event('input'));
});

// ---------- Tipo de desafio ----------
const tipoAtual = () => document.querySelector('input[name="tipo"]:checked').value;
document.querySelectorAll('input[name="tipo"]').forEach(r => r.addEventListener('change', () => { $('especifico').hidden = tipoAtual() !== 'especifico'; }));

// ---------- Gerar ----------
$('btnGerar').addEventListener('click', () => {
  $('ok').hidden = true; $('ok2').hidden = true; $('erro').hidden = true;
  const titulo = $('titulo').value.trim();
  const tipo = tipoAtual();
  const erros = [];
  if (!titulo) erros.push('Preencha o título do desafio.');
  if (!$('arquivo').value.trim()) erros.push('Preencha o nome do arquivo.');
  const dados = [];
  for (let n = 1; n <= 5; n++) {
    const txt = $('q' + n).value.trim();
    if (!txt) { erros.push('Questão ' + n + ': está vazia.'); continue; }
    const r = parseQuestao(txt, n);
    erros.push(...r.erros);
    dados.push(r.q);
  }
  // configuração dos cards finais conforme o tipo
  let links, imagens, cards;
  if (tipo === 'especifico') {
    const d = { concurso: $('concurso').value.trim(), simulado: $('nomeSimulado').value.trim(), descricao: $('descricao').value.trim(),
                imagem: $('imgCapa').value.trim(), linkSimulado: $('linkSimulado').value.trim(), linkGrupo: $('linkGrupo').value.trim() };
    if (!d.concurso) erros.push('Simulado específico: preencha o nome do concurso.');
    if (!d.simulado) erros.push('Simulado específico: preencha o nome do simulado.');
    if (!d.descricao) erros.push('Simulado específico: preencha a descrição do simulado.');
    if (!d.imagem) erros.push('Simulado específico: preencha o nome da imagem da capa (ex.: capa-pmma.png).');
    else if (!/^[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/i.test(d.imagem)) erros.push('Nome da imagem inválido: use só o nome do arquivo, ex.: capa-pmma.png (sem pasta, sem espaços).');
    if (!d.linkSimulado) erros.push('Simulado específico: preencha o link do simulado.');
    else if (!/^https?:\/\/\S+$/i.test(d.linkSimulado)) erros.push('O link do simulado deve começar com http:// ou https://');
    if (!d.linkGrupo) erros.push('Simulado específico: preencha o link do grupo gratuito.');
    else if (!/^https?:\/\/\S+$/i.test(d.linkGrupo)) erros.push('O link do grupo deve começar com http:// ou https://');
    links = { simulado: d.linkSimulado, grupo: d.linkGrupo };
    imagens = { simulado: BASE_IMG + d.imagem };
    cards = erros.length ? '' : cardsEspecifico(d);
  } else {
    links = PADRAO.links; imagens = PADRAO.imagens; cards = CARDS_GERAL;
  }
  if (erros.length) { $('erro').textContent = erros.join('\n'); $('erro').hidden = false; return; }

  const slug = nomeArquivo($('arquivo').value).replace(/\.html$/, '');
  const rastrear = ['simulado', 'grupo'].filter(k => /^https?:\/\/\S+$/i.test(links[k] || ''));
  const js = o => JSON.stringify(o, null, 4).replace(/</g, '\\u003c');
  const json = JSON.stringify(dados).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' ');
  const html = MODELO
    .split('__CARDS__').join(cards)
    .split('__TITULO__').join(esc(titulo))
    .split('__SUBTITULO__').join(esc($('subtitulo').value.trim()))
    .split('__LINKS__').join(js(links))
    .split('__IMAGENS__').join(js(imagens))
    .split('__SLUG__').join(slug)
    .split('__RASTREAR__').join(JSON.stringify(rastrear))
    .split('__OGIMG__').join(PADRAO.imagemCompartilhamento)
    .split('__DADOS__').join(json);

  const baixar = (nome, conteudo) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([conteudo], { type: 'text/html;charset=utf-8' }));
    a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  baixar(nomeArquivo($('arquivo').value), html);
  // páginas de contagem de cliques (uma por botão rastreado)
  rastrear.forEach((k, i) => setTimeout(() => baixar(slug + '-' + k + '.html', paginaRedirect(links[k])), 500 * (i + 1)));
  if (rastrear.length) {
    $('ok2').textContent = 'Envie para o site:\n• ' + nomeArquivo($('arquivo').value) + ' → pasta /desafios/\n' + rastrear.map(k => '• ' + slug + '-' + k + '.html → pasta /ir/').join('\n') + '\n(Se o navegador perguntar, permita baixar vários arquivos.)';
    $('ok2').hidden = false;
  }
  $('ok').hidden = false;
});
