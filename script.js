/* =====================================================
   INFOCARDS DE INFORMÁTICA — JAVASCRIPT
   Tudo em JS puro, sem bibliotecas.
   Organizado em 3 partes:
   1. Categorias interativas (clique -> muda imagem/ícone e texto)
   2. FAQ em formato de acordeão (clique -> abre/fecha)
   3. Efeito simples de "revelar" seções ao rolar a página
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
     3. EFEITO DE REVELAR AO ROLAR A PÁGINA
     Adiciona a classe "reveal" em elementos e, quando eles entram
     na tela, soma "is-visible" para o CSS animar a entrada.
     ===================================================== */
  var elementosParaRevelar = document.querySelectorAll(
    '.problem-card, .benefit-card, .sample-card, .testimonial-placeholder, .faq-item'
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
