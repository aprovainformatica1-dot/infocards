/* =====================================================
   INFOCARDS DE INFORMÁTICA — JAVASCRIPT
   Tudo em JS puro, sem bibliotecas.
   Organizado em 4 partes:
   1. Categorias interativas (clique -> muda imagem/ícone e texto)
   2. FAQ em formato de acordeão (clique -> abre/fecha)
   3. Carrossel de amostras (setas, bolinhas e swipe no celular)
   4. Efeito simples de "revelar" seções ao rolar a página
   ===================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* =====================================================
     1. CATEGORIAS INTERATIVAS
     Para adicionar/editar uma categoria, basta mexer neste array.
     - nome: texto que aparece no botão
     - icone: emoji (ou troque por um <img> se preferir uma imagem real)
     - descricao: texto exibido ao lado quando a categoria é clicada
     ===================================================== */
  var categorias = [
    {
      nome: 'Hardware',
      icone: '🖥️',
      descricao: 'Componentes do computador, periféricos e conceitos essenciais de arquitetura — resumidos em um único mapa visual.'
    },
    {
      nome: 'Windows',
      icone: '🪟',
      descricao: 'Principais atalhos, configurações e funcionalidades do sistema operacional mais cobrado em provas.'
    },
    {
      nome: 'Linux',
      icone: '🐧',
      descricao: 'Comandos essenciais, estrutura de diretórios e conceitos que mais aparecem em concursos.'
    },
    {
      nome: 'Word 365',
      icone: '📝',
      descricao: 'Formatação, ferramentas e recursos do Word organizados de forma visual e direta ao ponto.'
    },
    {
      nome: 'Excel',
      icone: '📊',
      descricao: 'Fórmulas, funções e atalhos do Excel que mais caem em prova, sem enrolação.'
    },
    {
      nome: 'Internet',
      icone: '🌐',
      descricao: 'Protocolos, navegadores e conceitos de redes explicados em um mapa fácil de revisar.'
    },
    {
      nome: 'Segurança da Informação',
      icone: '🛡️',
      descricao: 'Vírus, malwares, criptografia e boas práticas de segurança resumidos visualmente.'
    },
    {
      nome: 'Inteligência Artificial',
      icone: '🤖',
      descricao: 'Conceitos atuais de IA que vêm aparecendo com força nos editais mais recentes.'
    }
  ];

  var tabsContainer = document.getElementById('catTabs');
  var catIcon = document.getElementById('catIcon');
  var catTitle = document.getElementById('catTitle');
  var catDescription = document.getElementById('catDescription');

  // Cria os botões de categoria dinamicamente a partir do array acima
  function criarTabs() {
    categorias.forEach(function (categoria, indice) {
      var botao = document.createElement('button');
      botao.className = 'cat-tab';
      botao.type = 'button';
      botao.textContent = categoria.nome;
      botao.setAttribute('data-indice', indice);

      if (indice === 0) {
        botao.classList.add('is-active');
      }

      botao.addEventListener('click', function () {
        selecionarCategoria(indice);
      });

      tabsContainer.appendChild(botao);
    });
  }

  // Atualiza o painel (ícone + título + descrição) e marca o botão ativo
  function selecionarCategoria(indice) {
    var categoria = categorias[indice];

    // Atualiza o texto e o ícone do painel
    catIcon.textContent = categoria.icone;
    catTitle.textContent = categoria.nome;
    catDescription.textContent = categoria.descricao;

    // Marca visualmente qual botão está selecionado
    var todosOsBotoes = tabsContainer.querySelectorAll('.cat-tab');
    todosOsBotoes.forEach(function (botao) {
      botao.classList.remove('is-active');
    });
    var botaoSelecionado = tabsContainer.querySelector('[data-indice="' + indice + '"]');
    if (botaoSelecionado) {
      botaoSelecionado.classList.add('is-active');
    }
  }

  criarTabs();
  selecionarCategoria(0); // mostra a primeira categoria (Hardware) por padrão


  /* =====================================================
     2. FAQ — ACORDEÃO
     Ao clicar na pergunta, a resposta abre. Clicando de novo, fecha.
     ===================================================== */
  var perguntas = document.querySelectorAll('.faq-item__question');

  perguntas.forEach(function (pergunta) {
    pergunta.addEventListener('click', function () {
      var itemFaq = pergunta.closest('.faq-item');
      var resposta = itemFaq.querySelector('.faq-item__answer');
      var estaAberto = itemFaq.classList.contains('is-open');

      if (estaAberto) {
        // Fecha o item clicado
        itemFaq.classList.remove('is-open');
        resposta.style.maxHeight = null;
      } else {
        // Abre o item clicado
        itemFaq.classList.add('is-open');
        resposta.style.maxHeight = resposta.scrollHeight + 'px';
      }
    });
  });


  /* =====================================================
     3. CARROSSEL DE AMOSTRAS
     Funciona com qualquer quantidade de imagens: o script conta
     quantos ".carousel__slide" existem dentro do HTML e monta a
     navegação (bolinhas) automaticamente. Para adicionar ou remover
     uma amostra, basta editar os slides no index.html — não precisa
     mexer neste bloco.
     ===================================================== */
  var carrossel = document.getElementById('amostrasCarousel');

  if (carrossel) {
    var trilho = document.getElementById('carouselTrack');
    var slides = trilho.querySelectorAll('.carousel__slide');
    var totalSlides = slides.length;
    var botaoAnterior = document.getElementById('carouselPrev');
    var botaoProximo = document.getElementById('carouselNext');
    var containerBolinhas = document.getElementById('carouselDots');
    var indiceAtual = 0;

    // Cria uma bolinha de indicador para cada slide
    for (var i = 0; i < totalSlides; i++) {
      var bolinha = document.createElement('button');
      bolinha.type = 'button';
      bolinha.className = 'carousel__dot';
      bolinha.setAttribute('aria-label', 'Ir para a amostra ' + (i + 1));
      bolinha.setAttribute('data-indice', i);

      if (i === 0) {
        bolinha.classList.add('is-active');
      }

      bolinha.addEventListener('click', function (evento) {
        var indice = Number(evento.currentTarget.getAttribute('data-indice'));
        irParaSlide(indice);
      });

      containerBolinhas.appendChild(bolinha);
    }

    var bolinhas = containerBolinhas.querySelectorAll('.carousel__dot');

    // Move o trilho até o slide desejado e atualiza a bolinha ativa
    function irParaSlide(indice) {
      // Faz o carrossel "dar a volta": depois da última imagem, volta pra primeira
      if (indice < 0) {
        indice = totalSlides - 1;
      } else if (indice >= totalSlides) {
        indice = 0;
      }

      indiceAtual = indice;
      trilho.style.transform = 'translateX(-' + (indiceAtual * 100) + '%)';

      bolinhas.forEach(function (bolinha, bolinhaIndice) {
        bolinha.classList.toggle('is-active', bolinhaIndice === indiceAtual);
      });
    }

    // Setas de navegação
    botaoAnterior.addEventListener('click', function () {
      irParaSlide(indiceAtual - 1);
    });

    botaoProximo.addEventListener('click', function () {
      irParaSlide(indiceAtual + 1);
    });

    // Deslizar com o dedo (swipe) no celular
    var posicaoInicialX = 0;
    var posicaoFinalX = 0;
    var distanciaMinimaSwipe = 40; // pixels — abaixo disso, não conta como swipe

    trilho.addEventListener('touchstart', function (evento) {
      posicaoInicialX = evento.touches[0].clientX;
    }, { passive: true });

    trilho.addEventListener('touchend', function (evento) {
      posicaoFinalX = evento.changedTouches[0].clientX;
      var distancia = posicaoInicialX - posicaoFinalX;

      if (Math.abs(distancia) > distanciaMinimaSwipe) {
        if (distancia > 0) {
          irParaSlide(indiceAtual + 1); // deslizou para a esquerda -> próxima
        } else {
          irParaSlide(indiceAtual - 1); // deslizou para a direita -> anterior
        }
      }
    });

    irParaSlide(0); // garante que tudo comece na primeira imagem
  }


  /* =====================================================
     4. EFEITO DE REVELAR AO ROLAR A PÁGINA
     Adiciona a classe "reveal" em elementos e, quando eles entram
     na tela, soma "is-visible" para o CSS animar a entrada.
     ===================================================== */
  var elementosParaRevelar = document.querySelectorAll(
    '.problem-card, .benefit-card, .testimonial-placeholder, .faq-item, .solucao__cta-btn'
  );

  elementosParaRevelar.forEach(function (elemento) {
    elemento.classList.add('reveal');
  });

  // IntersectionObserver é suportado por todos os navegadores modernos
  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('is-visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15 });

    elementosParaRevelar.forEach(function (elemento) {
      observador.observe(elemento);
    });
  } else {
    // Navegador muito antigo: apenas mostra tudo sem animação
    elementosParaRevelar.forEach(function (elemento) {
      elemento.classList.add('is-visible');
    });
  }

});
