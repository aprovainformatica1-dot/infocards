// ---------------------------------------------------------------------------------------------
// Renderizador da PÁGINA DE VENDA (modelo oficial PMPE). Recebe { slug, dados } e devolve o HTML pronto
// (usado na página pública /venda/slug e na prévia do painel — é o mesmo código, por isso a prévia = a página publicada).
// Ordem fixa: Cabeçalho · Hero · Pratique com estratégia · Quer ir além? (+ carrossel de mapas) · Depoimentos ·
// Ofertas · Dúvidas frequentes · Suporte · Rodapé. Cada seção só aparece se estiver "visível". Ocultar não apaga dados.
// O CSS é o da página manual da PMPE (api/_venda-css.js, gerado a partir dela); as cores de cada página entram como variáveis.
// Todo texto é escapado; links e imagens só passam se forem URLs válidas.
// ---------------------------------------------------------------------------------------------
const regras = require('../simulados/regras.js');
const CSS = require('./_venda-css.js');
const BASE_SITE = 'https://devmapas.vercel.app';
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const absoluta = (u) => (u && u.charAt(0) === '/' ? BASE_SITE + u : u);

// ---------- cores: variáveis por página, com garantia de leitura (contraste) ----------
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const hex = (a) => '#' + a.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const mix = (h, alvo, f) => { const a = rgb(h), b = rgb(alvo); return hex(a.map((x, i) => x + (b[i] - x) * f)); };
const lum = (h) => { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
// aproxima "cor" de "alvo" (branco ou preto) até ler bem sobre "fundo" (mín. 4,5:1)
function legivel(cor, fundo, alvo, min) { let c = cor, i = 0; while (contraste(c, fundo) < (min || 4.5) && i++ < 20) c = mix(c, alvo, 0.1); return c; }

function variaveis(cores) {
  const escura = legivel(cores.escura, '#FFFFFF', '#000000'), principal = legivel(cores.principal, '#FFFFFF', '#000000');
  const dest = cores.destaque, roxoClaro = mix(principal, '#FFFFFF', 0.22);
  const sobre = contraste(dest, escura) >= 4.5 ? escura : (contraste(dest, '#000000') >= contraste(dest, '#FFFFFF') ? '#000000' : '#FFFFFF');
  const v = {
    '--branco': '#FFFFFF', '--texto': '#202A33', '--texto-suave': '#596773', '--texto-claro': 'rgba(255,255,255,.88)', '--whatsapp': '#25D366', '--fonte-titulo': "'Sora', sans-serif", '--fonte-texto': "'Inter', sans-serif", '--raio': '18px',
    '--escuro': escura, '--escuro-2': mix(escura, '#FFFFFF', 0.06), '--roxo': principal, '--roxo-2': mix(principal, '#FFFFFF', 0.15), '--roxo-claro': roxoClaro, '--fundo-alt': cores.fundo,
    '--borda': mix(principal, '#FFFFFF', 0.88), '--sombra': '0 12px 30px color-mix(in srgb, ' + escura + ' 10%, transparent)',
    '--amarelo': dest, '--amarelo-escuro': mix(dest, '#000000', 0.15), '--sobre-amarelo': sobre,
    '--amarelo-claro': legivel(mix(dest, '#FFFFFF', 0.2), escura, '#FFFFFF'), '--amarelo-pale': legivel(mix(dest, '#FFFFFF', 0.45), roxoClaro, '#FFFFFF'),
    '--amarelo-borda': mix(dest, '#FFFFFF', 0.6), '--amarelo-fundo': mix(dest, '#FFFFFF', 0.9), '--amarelo-fundo-2': mix(dest, '#FFFFFF', 0.82),
    '--hero-sub': legivel(mix('#FFFFFF', escura, 0.12), escura, '#FFFFFF'),
  };
  v['--amarelo-texto'] = legivel(mix(dest, '#000000', 0.55), v['--amarelo-fundo-2'], '#000000');
  return ':root{' + Object.keys(v).map((k) => k + ':' + v[k]).join(';') + '}';
}

// ---------- blocos ----------
const JS_PAGINA = `document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.faq-item__question').forEach(function (button) {
    button.addEventListener('click', function () {
      var item = button.closest('.faq-item'), answer = item.querySelector('.faq-item__answer'), open = item.classList.contains('is-open');
      item.classList.toggle('is-open', !open); button.setAttribute('aria-expanded', String(!open)); answer.style.maxHeight = open ? null : answer.scrollHeight + 'px';
    });
  });
  function setupCarousel(config) {
    var root = document.getElementById(config.root); if (!root) return;
    var track = document.getElementById(config.track), prev = document.getElementById(config.prev), next = document.getElementById(config.next), dotsWrap = document.getElementById(config.dots);
    if (!track || !dotsWrap) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('.carousel__slide')); if (!slides.length) return;
    var index = 0, startX = null;
    var dots = slides.map(function (_, i) { var dot = document.createElement('button'); dot.type = 'button'; dot.className = 'carousel__dot'; dot.setAttribute('aria-label', 'Ir para o item ' + (i + 1)); dot.addEventListener('click', function () { go(i); }); dotsWrap.appendChild(dot); return dot; });
    function go(n) { index = (n + slides.length) % slides.length; track.style.transform = 'translateX(-' + (index * 100) + '%)'; dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i === index); dot.setAttribute('aria-current', i === index ? 'true' : 'false'); }); }
    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) { if (startX === null) return; var delta = startX - e.changedTouches[0].clientX; if (Math.abs(delta) > 40) go(index + (delta > 0 ? 1 : -1)); startX = null; }, { passive: true });
    if (slides.length < 2) { [prev, next, dotsWrap].forEach(function (el) { if (el) el.style.display = 'none'; }); }
    go(0);
  }
  setupCarousel({ root: 'mapasCarousel', track: 'mapasTrack', prev: 'mapasPrev', next: 'mapasNext', dots: 'mapasDots' });
  setupCarousel({ root: 'depoimentosCarousel', track: 'depoimentosTrack', prev: 'depoimentosPrev', next: 'depoimentosNext', dots: 'depoimentosDots' });
  document.querySelectorAll('.carousel__image').forEach(function (img) {
    img.addEventListener('error', function () { var slide = img.closest('.carousel__slide'); if (slide) { slide.classList.add('image-unavailable'); img.style.display = 'none'; slide.style.minHeight = '120px'; slide.style.background = 'var(--fundo-alt)'; } });
  });
});`;

const WA_SVG = '<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 0 0-8.66 15L2 22l5.18-1.36A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.08.81.82-3-.19-.3A8 8 0 1 1 12 20Zm4.38-5.97c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.7-.76.84-.14.14-.28.16-.52.06-.24-.12-1.01-.37-1.93-1.19-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.15 1.51.09.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"/></svg>';

function renderizarVenda({ slug, dados }) {
  const d = regras.normalizar(dados), previa = slug === 'previa';
  const tk = (x) => regras.tokens(x, d), t = (x) => esc(tk(x)).replace(/\n/g, '<br>');
  const ext = (u) => (/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : '');
  const img = (i, cls, alt, eager) => (i && i.url ? '<img src="' + esc(i.url) + '" alt="' + esc(tk(alt || '')) + '" class="' + cls + '"' + (eager ? '' : ' loading="lazy"') + '>' : '');
  const label = (txt, dark) => (txt ? '<span class="tab-label' + (dark ? ' tab-label--dark' : '') + '">' + t(txt) + '</span>' : '');
  const wa = d.suporte.whatsapp.numero ? 'https://wa.me/' + d.suporte.whatsapp.numero + (d.suporte.whatsapp.mensagem ? '?text=' + encodeURIComponent(tk(d.suporte.whatsapp.mensagem)) : '') : '';
  const concurso = d.identificacao.concurso || 'Concurso';
  const S = [];

  // 1. Cabeçalho
  let cab = '';
  if (d.cabecalho.visivel) { const l = d.cabecalho.link || wa;
    cab = '<header class="header"><div class="container header__inner"><a class="logo" href="#topo" aria-label="' + esc(tk(d.cabecalho.marca) || 'DevMapas') + ' — início"><span class="logo__icon" aria-hidden="true">▤</span> ' + t(d.cabecalho.marca || 'DevMapas') + '</a>'
      + (l ? '<a class="header__whatsapp" href="' + esc(l) + '"' + ext(l) + ' aria-label="Falar com o suporte pelo WhatsApp">' + WA_SVG + '</a>' : '') + '</div></header>'; }

  // 2. Hero
  const h = d.hero;
  if (h.visivel) {
    const titulo = t(h.titulo || concurso).replace(/\[\[(.+?)\]\]/g, '<span class="highlight">$1</span>');
    S.push('<section class="hero"><div class="container hero__inner"><div class="hero__content">' + label(h.etiqueta) + (h.eyebrow ? '<p class="hero__eyebrow">' + t(h.eyebrow) + '</p>' : '') + '<h1 class="hero__title">' + titulo + '</h1>'
      + (h.subtitulo ? '<p class="hero__subtitle">' + t(h.subtitulo) + '</p>' : '')
      + (h.aviso.texto ? '<div class="hero__notice"><span aria-hidden="true">✓</span><p>' + (h.aviso.rotulo ? '<strong>' + t(h.aviso.rotulo) + '</strong> ' : '') + t(h.aviso.texto) + '</p></div>' : '')
      + (h.chips.length ? '<div class="hero__chips" aria-label="Destaques do material">' + h.chips.map((c) => '<span>' + t(c) + '</span>').join('') + '</div>' : '') + '</div>'
      + '<div class="hero__visual"><div class="hero__image-frame' + (h.imagem.url ? '' : ' image-missing') + '">' + img(h.imagem, 'hero__image', h.imagemAlt || 'Material visual de Informática do DevMapas', true)
      + '<div class="image-fallback"><span class="fallback-icon">🖥️</span><strong>' + t(concurso) + '</strong><span>Questões + revisão visual</span></div></div>'
      + (h.nota.titulo || h.nota.texto ? '<div class="floating-note"><span>' + t(h.nota.icone || '🎯') + '</span><span><strong>' + t(h.nota.titulo) + '</strong><small>' + t(h.nota.texto) + '</small></span></div>' : '') + '</div></div></section>');
  }

  // 3. Pratique com estratégia
  const es = d.estrategia;
  if (es.visivel) {
    const hrefCta = es.botaoLink || (d.ofertas.visivel ? '#ofertas' : '');
    S.push('<section class="section simulado" id="simulado"><div class="container">' + label(es.etiqueta, true) + (es.titulo ? '<h2 class="section__title">' + t(es.titulo) + '</h2>' : '') + (es.texto ? '<p class="section__text section__text--center">' + t(es.texto) + '</p>' : '')
      + (es.cards.length ? '<div class="benefit-grid">' + es.cards.map((c) => '<article class="benefit-card">' + (c.icone ? '<span class="benefit-icon">' + t(c.icone) + '</span>' : '') + (c.titulo ? '<h3>' + t(c.titulo) + '</h3>' : '') + (c.texto ? '<p>' + t(c.texto) + '</p>' : '') + '</article>').join('') + '</div>' : '')
      + (es.chamada || (es.botao && hrefCta) ? '<div class="section-cta">' + (es.chamada ? '<p>' + t(es.chamada) + '</p>' : '') + (es.botao && hrefCta ? '<a class="btn btn--primary btn--large" href="' + esc(hrefCta) + '"' + ext(hrefCta) + '>' + t(es.botao) + ' <span aria-hidden="true">↓</span></a>' : '') + '</div>' : '') + '</div></section>');
  }

  // 4. Quer ir além? + carrossel de mapas
  const al = d.alem;
  if (al.visivel) {
    const slides = al.mapas.map((m, k) => '<div class="carousel__slide">' + img(m.imagem, 'carousel__image', m.legenda || ('Amostra ' + (k + 1) + ' dos mapas de Informática')) + '</div>').join('');
    S.push('<section class="section pacote" id="pacote"><div class="container"><div class="package-intro">' + label(al.etiqueta) + (al.titulo ? '<h2 class="section__title">' + t(al.titulo) + '</h2>' : '') + (al.texto ? '<p class="section__text">' + t(al.texto) + '</p>' : '')
      + (al.lista.length ? '<ul class="check-list">' + al.lista.map((x) => '<li>' + t(x) + '</li>').join('') + '</ul>' : '') + '</div>'
      + (al.mapas.length ? ((al.mapasTitulo || al.mapasTexto) ? '<div class="samples-heading">' + (al.mapasTitulo ? '<h3>' + t(al.mapasTitulo) + '</h3>' : '') + (al.mapasTexto ? '<p>' + t(al.mapasTexto) + '</p>' : '') + '</div>' : '')
        + '<div class="carousel" id="mapasCarousel" aria-label="Amostras dos mapas de revisão"><div class="carousel__viewport"><div class="carousel__track" id="mapasTrack">' + slides + '</div></div>'
        + '<button type="button" class="carousel__arrow carousel__arrow--prev" id="mapasPrev" aria-label="Ver mapa anterior">‹</button><button type="button" class="carousel__arrow carousel__arrow--next" id="mapasNext" aria-label="Ver próximo mapa">›</button><div class="carousel__dots" id="mapasDots" aria-label="Selecionar amostra"></div></div>' : '')
      + (al.nota ? '<p class="sample-note">' + t(al.nota) + '</p>' : '') + '</div></section>');
  }

  // 5. Depoimentos
  const dp = d.depoimentos;
  if (dp.visivel) {
    const slides = dp.itens.map((m, k) => '<div class="carousel__slide">' + img(m.imagem, 'carousel__image', m.legenda || ('Depoimento de aluno ' + (k + 1))) + '</div>').join('');
    S.push('<section class="section depoimentos"><div class="container">' + label(dp.etiqueta, true) + (dp.titulo ? '<h2 class="section__title">' + t(dp.titulo) + '</h2>' : '') + (dp.texto ? '<p class="section__text section__text--center">' + t(dp.texto) + '</p>' : '')
      + (dp.itens.length ? '<div class="carousel carousel--depoimentos" id="depoimentosCarousel" aria-label="Depoimentos de alunos"><div class="carousel__viewport"><div class="carousel__track" id="depoimentosTrack">' + slides + '</div></div>'
        + '<button type="button" class="carousel__arrow carousel__arrow--prev" id="depoimentosPrev" aria-label="Ver depoimento anterior">‹</button><button type="button" class="carousel__arrow carousel__arrow--next" id="depoimentosNext" aria-label="Ver próximo depoimento">›</button><div class="carousel__dots" id="depoimentosDots" aria-label="Selecionar depoimento"></div></div>' : '') + '</div></section>');
  }

  // 6. Ofertas (cada uma independente; checkout só com link real)
  const of = d.ofertas;
  function card(o, tipo) {
    if (!o.visivel || !(o.nome || o.preco)) return '';
    const p = regras.precoPartes(o.preco), pp = o.precoPromocional ? regras.precoPartes(o.precoPromocional) : null, ativo = pp && p && pp.valor < p.valor, mostra = ativo ? pp : p;
    const linkOk = !regras.problemaLink(o.link), btnCls = tipo === 'simulado' ? 'btn--outline' : 'btn--primary';
    const botao = linkOk ? '<a class="btn ' + btnCls + ' btn--large btn--full" href="' + esc(o.link) + '" target="_blank" rel="noopener">' + t(o.botao || (tipo === 'simulado' ? 'QUERO O SIMULADO' : 'QUERO O PACOTE COMPLETO')) + '</a>'
      : (previa ? '<span class="btn ' + btnCls + ' btn--large btn--full is-disabled" role="note">⚠ Link de checkout não configurado (não será possível publicar)</span>' : '');
    return '<article class="offer-card offer-card--featured">' + (o.selo ? '<div class="recommended-badge">' + t(o.selo) + '</div>' : '')
      + '<div class="offer-card__top">' + (o.rotulo ? '<span class="offer-label">' + t(o.rotulo) + '</span>' : '') + (o.nome ? '<h3>' + t(o.nome) + '</h3>' : '') + (o.descricao ? '<p class="offer-description">' + t(o.descricao) + '</p>' : '') + '</div>'
      + (ativo ? '<span class="offer-price-old">De <s>R$ ' + esc(p.reais) + ',' + esc(p.centavos) + '</s> por apenas</span>' : '')
      + (mostra ? '<div class="offer-price"><span class="currency">R$</span><strong>' + esc(mostra.reais) + '</strong><span class="cents">,' + esc(mostra.centavos) + '</span></div>' : (o.preco ? '<div class="offer-price"><strong style="font-size:2rem">' + t(o.preco) + '</strong></div>' : ''))
      + (o.diferenca ? '<p class="difference">' + t(o.diferenca) + '</p>' : '') + (o.itens.length ? '<ul class="offer-list">' + o.itens.map((i) => '<li>' + t(i) + '</li>').join('') + '</ul>' : '') + botao
      + (o.nota ? '<p class="offer-footnote">' + t(o.nota) + '</p>' : '') + '</article>';
  }
  if (of.visivel) {
    const cards = [card(of.simulado, 'simulado'), card(of.pacote, 'pacote')].filter(Boolean);
    S.push('<section class="section oferta" id="ofertas"><div class="container">' + label(of.etiqueta) + (of.titulo ? '<h2 class="section__title section__title--light">' + t(of.titulo) + '</h2>' : '') + (of.texto ? '<p class="section__text section__text--light section__text--center">' + t(of.texto) + '</p>' : '')
      + (cards.length ? '<div class="offers-grid' + (cards.length === 1 ? ' offers-grid--single' : '') + '">' + cards.join('') + '</div>' : '')
      + (of.compra.titulo || of.compra.texto ? '<div class="purchase-info">' + (of.compra.icone ? '<span>' + t(of.compra.icone) + '</span>' : '') + '<p>' + (of.compra.titulo ? '<strong>' + t(of.compra.titulo) + '</strong><br>' : '') + t(of.compra.texto) + '</p></div>' : '') + '</div></section>');
  }

  // 7. Dúvidas frequentes
  const fq = d.faq;
  if (fq.visivel) S.push('<section class="section faq"><div class="container container--narrow">' + label(fq.etiqueta, true) + (fq.titulo ? '<h2 class="section__title">' + t(fq.titulo) + '</h2>' : '')
    + '<div class="faq-list">' + fq.itens.map((f) => '<article class="faq-item"><button class="faq-item__question" type="button" aria-expanded="false">' + t(f.pergunta) + '<span class="faq-item__arrow">▾</span></button><div class="faq-item__answer"><p>' + t(f.resposta) + '</p></div></article>').join('') + '</div></div></section>');

  // 8. Suporte e contato
  const su = d.suporte;
  if (su.visivel) { const l = su.link || wa;
    S.push('<section class="section suporte"><div class="container container--narrow">' + label(su.etiqueta) + (su.titulo ? '<h2 class="section__title">' + t(su.titulo) + '</h2>' : '') + (su.texto ? '<p class="section__text section__text--center">' + t(su.texto) + '</p>' : '')
      + (l && su.botao ? '<a class="btn btn--whatsapp btn--large" href="' + esc(l) + '"' + ext(l) + '>' + t(su.botao) + '</a>' : '') + '</div></section>'); }

  // 9. Rodapé
  const ro = d.rodape;
  const rod = ro.visivel ? '<footer class="footer"><div class="container">' + (ro.linha1 ? '<p>' + t(ro.linha1) + '</p>' : '') + (ro.linha2 ? '<p class="footer__legal">' + t(ro.linha2) + '</p>' : '') + '</div></footer>' : '';

  const titulo = tk(d.seo.titulo) || (concurso + ' — Simulado de Informática | DevMapas'), desc = tk(d.seo.descricao) || tk(d.hero.subtitulo) || titulo, og = absoluta(d.hero.imagem.url);
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>' + esc(titulo) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '"><meta name="theme-color" content="' + esc(d.cores.escura) + '"><meta property="og:title" content="' + esc(titulo) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:type" content="website">'
    + (og ? '<meta property="og:image" content="' + esc(og) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(og) + '">' : '')
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>' + variaveis(d.cores) + CSS + '</style>'
    + (previa ? '' : '<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script><script defer src="/_vercel/insights/script.js"></script>') + '</head><body>'
    + cab + '<main id="topo">' + S.join('') + '</main>' + rod + '<script>' + JS_PAGINA + '</script></body></html>';
}

module.exports = { renderizarVenda };
