// Renderizador da página de venda (HTML pronto) — usado por /api/venda (página pública) e pela prévia do painel.
// O CSS_BASE é o CSS do site de vendas atual (mesma identidade visual); só as cores mudam conforme o cadastro.
const CSS_BASE = `:root {
  --roxo-escuro: #4C1D95;   
  --roxo: #7E22CE;          
  --roxo-claro: #A855F7;    
  --fundo-alt: #F8F5FF;     
  --amarelo: #F4A81D;       
  --amarelo-escuro: #D98E0B; 
  --whatsapp: #25D366;      
  --whatsapp-escuro: #1EBE5D;
  --branco: #FFFFFF;
  --texto: #1F2937;
  --texto-suave: #4B5563;
  --texto-claro: rgba(255, 255, 255, 0.85); 
  --borda: #E4D9FB;         
  --fonte-titulo: 'Sora', sans-serif;
  --fonte-texto: 'Inter', sans-serif;
  --raio: 16px;
  --sombra: 0 12px 30px rgba(124, 58, 237, 0.14);
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html {
  scroll-behavior: smooth;
}
body {
  font-family: var(--fonte-texto);
  color: var(--texto);
  background: var(--branco);
  line-height: 1.6;
  overflow-x: hidden;
}
img {
  max-width: 100%;
  display: block;
}
a {
  text-decoration: none;
  color: inherit;
}
ul {
  list-style: none;
}
h1, h2, h3 {
  font-family: var(--fonte-titulo);
  color: var(--roxo-escuro);
  line-height: 1.2;
}
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
  html { scroll-behavior: auto; }
}
.container {
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 20px;
}
.container--narrow {
  max-width: 760px;
}
.section {
  padding: 64px 0;
}
.section__title {
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  font-weight: 800;
  margin-bottom: 16px;
  max-width: 640px;
}
.section__title--light {
  color: var(--branco);
}
.section__text {
  color: var(--texto-suave);
  max-width: 620px;
  margin-bottom: 32px;
  font-size: 1.05rem;
}
.section__text--light {
  color: var(--texto-claro);
}
.section__text--center {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}
.tab-label {
  display: inline-block;
  background: var(--roxo-claro);
  color: var(--branco);
  font-family: var(--fonte-titulo);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 6px 6px 0 0;
  margin-bottom: 18px;
}
.tab-label--dark {
  background: var(--roxo-escuro);
  color: var(--branco);
}
.grid {
  display: grid;
  gap: 20px;
}
.grid--3 {
  grid-template-columns: 1fr;
}
.grid--4 {
  grid-template-columns: repeat(2, 1fr);
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--fonte-titulo);
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  padding: 14px 26px;
  font-size: 1rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.btn:focus-visible {
  outline: 3px solid var(--roxo-escuro);
  outline-offset: 2px;
}
.btn--primary {
  background: var(--amarelo);
  color: var(--roxo-escuro);
  box-shadow: 0 8px 20px rgba(244, 168, 29, 0.4);
}
.btn--primary:hover {
  background: var(--amarelo-escuro);
  transform: translateY(-2px);
}
.btn--ghost {
  background: transparent;
  color: var(--roxo);
  font-weight: 600;
  padding: 14px 10px;
}
.btn--whatsapp {
  background: var(--whatsapp);
  color: var(--branco);
  box-shadow: 0 8px 20px rgba(37, 211, 102, 0.35);
}
.btn--whatsapp:hover {
  background: var(--whatsapp-escuro);
  transform: translateY(-2px);
}
.btn--large {
  padding: 16px 32px;
  font-size: 1.05rem;
}
.btn--small {
  padding: 10px 18px;
  font-size: 0.9rem;
}
.btn--full {
  width: 100%;
}
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--borda);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 14px;
  padding-bottom: 14px;
}
.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--fonte-titulo);
  font-weight: 800;
  font-size: 1.15rem;
  color: var(--roxo-escuro);
}
.logo__icon {
  color: var(--roxo);
}
.hero {
  background: linear-gradient(180deg, var(--fundo-alt) 0%, var(--branco) 100%);
  padding: 56px 0 40px;
}
.hero__inner {
  display: flex;
  flex-direction: column-reverse;
  gap: 40px;
  align-items: center;
}
.hero__content {
  text-align: center;
}
.hero__title {
  font-size: clamp(1.9rem, 6vw, 3rem);
  font-weight: 800;
  margin-bottom: 18px;
}
.hero__title--highlight {
  color: var(--roxo);
  position: relative;
}
.hero__subtitle {
  color: var(--texto-suave);
  font-size: 1.05rem;
  max-width: 560px;
  margin: 0 auto 28px;
}
.hero__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.hero__modules {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 14px;
  margin-bottom: 28px;
}
.hero__module {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 76px;
}
.hero__module-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--fundo-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: var(--sombra);
  color: var(--roxo);
}
.hero__module-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--texto-suave);
  text-align: center;
  line-height: 1.2;
}
.btn--hero-cta {
  background: var(--amarelo);
  color: var(--roxo-escuro);
  box-shadow: 0 8px 20px rgba(255, 201, 60, 0.35);
}
.btn--hero-cta:hover {
  background: var(--amarelo-escuro);
  transform: translateY(-2px);
}
.hero__mockup {
  width: 100%;
  display: flex;
  justify-content: center;
}
.hero__image {
  display: block;
  width: 100%;
  max-width: 300px;
  height: auto;
  margin: 0 auto;
  border-radius: var(--raio);
  box-shadow: var(--sombra);
}
.problema {
  background: var(--branco);
}
.problem-card {
  background: var(--branco);
  border: 1px solid var(--borda);
  box-shadow: var(--sombra);
  border-radius: var(--raio);
  padding: 28px 22px;
  text-align: left;
}
.problem-card__icon {
  font-size: 1.8rem;
  margin-bottom: 12px;
}
.problem-card h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.problem-card p {
  color: var(--texto-suave);
  font-size: 0.96rem;
}
.solucao {
  background: var(--roxo-escuro);
  color: var(--branco);
}
.solucao .section__title {
  color: var(--branco);
}
.solucao .section__text {
  color: var(--texto-claro);
}
.solucao__cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 40px;
}
.feature-card {
  background: var(--branco);
  border-radius: var(--raio);
  box-shadow: var(--sombra);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 45px rgba(124, 58, 237, 0.22);
}
.feature-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  height: auto;
}
.feature-card__body {
  padding: 24px;
}
.feature-card__body h3 {
  color: var(--roxo-escuro);
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.feature-card__body p {
  color: var(--texto-suave);
  font-size: 0.95rem;
}
.solucao__cta-wrap {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
.categorias {
  background: var(--branco);
}
.cat-box {
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.cat-box__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.cat-tab {
  font-family: var(--fonte-texto);
  font-weight: 600;
  font-size: 0.9rem;
  background: var(--branco);
  color: var(--roxo);
  border: 2px solid var(--borda);
  border-radius: 10px;
  padding: 10px 16px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}
.cat-tab:hover {
  border-color: var(--roxo);
}
.cat-tab.is-active {
  background: var(--roxo);
  color: var(--branco);
  border-color: var(--roxo);
}
.cat-tab:focus-visible {
  outline: 3px solid var(--roxo-escuro);
  outline-offset: 2px;
}
.cat-box__panel {
  background: var(--branco);
  border: 1px solid var(--borda);
  box-shadow: var(--sombra);
  border-radius: var(--raio);
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  text-align: center;
}
.cat-panel__visual {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: var(--fundo-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
  box-shadow: var(--sombra);
  flex-shrink: 0;
}
.cat-panel__text h3 {
  font-size: 1.3rem;
  margin-bottom: 8px;
}
.cat-panel__text p {
  color: var(--texto-suave);
}
.amostras {
  background: var(--fundo-alt);
}
.carousel {
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 40px auto 0;
}
.carousel__viewport {
  width: 100%;
  overflow: hidden;
  border-radius: var(--raio);
}
.carousel__track {
  display: flex;
  transition: transform 0.45s ease;
}
.carousel__slide {
  flex: 0 0 100%;
  width: 100%;
  background: var(--branco);
}
.carousel__image {
  display: block;
  width: 100%;
  aspect-ratio: 1536 / 864;
  height: auto;
  object-fit: contain;
  background: var(--branco);
}
.carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--branco);
  color: var(--roxo);
  font-size: 1.6rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--sombra);
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
  z-index: 2;
}
.carousel__arrow:hover {
  background: var(--roxo);
  color: var(--branco);
}
.carousel__arrow:focus-visible {
  outline: 3px solid var(--roxo-escuro);
  outline-offset: 2px;
}
.carousel__arrow--prev {
  left: -6px;
}
.carousel__arrow--next {
  right: -6px;
}
.carousel__dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}
.carousel__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background: var(--borda);
  cursor: pointer;
  padding: 0;
  transition: background 0.15s ease, transform 0.15s ease;
}
.carousel__dot:hover {
  background: var(--roxo-claro);
}
.carousel__dot.is-active {
  background: var(--roxo);
  transform: scale(1.2);
}
.para-quem {
  background: var(--branco);
}
.para-quem__cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  margin-top: 32px;
}
.persona-card {
  background: var(--branco);
  border: 1px solid var(--borda);
  box-shadow: var(--sombra);
  border-radius: var(--raio);
  padding: 28px 22px;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.persona-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 36px rgba(124, 58, 237, 0.16);
}
.persona-card__icon {
  font-size: 1.8rem;
  margin-bottom: 12px;
}
.persona-card h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
}
.persona-card p {
  color: var(--texto-suave);
  font-size: 0.96rem;
}
.depoimentos {
  background: var(--fundo-alt);
}
.carousel--depoimentos {
  max-width: 400px;
}
.carousel--depoimentos .carousel__image {
  aspect-ratio: 9 / 16;
}
.oferta {
  background: var(--roxo-escuro);
  text-align: center;
}
.oferta__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.oferta .tab-label {
  margin-left: auto;
  margin-right: auto;
}
.price-card {
  margin-top: 24px;
  background: var(--branco);
  border-radius: var(--raio);
  padding: 32px 24px;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 20px 40px rgba(0,0,0,0.25);
}
.price-card__breakdown-title {
  font-family: var(--fonte-titulo);
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--roxo-escuro);
  margin-bottom: 12px;
}
.price-card__breakdown {
  width: 100%;
  margin-bottom: 8px;
}
.price-card__breakdown li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  font-size: 0.92rem;
  color: var(--texto-suave);
  border-bottom: 1px dashed var(--borda);
}
.price-card__old {
  color: var(--texto-suave);
  font-size: 0.9rem;
  margin: 10px 0 18px;
}
.price-card__badge {
  display: inline-block;
  background: var(--fundo-alt);
  color: var(--roxo);
  font-family: var(--fonte-titulo);
  font-weight: 700;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 10px;
}
.price-card__special-text {
  color: var(--texto-suave);
  font-size: 0.92rem;
  margin-bottom: 8px;
}
.price-card__new {
  font-family: var(--fonte-titulo);
  font-weight: 800;
  font-size: 2.6rem;
  color: var(--roxo-escuro);
  margin: 4px 0;
}
.price-card__new small {
  font-family: var(--fonte-texto);
  font-weight: 600;
  font-size: 1rem;
  color: var(--texto-suave);
}
.price-card__installments {
  color: var(--texto-suave);
  font-size: 0.9rem;
  margin-bottom: 20px;
}
.price-card__checklist {
  width: 100%;
  max-width: 260px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.price-card__checklist li {
  position: relative;
  padding-left: 22px;
  font-size: 0.85rem;
  color: var(--texto-suave);
  text-align: left;
}
.price-card__checklist li::before {
  content: "✓";
  position: absolute;
  left: 0;
  top: 0;
  color: var(--roxo);
  font-weight: 800;
}
.oferta__how {
  width: 100%;
  max-width: 420px;
  margin: 40px auto 0;
}
.oferta__how-title {
  color: var(--branco);
  font-size: 1.05rem;
  margin-bottom: 14px;
  text-align: center;
}
.oferta__how-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-left: 20px;
  color: var(--texto-claro);
  font-size: 0.88rem;
  text-align: left;
}
.faq {
  background: var(--branco);
}
.faq-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
}
.faq-item {
  border: 1px solid var(--borda);
  border-radius: 12px;
  overflow: hidden;
}
.faq-item__question {
  width: 100%;
  background: var(--fundo-alt);
  border: none;
  text-align: left;
  font-family: var(--fonte-texto);
  font-weight: 600;
  font-size: 0.98rem;
  color: var(--roxo-escuro);
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
}
.faq-item__question:focus-visible {
  outline: 3px solid var(--roxo);
  outline-offset: -3px;
}
.faq-item__arrow {
  transition: transform 0.2s ease;
  flex-shrink: 0;
  color: var(--roxo);
}
.faq-item.is-open .faq-item__arrow {
  transform: rotate(180deg);
}
.faq-item__answer {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s ease;
}
.faq-item__answer p {
  padding: 16px 18px;
  color: var(--texto-suave);
}
.duvidas {
  background: var(--fundo-alt);
  text-align: center;
}
.duvidas .btn--whatsapp {
  margin-top: 8px;
}
.footer {
  background: var(--roxo-escuro);
  color: rgba(255, 255, 255, 0.78);
  text-align: center;
  padding: 28px 0;
}
.footer p {
  font-size: 0.9rem;
}
.footer__legal {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
}
.reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}
@media (min-width: 700px) {
  .grid--3 { grid-template-columns: repeat(3, 1fr); }
  .grid--4 { grid-template-columns: repeat(4, 1fr); }
  .hero__actions { flex-direction: row; }
  .hero__image { max-width: 380px; }
  .solucao__cards { grid-template-columns: repeat(2, 1fr); gap: 28px; }
  .para-quem__cards { grid-template-columns: repeat(2, 1fr); }
  .cat-box__panel { flex-direction: row; text-align: left; }
  .cat-panel__visual { margin: 0; }
}
@media (max-width: 768px) {
  .problema .grid--4 {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}
@media (min-width: 769px) and (max-width: 959px) {
  .problema .grid--4 {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 960px) {
  .section { padding: 96px 0; }
  .hero { padding: 90px 0 70px; }
  .hero__inner { flex-direction: row; text-align: left; }
  .hero__content { text-align: left; flex: 1; }
  .hero__subtitle { margin: 0 0 28px; }
  .hero__modules { justify-content: flex-start; }
  .hero__actions { justify-content: flex-start; }
  .hero__mockup { flex: 1; }
  .hero__image { max-width: 480px; }
  .oferta__inner { text-align: center; }
}`;
const CSS_EXTRA = `.hero__subtitle{white-space:pre-line}
.carousel__legenda{margin:0;padding:12px 16px;text-align:center;font-size:.95rem;color:var(--texto-suave);background:var(--branco);border-top:1px solid var(--borda)}
.carousel--mapas .carousel__image{aspect-ratio:auto;height:auto}
.carousel--mapas .carousel__slide{display:flex;flex-direction:column;justify-content:center}
.pacote{background:var(--fundo-alt);text-align:center}
.pacote .section__text{max-width:720px;margin:0 auto}
.oferta__grid{display:grid;grid-template-columns:1fr;gap:20px;margin-top:24px;justify-items:center;width:100%}
@media (min-width:820px){.oferta__grid{grid-template-columns:repeat(2,minmax(0,1fr));align-items:stretch}.oferta__grid--uma{grid-template-columns:minmax(0,440px);justify-content:center}}
.oferta__grid .price-card{max-width:440px;margin-top:0;height:100%}
.price-card__nome{font-family:var(--fonte-titulo);font-size:1.3rem;font-weight:800;color:var(--roxo-escuro);margin:0 0 8px;text-align:center}
.price-card__chip{background:var(--fundo-alt);color:var(--roxo-escuro);border-radius:999px;padding:4px 12px;font-size:.85rem;font-weight:700;margin-bottom:10px}
.price-card__desc{color:var(--texto-suave);font-size:.95rem;margin-bottom:12px;text-align:center}
.price-card__desc p{margin:0 0 .6em}
.price-card__checklist{align-self:stretch}
.price-card .btn{margin-top:auto}
.btn.is-disabled{opacity:.5;pointer-events:none}
.oferta__garantias{list-style:none;padding:0;margin:24px 0 0;display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:center;color:var(--texto-claro);font-size:.95rem}
.section__text p{margin:0 0 .8em}
.problem-card p{margin:0}
.faq-item__answer p{margin:0}
img{max-width:100%}`;
const JS_PAGINA = `/* Carrosséis (setas, bolinhas e deslizar no celular) e FAQ em acordeão — mesma lógica do site atual */
document.querySelectorAll('.carousel').forEach(function (car) {
  var trilho = car.querySelector('.carousel__track'), n = trilho.children.length, dots = car.querySelector('.carousel__dots'), i = 0, x0 = 0;
  var bol = []; for (var k = 0; k < n; k++) { (function (k) { var b = document.createElement('button'); b.type = 'button'; b.className = 'carousel__dot'; b.setAttribute('aria-label', 'Ir para ' + (k + 1)); b.addEventListener('click', function () { ir(k); }); dots.appendChild(b); bol.push(b); })(k); }
  function ir(j) { if (j < 0) j = n - 1; else if (j >= n) j = 0; i = j; trilho.style.transform = 'translateX(-' + (i * 100) + '%)'; bol.forEach(function (b, m) { b.classList.toggle('is-active', m === i); }); }
  car.querySelector('.carousel__arrow--prev').addEventListener('click', function () { ir(i - 1); }); car.querySelector('.carousel__arrow--next').addEventListener('click', function () { ir(i + 1); });
  trilho.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  trilho.addEventListener('touchend', function (e) { var d = x0 - e.changedTouches[0].clientX; if (Math.abs(d) > 40) ir(d > 0 ? i + 1 : i - 1); });
  if (n < 2) { car.querySelectorAll('.carousel__arrow').forEach(function (a) { a.style.display = 'none'; }); dots.style.display = 'none'; }
  ir(0);
});
document.querySelectorAll('.faq-item__question').forEach(function (q) {
  q.addEventListener('click', function () { var it = q.closest('.faq-item'), r = it.querySelector('.faq-item__answer'); if (it.classList.contains('is-open')) { it.classList.remove('is-open'); r.style.maxHeight = null; } else { it.classList.add('is-open'); r.style.maxHeight = r.scrollHeight + 'px'; } });
});`;

