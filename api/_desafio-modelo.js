// Modelo HTML da página pública do DESAFIO (/desafio/slug). Marcadores: __TITULO__, __DESC__, __OGIMG__, __DADOS__.
// Visual no padrão dos desafios do DevMapas (roxo). Independente do modelo das dicas.
module.exports = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITULO__ — Desafio DevMapas</title>
<meta property="og:title" content="__TITULO__ — Desafio DevMapas">
<meta property="og:description" content="__DESC__">
<meta property="og:type" content="website">
<meta property="og:image" content="__OGIMG__">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="__OGIMG__">
<style>
:root{--g:#7a4fd6;--gd:#3b1d6e;--gl:#efe8fb;--bg:#f7f4fd;--tx:#1f1a33;--mu:#6b6485;--bd:#e4def0;--ok:#16a34a;--bad:#d97706;--wa:#25D366}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--tx);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.app{max-width:520px;margin:0 auto;padding:12px 12px 40px}
[hidden]{display:none!important}
.hero{background:linear-gradient(160deg,#6a3fc4,#3b1d6e);color:#fff;border-radius:24px;padding:12px 16px 14px;text-align:center;box-shadow:0 6px 18px rgba(59,29,110,.18)}
.brand{font-size:17px;font-weight:900;letter-spacing:.2em;line-height:1.1}
.line{height:1px;background:rgba(255,255,255,.22);margin:9px 28px}
h1{font-size:17px;line-height:1.2;margin:0;letter-spacing:.03em}
.sub{margin:3px 0 0;font-size:12.5px;opacity:.88}
.chip{display:inline-block;margin-top:8px;background:#fff;color:var(--gd);font-weight:800;font-size:11.5px;letter-spacing:.04em;padding:4px 12px;border-radius:99px}
.step{font-weight:800;color:var(--g);margin:12px 0 6px;font-size:12px;letter-spacing:.06em}
.dots{display:flex;gap:5px}
.dot{height:6px;flex:1;border-radius:99px;background:var(--bd);transition:background .3s}
.dot.on{background:var(--g)}
.card{background:#fff;border:1px solid var(--bd);border-radius:20px;padding:14px;margin-top:10px}
.enun{font-weight:600;font-size:15px;line-height:1.45;white-space:pre-wrap;margin:0 0 10px}
.opt{display:flex;gap:10px;align-items:center;width:100%;text-align:left;font:inherit;font-size:14.5px;line-height:1.35;background:#fff;border:2px solid var(--bd);border-radius:14px;padding:9px 12px;margin-bottom:7px;min-height:46px;cursor:pointer;color:var(--tx);transition:border-color .2s,background .2s}
.opt b{flex:none;width:26px;height:26px;border-radius:50%;background:var(--bg);display:grid;place-items:center;font-size:13px}
.opt span{white-space:pre-wrap;min-width:0;overflow-wrap:anywhere}
@media (hover:hover){.opt:not(:disabled):hover{border-color:var(--g);background:var(--gl)}}
.opt.ok{border-color:var(--ok);background:#dcfce7}
.opt.ok b{background:var(--ok);color:#fff}
.opt.bad{border-color:var(--bad);background:#fff4e0}
.opt.bad b{background:var(--bad);color:#fff}
.opt:disabled{cursor:default;color:var(--tx)}
:focus-visible{outline:3px solid #b79af0;outline-offset:2px}
.btn{display:block;width:100%;border:0;border-radius:14px;padding:14px;font:inherit;font-size:15px;font-weight:800;letter-spacing:.03em;background:var(--g);color:#fff;cursor:pointer;text-align:center;text-decoration:none;margin-top:8px;box-shadow:0 3px 0 rgba(0,0,0,.18)}
.btn:active{transform:translateY(2px);box-shadow:none}
#proxima{position:sticky;bottom:10px;z-index:2}
.fb{border-radius:16px;padding:12px 14px;margin-top:4px}
.fb.ok{background:#dcfce7}.fb.bad{background:#fff4e0}
.fb h3{margin:0 0 4px;font-size:16px}
.fb p{margin:5px 0;font-size:14px;white-space:pre-wrap}
.mem{background:#fff9e6;border-left:5px solid #f4b400;border-radius:12px;padding:10px 12px;margin-top:8px;font-size:14px;white-space:pre-wrap}
.mem b{display:block;font-size:12px;letter-spacing:.06em;margin-bottom:2px}
.fim{background:linear-gradient(#fff,#f1ebfc);border:1px solid var(--bd);border-radius:20px;padding:14px 14px 12px;text-align:center}
.fim h2{margin:0;font-size:20px;color:var(--gd);letter-spacing:.02em}
.placar{display:flex;justify-content:center;gap:30px;margin-top:6px}
.big{font-size:36px;font-weight:800;color:var(--gd);line-height:1.1}
.rot{font-size:12px;color:var(--mu)}
.bar{height:10px;background:var(--bd);border-radius:99px;overflow:hidden;margin:8px 0 0}
.bar i{display:block;height:100%;width:0;background:var(--g);border-radius:99px;transition:width .9s ease}
.next{font-size:12px;font-weight:800;letter-spacing:.06em;color:var(--mu);margin:14px 4px 0;text-align:center}
.go{border-radius:22px;padding:16px;margin-top:10px;border:2px solid #d9cdf3;background:#fff;text-align:center}
.go h2{font-size:16px;line-height:1.25;margin:0;color:var(--gd)}
.go p{font-size:13.5px;line-height:1.45;margin:8px 0 0;color:#4b4264}
.go .btn{margin-top:14px;padding:13px;font-size:14px}
.capa{width:132px;min-height:132px;margin:0 auto 12px;border-radius:16px;background:var(--gl);border:2px dashed #d6c8f3;display:grid;place-items:center;font-size:38px;overflow:hidden;box-shadow:0 4px 12px rgba(59,29,110,.14)}
.capa img{display:block;width:100%;height:auto}
.capa.has{min-height:0;border:0;font-size:0;background:#fff}
.wbtn{display:flex;align-items:center;justify-content:center;gap:8px}
.wbtn svg{flex:none;width:20px;height:20px;fill:currentColor}
.go.wa h2{color:#075E54}
.go.gr h2{color:#fff}.go.gr p{color:#d3efe3}
.go.gr .wbtn svg{fill:#25D366}
.go.a{border-top:6px solid var(--g)}
.go.b{background:#ece3fb;border-color:#c9b6f0}
.go.b .btn{background:var(--gd)}
.go.wa{background:#e9fbef;border-color:var(--wa)}
.go.wa .btn{background:var(--wa);color:#053b1d;font-size:13.5px;letter-spacing:0}
.go.gr{background:#075E54;border-color:#075E54}
.go.gr .btn{background:#fff;color:#075E54}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
</head>
<body>
<main class="app">
  <header class="hero" id="hero">
    <div class="brand">DEVMAPAS</div>
    <div class="line"></div>
    <h1 id="titulo"></h1>
    <p class="sub" id="subtitulo" hidden></p>
    <span class="chip" id="qtd"></span>
  </header>

  <section id="quiz">
    <div class="step" id="passo"></div>
    <div class="dots" id="dots"></div>
    <div class="card">
      <p class="enun" id="enun"></p>
      <div id="opts" role="group" aria-label="Alternativas"></div>
      <div id="fb" aria-live="polite"></div>
    </div>
    <button type="button" class="btn" id="proxima" hidden></button>
  </section>

  <section id="resultado" hidden>
    <div class="fim">
      <h2>🎉 DESAFIO CONCLUÍDO!</h2>
      <div class="placar">
        <div><div class="big" id="pts"></div><div class="rot">acertos</div></div>
        <div><div class="big" id="pct"></div><div class="rot">de aproveitamento</div></div>
      </div>
      <div class="bar"><i id="barra"></i></div>
    </div>
    <div id="materiais" hidden>
      <div class="next">CONTINUE ESTUDANDO</div>
      <div id="cards"></div>
    </div>
  </section>
</main>
<script>
const D = __DADOS__;
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>';
const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const Q = D.q; let i = 0, acertos = 0, respondida = false;
const LETRAS = 'ABCDE';
const opcoes = (q) => (q.t === 'ce' ? ['CERTO', 'ERRADO'] : q.a);
const rotuloGabarito = (q) => (q.t === 'ce' ? (q.g === 0 ? 'CERTO' : 'ERRADO') : LETRAS[q.g] + ') ' + q.a[q.g]);

$('titulo').textContent = D.t;
if (D.s) { $('subtitulo').textContent = D.s; $('subtitulo').hidden = false; }
$('qtd').textContent = Q.length + (Q.length === 1 ? ' QUESTÃO' : ' QUESTÕES');

function render() {
  respondida = false; const q = Q[i];
  $('passo').textContent = 'QUESTÃO ' + (i + 1) + ' DE ' + Q.length;
  const dots = $('dots'); dots.textContent = '';
  for (let j = 0; j < Q.length; j++) dots.append(el('span', 'dot' + (j <= i ? ' on' : '')));
  $('enun').textContent = q.e; $('fb').textContent = ''; $('proxima').hidden = true;
  const box = $('opts'); box.textContent = '';
  opcoes(q).forEach((txt, k) => {
    const b = el('button', 'opt'); b.type = 'button';
    b.append(el('b', '', q.t === 'ce' ? (k === 0 ? 'C' : 'E') : LETRAS[k]), el('span', '', txt));
    b.addEventListener('click', () => responder(k, b)); box.append(b);
  });
  if (i > 0) $('passo').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Resposta IMEDIATA: ao tocar numa alternativa já mostra certo/errado, comentário e "Para memorizar". Não há botão de confirmar.
function responder(k, botao) {
  if (respondida) return; respondida = true; const q = Q[i], certo = k === q.g; if (certo) acertos++;
  document.querySelectorAll('.opt').forEach((b, idx) => { b.disabled = true; if (idx === q.g) b.classList.add('ok'); });
  if (!certo) botao.classList.add('bad');
  const fb = $('fb'), caixa = el('div', 'fb ' + (certo ? 'ok' : 'bad'));
  caixa.append(el('h3', '', certo ? '✅ Resposta correta!' : '❌ Resposta incorreta.'));
  if (!certo) caixa.append(el('p', '', 'Gabarito: ' + rotuloGabarito(q)));
  caixa.append(el('p', '', q.x)); fb.append(caixa);
  if (q.m) { const m = el('div', 'mem'); m.append(el('b', '', '🧠 PARA MEMORIZAR'), document.createTextNode(q.m)); fb.append(m); }
  const p = $('proxima'); p.textContent = i < Q.length - 1 ? 'PRÓXIMA QUESTÃO' : 'VER RESULTADO'; p.hidden = false;
  fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
$('proxima').addEventListener('click', () => { if (i < Q.length - 1) { i++; render(); } else fim(); });

// Tela final: some o cabeçalho roxo e o resultado já fica no topo.
function fim() {
  $('hero').hidden = true; $('quiz').hidden = true; $('resultado').hidden = false;
  const pct = Math.round((acertos * 100) / Q.length);
  $('pts').textContent = acertos + '/' + Q.length; $('pct').textContent = pct + '%';
  window.scrollTo(0, 0); requestAnimationFrame(() => { $('barra').style.width = pct + '%'; });
  materiais();
}

// Materiais escolhidos no painel: oferta da Central de Ofertas + o link escolhido. O card mostra só capa, título, texto e botão.
const ESTILOS = ['go a', 'go b', 'go wa', 'go gr'];
function materiais() {
  if (!D.c || !D.c.length) return;
  fetch('/api/ofertas').then((r) => r.json()).then((d) => {
    const lista = (d && d.materiais) || [], area = $('cards'); let n = 0;
    D.c.forEach((sel) => {
      const m = lista.find((x) => x.id === sel.m), t = m && (m.textos || [])[0], l = m && (m.links || []).find((x) => x.id === sel.l);
      if (!m || !t || !l) return; n++;
      const card = el('div', ESTILOS.indexOf(m.classe) >= 0 ? m.classe : 'go a');
      if (m.imagem) { const capa = el('div', 'capa', m.capaEmoji || ''); card.append(capa); const im = new Image(); im.alt = 'Capa'; im.onload = () => { capa.append(im); capa.classList.add('has'); }; im.src = m.imagem; }
      card.append(el('h2', '', t.titulo || '')); (t.paragrafos || []).forEach((x) => card.append(el('p', '', x)));
      const a = el('a', 'btn' + (m.iconeWhatsapp ? ' wbtn' : ''));
      if (/^https?:/i.test(l.url)) { a.href = l.url; a.target = '_blank'; a.rel = 'noopener'; }
      if (m.iconeWhatsapp) { a.innerHTML = WA_SVG; a.append(el('span', '', t.botao || '')); } else a.textContent = t.botao || '';
      card.append(a); area.append(card);
    });
    if (n) $('materiais').hidden = false;
  }).catch(() => { /* sem as ofertas o resultado continua funcionando */ });
}
render();
</script>
</body>
</html>
`;
