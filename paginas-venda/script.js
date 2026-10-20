/* PMPE — interações da página de vendas, sem bibliotecas. */
document.addEventListener('DOMContentLoaded', function () {
  // FAQ acessível: abre/fecha e atualiza aria-expanded.
  document.querySelectorAll('.faq-item__question').forEach(function (button) {
    button.addEventListener('click', function () {
      var item = button.closest('.faq-item');
      var answer = item.querySelector('.faq-item__answer');
      var open = item.classList.contains('is-open');

      item.classList.toggle('is-open', !open);
      button.setAttribute('aria-expanded', String(!open));
      answer.style.maxHeight = open ? null : answer.scrollHeight + 'px';
    });
  });

  // Inicializa carrosséis independentes com setas, indicadores e gesto de arrastar.
  function setupCarousel(config) {
    var root = document.getElementById(config.root);
    if (!root) return;
    var track = document.getElementById(config.track);
    var prev = document.getElementById(config.prev);
    var next = document.getElementById(config.next);
    var dotsWrap = document.getElementById(config.dots);
    if (!track || !dotsWrap) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.carousel__slide'));
    if (!slides.length) return;
    var index = 0;
    var startX = null;
    var dots = slides.map(function (_, i) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel__dot';
      dot.setAttribute('aria-label', 'Ir para o item ' + (i + 1));
      dot.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function go(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    if (prev) prev.addEventListener('click', function () { go(index - 1); });
    if (next) next.addEventListener('click', function () { go(index + 1); });
    track.addEventListener('touchstart', function (event) {
      startX = event.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var delta = startX - event.changedTouches[0].clientX;
      if (Math.abs(delta) > 40) go(index + (delta > 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    go(0);
  }

  setupCarousel({
    root: 'mapasCarousel',
    track: 'mapasTrack',
    prev: 'mapasPrev',
    next: 'mapasNext',
    dots: 'mapasDots'
  });
  setupCarousel({
    root: 'depoimentosCarousel',
    track: 'depoimentosTrack',
    prev: 'depoimentosPrev',
    next: 'depoimentosNext',
    dots: 'depoimentosDots'
  });

  // Se imagens de depoimentos/amostras não existirem no caminho relativo, oculta o espaço vazio.
  document.querySelectorAll('.carousel__image').forEach(function (img) {
    img.addEventListener('error', function () {
      var slide = img.closest('.carousel__slide');
      if (slide) {
        slide.classList.add('image-unavailable');
        img.alt = 'Imagem de amostra ainda não localizada';
        img.style.display = 'none';
        slide.style.minHeight = '120px';
        slide.style.background = '#F8F5FF';
      }
    });
  });
});
