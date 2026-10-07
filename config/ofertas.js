/* =========================================
   CONFIGURAÇÃO COMPARTILHADA DAS OFERTAS — FONTE ÚNICA
   Usada por /gerador-desafios/ (cards finais do "Desafio geral") e por /ofertas/ (Central de Ofertas).
   Edite os textos, imagens e links das ofertas AQUI, uma única vez.
   (Os desafios já gerados não dependem deste arquivo: ele só é lido na hora de gerar um desafio novo.)

   Campos de cada oferta:
     id · nome · icone (usados na Central de Ofertas) · cta (nome do botão rastreado) · classe (visual do card)
     kick (rótulo) · titulo · textos (parágrafos) · importante (caixa, opcional) · botao (texto do botão)
     imagem + capaEmoji (capa, opcional) · iconeWhatsapp (opcional) · link
   Os textos entram no card como HTML: evite os caracteres < e &.
   A ordem das ofertas gerais abaixo é a ordem FIXA dos cards no desafio.
   ========================================= */

const BASE_IMG = "https://devmapas.vercel.app/img/";

// Ofertas gerais — são os 4 cards finais do "Desafio geral"
const OFERTAS = {
  simulado: {
    id: 'simulado',
    nome: 'Simulado',
    icone: '📄',
    cta: 'simulado',
    classe: 'go a',
    kick: '📄 SIMULADO DE INFORMÁTICA',
    titulo: 'EM CONCURSO, NÃO BASTA ESTUDAR. É PRECISO PRATICAR!',
    textos: [
      'É resolvendo questões que você descobre quais assuntos ainda precisam de atenção.',
      'Pratique com 100 questões de Informática comentadas e reforce seus conhecimentos antes da prova.'
    ],
    botao: '📄 QUERO AS 100 QUESTÕES',
    imagem: BASE_IMG + 'capa-simulado.png',
    capaEmoji: '📄',
    link: 'https://pay.kiwify.com.br/gpyqBa2'
  },

  mapas: {
    id: 'mapas',
    nome: 'Mapas',
    icone: '🗺️',
    cta: 'mapas',
    classe: 'go b',
    kick: '🗺️ MAPAS DE INFORMÁTICA',
    titulo: 'E QUANDO VOCÊ PRECISAR REVISAR O CONTEÚDO?',
    textos: [
      'Depois de praticar questões, você consegue perceber quais assuntos ainda precisam de atenção.',
      'Os Mapas de Informática organizam os principais conteúdos de forma resumida para facilitar suas revisões.'
    ],
    botao: '🗺️ CONHECER OS MAPAS',
    imagem: BASE_IMG + 'capa-mapas.png',
    capaEmoji: '🗺️',
    link: 'https://pay.kiwify.com.br/6nLacpi'
  },

  personalizado: {
    id: 'personalizado',
    nome: 'Simulado personalizado',
    icone: '🎯',
    cta: 'whatsapp',
    classe: 'go wa',
    kick: '🎯 SIMULADO PERSONALIZADO',
    titulo: 'ESTUDANDO PARA UM CONCURSO ESPECÍFICO?',
    textos: [
      'Posso preparar um simulado personalizado de Informática, de acordo com o seu concurso e sua banca.'
    ],
    botao: 'FALAR COMIGO NO WHATSAPP',
    iconeWhatsapp: true,
    link: 'https://wa.me/5561996169903'
  },

  grupo: {
    id: 'grupo',
    nome: 'Grupo gratuito',
    icone: '💚',
    cta: 'grupo',
    classe: 'go gr',
    kick: '💚 GRUPO GRATUITO DE ESTUDOS',
    titulo: 'QUER CONTINUAR RECEBENDO QUESTÕES E DICAS?',
    textos: [
      'Entre no grupo gratuito do DevMapas e receba questões, dicas e conteúdos de Informática para concursos diretamente no WhatsApp.'
    ],
    botao: 'ENTRAR NO GRUPO GRATUITO',
    iconeWhatsapp: true,
    link: 'https://chat.whatsapp.com/EB9OpUq1uOl1KA5TdiLheD?mode=gi_t'
  }
};

// Mapas e materiais individuais — aparecem na Central de Ofertas e no Gerador de Dicas
const MAPAS_INDIVIDUAIS = {
  internet_navegadores: {
    id: 'internet_navegadores',
    nome: 'Internet e Navegadores',
    icone: '🗺️',
    cta: 'mapas',
    classe: 'go b',

    kick: '🗺️ MAPA DE INTERNET E NAVEGADORES',

    titulo: 'NÃO PERCA TEMPO PROCURANDO CONTEÚDO!',

    textos: [
      'As dicas são só uma parte. Para estudar Informática para concurso, você precisa revisar muito mais.',
      'Neste mapa, você vai encontrar conteúdos cobrados em prova de: Internet • Navegadores • Protocolos • Serviços da Internet • Segurança na navegação.',
      'Tudo já resumido, organizado e mastigado para você.'
    ],

    botao: '🗺️ CONHECER O MAPA',

    imagem: BASE_IMG + 'capa-internet.PNG',
    capaEmoji: '🗺️',

    link: 'https://pay.kiwify.com.br/2PaOYvp'
  },
   atalhos: {
  id: 'atalhos',
  nome: 'Atalhos',
  icone: '⌨️',
  cta: 'atalhos',
  classe: 'go b',

  kick: '⌨️ CARTILHA DE ATALHOS',

  titulo: 'PARE DE ESQUECER OS ATALHOS QUE MAIS CAEM!',

  textos: [
    'Os atalhos podem economizar tempo na prova e aparecem com frequência em questões de Informática.',
    'Nesta cartilha, você vai encontrar atalhos importantes de Windows • Word • Excel • Navegadores e outros comandos que podem aparecer na sua prova.',
    'E ainda +200 questões comentadas de atalhos para você praticar, revisar e fixar o conteúdo.'
  ],

  botao: '⌨️ CONHECER A CARTILHA',

  imagem: BASE_IMG + 'dica-atalhos.png',
  capaEmoji: '⌨️',

  link: 'https://pay.kiwify.com.br/YAxuo8m'
}
   
};