// ---------------------------------------------------------------------------------------------
// Renderizador da PÁGINA DE VENDA. Recebe { slug, dados } e devolve o HTML pronto (usado na página pública /venda/slug
// e na prévia do painel). Ordem das seções (fixa): 1 Apresentação do simulado · 2 Problemas e benefícios · 3 Amostras do simulado ·
// 4 Pacote completo · 5 Amostras dos mapas · 6 Depoimentos · 7 Escolha entre as duas ofertas · 8 FAQ · 9 Contato e rodapé.
// Seções sem conteúdo são omitidas. Todo texto é escapado; links e imagens só passam se forem URLs válidas.
// ---------------------------------------------------------------------------------------------
const regras = require('../gerenciar-paginas-venda/regras.js');
const BASE_SITE = 'https://devmapas.vercel.app';
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const par = (t) => (t ? esc(t).split(/\n\s*\n/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('') : '');
const absoluta = (u) => (u && u.charAt(0) === '/' ? BASE_SITE + u : u);
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (h, alvo, f) => { const a = rgb(h), b = rgb(alvo); return '#' + a.map((x, i) => Math.round(x + (b[i] - x) * f).toString(16).padStart(2, '0')).join(''); };

function img(i, cls, alt, eager) { return i && i.url ? '<img src="' + esc(i.url) + '" alt="' + esc(alt || '') + '" class="' + cls + '"' + (eager ? '' : ' loading="lazy"') + '>' : ''; }

function carrossel(id, itens, classe, nome) {
  if (!itens.length) return '';
  const slides = itens.map((it, k) => '<div class="carousel__slide">' + img(it.imagem, 'carousel__image', it.legenda || (nome + ' ' + (k + 1))) + (it.legenda ? '<p class="carousel__legenda">' + esc(it.legenda) + '</p>' : '') + '</div>').join('');
  return '<div class="carousel ' + classe + '" id="' + id + '"><div class="carousel__viewport"><div class="carousel__track">' + slides + '</div></div>'
    + '<button type="button" class="carousel__arrow carousel__arrow--prev" aria-label="Ver anterior">‹</button><button type="button" class="carousel__arrow carousel__arrow--next" aria-label="Ver próximo">›</button><div class="carousel__dots"></div></div>';
}

function ofertaCard(o, tipo) {
  if (!(o.nome || o.preco || o.descricao || o.itens.length)) return '';
  const checkout = o.link ? ' href="' + esc(o.link) + '" target="_blank" rel="noopener"' : ' aria-disabled="true"';
  return '<div class="price-card price-card--' + tipo + '">'
    + (o.nome ? '<h3 class="price-card__nome">' + esc(o.nome) + '</h3>' : '')
    + (tipo === 'simulado' && o.questoes ? '<span class="price-card__chip">' + esc(o.questoes) + ' questões</span>' : '')
    + (o.descricao ? '<div class="price-card__desc">' + par(o.descricao) + '</div>' : '')
    + (o.itens.length ? '<ul class="price-card__checklist">' + o.itens.map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>' : '')
    + (o.preco ? '<div class="price-card__new">' + esc(o.preco) + '</div>' : '')
    + '<a' + checkout + ' class="btn btn--primary btn--large btn--full' + (o.link ? '' : ' is-disabled') + '">' + esc(o.botao || (tipo === 'simulado' ? 'QUERO O SIMULADO' : 'QUERO O PACOTE COMPLETO')) + '</a></div>';
}

function renderizarVenda({ slug, dados }) {
  const d = regras.normalizar(dados), c = d.aparencia.cores, ap = d.apresentacao, of = d.ofertas, fin = d.finalizacao;
  const titulo = d.aparencia.titulo || d.identificacao.concurso, rotulo = d.identificacao.concurso + (d.identificacao.cargo ? ' — ' + d.identificacao.cargo : '');
  const primeiraOferta = of.simulado.link ? of.simulado : of.pacote;
  const wa = fin.whatsapp.numero ? 'https://wa.me/' + fin.whatsapp.numero + (fin.whatsapp.mensagem ? '?text=' + encodeURIComponent(fin.whatsapp.mensagem) : '') : '';
  const vars = ':root{--roxo:' + c.principal + ';--roxo-escuro:' + c.escura + ';--roxo-claro:' + mix(c.principal, '#FFFFFF', 0.35) + ';--fundo-alt:' + c.fundo + ';--amarelo:' + c.destaque + ';--amarelo-escuro:' + mix(c.destaque, '#000000', 0.15) + ';--borda:' + mix(c.principal, '#FFFFFF', 0.85) + '}';
  const S = [];

  // 1. Apresentação do simulado
  S.push('<section class="hero"><div class="container hero__inner"><div class="hero__content"><span class="tab-label">' + esc(rotulo) + '</span><h1 class="hero__title">' + esc(titulo) + '</h1>'
    + (d.aparencia.subtitulo ? '<p class="hero__subtitle">' + esc(d.aparencia.subtitulo) + '</p>' : '') + '<div class="hero__actions"><a href="#oferta" class="btn btn--primary btn--large">' + esc((of.simulado.botao || 'VER AS OPÇÕES').toUpperCase()) + '</a></div></div>'
    + (d.aparencia.capa.url ? '<div class="hero__mockup">' + img(d.aparencia.capa, 'hero__image', titulo, true) + '</div>' : '') + '</div></section>');

  // 2. Problemas e benefícios
  if (ap.problemas.itens.length || ap.problemas.titulo) S.push('<section class="section problema"><div class="container">' + (ap.problemas.titulo ? '<h2 class="section__title">' + esc(ap.problemas.titulo) + '</h2>' : '')
    + '<div class="grid grid--4">' + ap.problemas.itens.map((i) => '<div class="problem-card">' + (i.icone ? '<div class="problem-card__icon">' + esc(i.icone) + '</div>' : '') + (i.titulo ? '<h3>' + esc(i.titulo) + '</h3>' : '') + par(i.texto) + '</div>').join('') + '</div></div></section>');
  if (ap.beneficios.itens.length || ap.beneficios.titulo || ap.beneficios.texto) S.push('<section class="section solucao"><div class="container">' + (ap.beneficios.titulo ? '<h2 class="section__title">' + esc(ap.beneficios.titulo) + '</h2>' : '') + (ap.beneficios.texto ? '<div class="section__text">' + par(ap.beneficios.texto) + '</div>' : '')
    + '<div class="solucao__cards">' + ap.beneficios.itens.map((i) => '<div class="feature-card">' + img(i.imagem, 'feature-card__image', i.titulo) + '<div class="feature-card__body">' + (i.titulo ? '<h3>' + esc(i.titulo) + '</h3>' : '') + par(i.texto) + '</div></div>').join('') + '</div>'
    + '<div style="text-align:center;margin-top:32px"><a href="#oferta" class="btn btn--primary btn--large solucao__cta-btn">' + esc((of.simulado.botao || 'VER AS OPÇÕES').toUpperCase()) + '</a></div></div></section>');

  // 3. Amostras do simulado
  if (d.amostras.itens.length) S.push('<section class="section amostras"><div class="container">' + (d.amostras.titulo ? '<h2 class="section__title">' + esc(d.amostras.titulo) + '</h2>' : '') + carrossel('amostrasCarousel', d.amostras.itens, '', 'Amostra') + '</div></section>');

  // 4. Pacote completo
  if (d.pacote.titulo || d.pacote.texto) S.push('<section class="section pacote"><div class="container">' + (d.pacote.titulo ? '<h2 class="section__title">' + esc(d.pacote.titulo) + '</h2>' : '') + (d.pacote.texto ? '<div class="section__text">' + par(d.pacote.texto) + '</div>' : '')
    + '<div style="text-align:center;margin-top:24px"><a href="#oferta" class="btn btn--primary btn--large">' + esc((of.pacote.botao || 'VER O PACOTE COMPLETO').toUpperCase()) + '</a></div></div></section>');

  // 5. Amostras dos mapas   6. Depoimentos
  if (d.mapas.itens.length) S.push('<section class="section mapas"><div class="container">' + (d.mapas.titulo ? '<h2 class="section__title">' + esc(d.mapas.titulo) + '</h2>' : '') + carrossel('mapasCarousel', d.mapas.itens, 'carousel--mapas', 'Mapa') + '</div></section>');
  if (d.depoimentos.itens.length) S.push('<section class="section depoimentos"><div class="container">' + (d.depoimentos.titulo ? '<h2 class="section__title">' + esc(d.depoimentos.titulo) + '</h2>' : '') + carrossel('depoimentosCarousel', d.depoimentos.itens, 'carousel--depoimentos', 'Depoimento') + '</div></section>');

  // 7. Escolha entre as duas ofertas (independentes, cada uma com o seu checkout)
  const cards = [ofertaCard(of.simulado, 'simulado'), ofertaCard(of.pacote, 'pacote')].filter(Boolean);
  if (cards.length) S.push('<section class="section oferta" id="oferta"><div class="container oferta__inner"><h2 class="section__title section__title--light">' + esc(of.titulo || 'Escolha sua opção') + '</h2><div class="oferta__grid' + (cards.length === 1 ? ' oferta__grid--uma' : '') + '">' + cards.join('') + '</div>'
    + (fin.garantias.length ? '<ul class="oferta__garantias">' + fin.garantias.map((g) => '<li>✓ ' + esc(g) + '</li>').join('') + '</ul>' : '') + '</div></section>');

  // 8. FAQ
  if (fin.faq.length) S.push('<section class="section faq"><div class="container container--narrow"><h2 class="section__title">' + esc(fin.faqTitulo || 'Dúvidas frequentes') + '</h2><div class="faq-list">' + fin.faq.map((f) => '<div class="faq-item"><button type="button" class="faq-item__question">' + esc(f.pergunta) + '<span class="faq-item__arrow" aria-hidden="true">▾</span></button><div class="faq-item__answer">' + par(f.resposta) + '</div></div>').join('') + '</div></div></section>');

  // 9. Contato e rodapé
  if (wa || fin.contato.titulo || fin.contato.texto) S.push('<section class="section duvidas"><div class="container">' + (fin.contato.titulo ? '<h2 class="section__title">' + esc(fin.contato.titulo) + '</h2>' : '') + (fin.contato.texto ? '<div class="section__text">' + par(fin.contato.texto) + '</div>' : '')
    + (wa ? '<a href="' + esc(wa) + '" target="_blank" rel="noopener" class="btn btn--whatsapp btn--large">Falar no WhatsApp</a>' : '') + '</div></section>');
  const rodape = '<footer class="footer"><div class="container"><p>' + esc(fin.rodape || ('© ' + new Date().getFullYear() + ' — Todos os direitos reservados.')) + '</p></div></footer>';

  const desc = d.aparencia.subtitulo || titulo, og = absoluta(d.aparencia.capa.url);
  return '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(titulo) + '</title>'
    + '<meta name="description" content="' + esc(desc) + '"><meta property="og:title" content="' + esc(titulo) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:type" content="website">'
    + (og ? '<meta property="og:image" content="' + esc(og) + '"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="' + esc(og) + '">' : '')
    + '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>' + CSS_BASE + CSS_EXTRA + vars + '</style></head><body>'
    + '<header class="header"><div class="container header__inner"><a href="#topo" class="logo"><span class="logo__icon" aria-hidden="true">▤</span>DevMapas</a>'
    + (wa ? '<a href="' + esc(wa) + '" target="_blank" rel="noopener" aria-label="Falar no WhatsApp" style="color:#25D366;display:inline-flex;font-size:1.5rem;text-decoration:none">💬</a>' : '') + '</div></header>'
    + '<main id="topo">' + S.join('') + '</main>' + rodape + '<script>' + JS_PAGINA + '</script></body></html>';
}
module.exports = { renderizarVenda };
