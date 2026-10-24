/* Regras do cadastro de PÁGINAS DE VENDA (modelo oficial PMPE) — um único arquivo usado pelo painel (navegador) e pela API (servidor).
   Não tem segredo. Define o formato dos dados, limpa o que vem do formulário, valida e interpreta o texto colado
   (preenchimento rápido) por regras simples, sem IA e sem serviço pago.

   dados = {
     identificacao: { concurso, cargo, questoes },          // {concurso} {cargo} {questoes} podem ser usados em qualquer texto
     seo:           { titulo, descricao },
     cores:         { principal, escura, destaque, fundo },
     cabecalho:     { visivel, marca, link },
     hero:          { visivel, etiqueta, eyebrow, titulo, subtitulo, aviso:{rotulo,texto}, chips:[txt], imagem:IMG, imagemAlt, nota:{icone,titulo,texto} },
     estrategia:    { visivel, etiqueta, titulo, texto, cards:[{icone,titulo,texto}], chamada, botao, botaoLink },
     alem:          { visivel, etiqueta, titulo, texto, lista:[txt], mapasTitulo, mapasTexto, mapas:[{imagem:IMG, legenda}], nota },
     depoimentos:   { visivel, etiqueta, titulo, texto, itens:[{imagem:IMG, legenda}] },
     ofertas:       { visivel, etiqueta, titulo, texto, simulado:OF, pacote:OF, compra:{icone,titulo,texto} },
     faq:           { visivel, etiqueta, titulo, itens:[{pergunta,resposta}] },
     suporte:       { visivel, etiqueta, titulo, texto, botao, link, whatsapp:{numero,mensagem} },
     rodape:        { visivel, linha1, linha2 }
   }
   OF  = { visivel, rotulo, nome, descricao, preco, precoPromocional, diferenca, selo, itens:[txt], botao, link, nota }
   IMG = { url, id }   url: https://... ou /caminho-do-site.png ; id: imagem da biblioteca (Storage), ou null quando é só uma URL
   Ocultar uma seção (visivel:false) NÃO apaga o conteúdo dela. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.PaginaRegras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX = { mapas: 30, depoimentos: 30, faq: 20, incluidos: 12, chips: 6, cards: 6, lista: 8 };
  const MAX_JSON = 300000;
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const COR_REGEX = /^#[0-9a-fA-F]{6}$/;
  const URL_REGEX = /^(?:https:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)$/;          // imagem: https://... ou caminho do próprio site
  const LINK_REGEX = /^https?:\/\/[^\s"'<>]+$/i;                                // checkout
  const BOTAO_LINK_REGEX = /^(?:#[A-Za-z0-9_-]+|https?:\/\/[^\s"'<>]+)$/i;      // botões de chamada: âncora da página ou URL
  const PLACEHOLDER_REGEX = /seu[-_ ]?link|link[-_ ]?(?:aqui|do|da)\b|exemplo|example|placeholder|xxx|\bteste\b|localhost|\.\.\.|0000/i;
  const CORES = { principal: '#263746', escura: '#101820', destaque: '#D9B765', fundo: '#F2F4F5' };   // paleta da PMPE
  const s = (v, max) => { const t = typeof v === 'string' ? v.replace(/\r/g, '').trim() : ''; return max ? t.slice(0, max) : t; };
  const glifos = (v) => [...v].slice(0, 6).join('');
  const vis = (x) => !(x && x.visivel === false);

  function slugify(v) { return s(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, ''); }
  const slugValido = (v) => typeof v === 'string' && v.length >= 3 && v.length <= 80 && SLUG_REGEX.test(v);

  const img = (x) => { x = x && typeof x === 'object' ? x : {}; const url = s(x.url, 1000); return { url: URL_REGEX.test(url) ? url : '', id: typeof x.id === 'string' && UUID_REGEX.test(x.id) && URL_REGEX.test(url) ? x.id.toLowerCase() : null }; };
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const lista = (v, max, f) => (Array.isArray(v) ? v : []).slice(0, max).map((x) => f(x && typeof x === 'object' ? x : {}));
  const textos = (v, max, len) => (Array.isArray(v) ? v : []).slice(0, max).map((x) => s(x, len || 200)).filter(Boolean);
  const itemImg = (x) => ({ imagem: img(x.imagem), legenda: s(x.legenda, 200) });
  const itemImgOk = (i) => i.imagem.url || i.legenda;
  const linkBotao = (v) => { const t = s(v, 1000); return BOTAO_LINK_REGEX.test(t) ? t : ''; };

  // Troca {concurso}, {cargo} e {questoes} pelos valores da página (usado pelo renderizador e pelas validações)
  function tokens(txt, d) {
    const i = (d && d.identificacao) || {};
    return String(txt == null ? '' : txt).replace(/\{concurso\}/gi, i.concurso || '').replace(/\{cargo\}/gi, i.cargo || '').replace(/\{questoes\}/gi, i.questoes == null ? '' : String(i.questoes));
  }

  // ------------------------------------------------------------------ preço
  // "25" | "25,90" | "R$ 1.299,90"  ->  { reais:'25', centavos:'90', valor:25.9 }  (null se não for um preço)
  function precoPartes(v) {
    const t = s(v).replace(/R\$\s*/i, '').replace(/\s/g, ''); const m = t.match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/); if (!m) return null;
    const reais = m[1].replace(/\./g, ''), cent = (m[2] || '00').padEnd(2, '0');
    return { reais, centavos: cent, valor: parseFloat(reais + '.' + cent) };
  }
  // Mensagem de problema do link de checkout ('' = ok). Usada na API (publicar) e no painel.
  function problemaLink(url) {
    const l = s(url); if (!l) return 'sem link de checkout';
    if (!LINK_REGEX.test(l)) return 'o link de checkout não é uma URL válida (comece com https://)';
    if (PLACEHOLDER_REGEX.test(l)) return 'o link de checkout parece de exemplo/placeholder';
    let u; try { u = new URL(l); } catch (e) { return 'o link de checkout não é uma URL válida'; }
    if (!u.hostname.includes('.') || u.pathname.replace(/\//g, '').length < 3) return 'o link de checkout está incompleto';
    return '';
  }

  const oferta = (o) => { o = obj(o); const link = s(o.link, 1000); return { visivel: vis(o), rotulo: s(o.rotulo, 80), nome: s(o.nome, 160), descricao: s(o.descricao, 1500), preco: s(o.preco, 40), precoPromocional: s(o.precoPromocional, 40), diferenca: s(o.diferenca, 200), selo: s(o.selo, 80), itens: textos(o.itens, MAX.incluidos), botao: s(o.botao, 60), link: LINK_REGEX.test(link) ? link : '', nota: s(o.nota, 300) }; };

  // Converte qualquer entrada no formato acima. Nunca lança erro, nunca inventa texto, não corta listas em silêncio (veja excedeLimites).
  function normalizar(d) {
    d = obj(d);
    const id = obj(d.identificacao), seo = obj(d.seo), cr = obj(d.cores), cab = obj(d.cabecalho), h = obj(d.hero), es = obj(d.estrategia), al = obj(d.alem), dp = obj(d.depoimentos), of = obj(d.ofertas), fq = obj(d.faq), su = obj(d.suporte), ro = obj(d.rodape);
    const cor = (k) => (COR_REGEX.test(s(cr[k])) ? s(cr[k]).toUpperCase() : CORES[k]);
    const q = parseInt(id.questoes, 10), wa = obj(su.whatsapp), av = obj(h.aviso), nt = obj(h.nota), cp = obj(of.compra);
    return {
      identificacao: { concurso: s(id.concurso, 120), cargo: s(id.cargo, 120), questoes: Number.isInteger(q) && q > 0 && q <= 9999 ? q : null },
      seo: { titulo: s(seo.titulo, 160), descricao: s(seo.descricao, 400) },
      cores: { principal: cor('principal'), escura: cor('escura'), destaque: cor('destaque'), fundo: cor('fundo') },
      cabecalho: { visivel: vis(cab), marca: s(cab.marca, 80), link: linkBotao(cab.link) },
      hero: { visivel: vis(h), etiqueta: s(h.etiqueta, 120), eyebrow: s(h.eyebrow, 120), titulo: s(h.titulo, 300), subtitulo: s(h.subtitulo, 600), aviso: { rotulo: s(av.rotulo, 40), texto: s(av.texto, 400) }, chips: textos(h.chips, MAX.chips, 80), imagem: img(h.imagem), imagemAlt: s(h.imagemAlt, 200), nota: { icone: glifos(s(nt.icone)), titulo: s(nt.titulo, 80), texto: s(nt.texto, 120) } },
      estrategia: { visivel: vis(es), etiqueta: s(es.etiqueta, 120), titulo: s(es.titulo, 200), texto: s(es.texto, 800), cards: lista(es.cards, MAX.cards, (x) => ({ icone: glifos(s(x.icone)), titulo: s(x.titulo, 200), texto: s(x.texto, 600) })).filter((i) => i.icone || i.titulo || i.texto), chamada: s(es.chamada, 300), botao: s(es.botao, 80), botaoLink: linkBotao(es.botaoLink) },
      alem: { visivel: vis(al), etiqueta: s(al.etiqueta, 120), titulo: s(al.titulo, 200), texto: s(al.texto, 800), lista: textos(al.lista, MAX.lista, 300), mapasTitulo: s(al.mapasTitulo, 200), mapasTexto: s(al.mapasTexto, 300), mapas: lista(al.mapas, MAX.mapas, itemImg).filter(itemImgOk), nota: s(al.nota, 400) },
      depoimentos: { visivel: vis(dp), etiqueta: s(dp.etiqueta, 120), titulo: s(dp.titulo, 200), texto: s(dp.texto, 400), itens: lista(dp.itens, MAX.depoimentos, itemImg).filter(itemImgOk) },
      ofertas: { visivel: vis(of), etiqueta: s(of.etiqueta, 120), titulo: s(of.titulo, 200), texto: s(of.texto, 400), simulado: oferta(of.simulado), pacote: oferta(of.pacote), compra: { icone: glifos(s(cp.icone)), titulo: s(cp.titulo, 100), texto: s(cp.texto, 400) } },
      faq: { visivel: vis(fq), etiqueta: s(fq.etiqueta, 120), titulo: s(fq.titulo, 200), itens: lista(fq.itens, MAX.faq, (x) => ({ pergunta: s(x.pergunta, 300), resposta: s(x.resposta, 2000) })).filter((i) => i.pergunta || i.resposta) },
      suporte: { visivel: vis(su), etiqueta: s(su.etiqueta, 120), titulo: s(su.titulo, 200), texto: s(su.texto, 600), botao: s(su.botao, 80), link: linkBotao(su.link), whatsapp: { numero: s(wa.numero).replace(/\D/g, '').slice(0, 15), mensagem: s(wa.mensagem, 300) } },
      rodape: { visivel: vis(ro), linha1: s(ro.linha1, 300), linha2: s(ro.linha2, 300) },
    };
  }

  // ids das imagens da biblioteca usadas na página (a API registra para que elas não possam ser apagadas).
  // Seções ocultas continuam registradas: o conteúdo não é apagado e a imagem não pode sumir do Storage.
  function idsImagens(d) {
    const n = normalizar(d), ids = new Set(); const add = (i) => { if (i && i.id) ids.add(i.id); };
    add(n.hero.imagem); n.alem.mapas.forEach((i) => add(i.imagem)); n.depoimentos.itens.forEach((i) => add(i.imagem));
    return [...ids];
  }
  // true se alguma lista passa do limite (a API recusa em vez de cortar em silêncio)
  function excedeLimites(d) {
    if (!d || typeof d !== 'object') return false; const n = (v) => (Array.isArray(v) ? v.length : 0); const o = (k) => obj(d[k]); const of = o('ofertas');
    return n(o('alem').mapas) > MAX.mapas || n(o('depoimentos').itens) > MAX.depoimentos || n(o('faq').itens) > MAX.faq || n(o('hero').chips) > MAX.chips || n(o('estrategia').cards) > MAX.cards
      || n(o('alem').lista) > MAX.lista || n(obj(of.simulado).itens) > MAX.incluidos || n(obj(of.pacote).itens) > MAX.incluidos;
  }

  // O que impede SALVAR (o resto pode ficar em branco e ser preenchido depois)
  function validar(slug, dadosBrutos) {
    const e = [], d = normalizar(dadosBrutos), b = obj(dadosBrutos);
    if (!slugValido(slug)) e.push('O endereço (slug) deve ter de 3 a 80 caracteres, só letras minúsculas, números e hífen.');
    if (!d.identificacao.concurso) e.push('Informe o nome do concurso.');
    const wa = d.suporte.whatsapp.numero; if (wa && (wa.length < 10 || wa.length > 15)) e.push('WhatsApp: informe o número com DDI e DDD (de 10 a 15 dígitos), ex.: 5561999999999.');
    const bo = obj(b.ofertas); [['simulado', 'Oferta 1 (simulado)'], ['pacote', 'Oferta 2 (pacote completo)']].forEach(([k, r]) => { const l = typeof obj(bo[k]).link === 'string' ? bo[k].link.trim() : ''; if (l && !LINK_REGEX.test(l)) e.push(r + ': o link de checkout deve começar com http:// ou https://.'); });
    [['cabecalho', 'Cabeçalho', 'link'], ['estrategia', 'Pratique com estratégia', 'botaoLink'], ['suporte', 'Suporte', 'link']].forEach(([k, r, c]) => { const l = typeof obj(b[k])[c] === 'string' ? b[k][c].trim() : ''; if (l && !BOTAO_LINK_REGEX.test(l)) e.push(r + ': o link do botão deve ser uma URL (https://...) ou um atalho da página (#ofertas).'); });
    return e;
  }

  // O que impede PUBLICAR. Nunca publica botão de compra sem link real (vazio, exemplo ou placeholder).
  function validarPublicacao(dadosBrutos) {
    const d = normalizar(dadosBrutos), e = [];
    if (!d.identificacao.concurso) e.push('Falta o nome do concurso.');
    if (d.hero.visivel && !d.hero.titulo) e.push('Falta o título principal (seção Hero).');
    const usaQ = JSON.stringify(d).includes('{questoes}') && !d.identificacao.questoes; if (usaQ) e.push('Há textos com {questoes}, mas a quantidade de questões não foi informada (Identificação).');
    if (d.ofertas.visivel) {
      const ativas = [['simulado', 'Oferta 1 (simulado)'], ['pacote', 'Oferta 2 (pacote completo)']].filter(([k]) => d.ofertas[k].visivel && (d.ofertas[k].nome || d.ofertas[k].preco || d.ofertas[k].descricao || d.ofertas[k].itens.length || d.ofertas[k].link));
      if (!ativas.length) e.push('A seção Ofertas está visível, mas nenhuma oferta está preenchida. Preencha uma oferta ou oculte a seção.');
      ativas.forEach(([k, r]) => {
        const o = d.ofertas[k], nome = o.nome ? '"' + o.nome + '"' : r;
        if (!o.nome) e.push(r + ': falta o nome do produto.');
        const p = precoPartes(o.preco); if (!p) e.push('A oferta ' + nome + ' precisa de um preço válido (ex.: 25,00).');
        if (o.precoPromocional) { const pp = precoPartes(o.precoPromocional); if (!pp) e.push('A oferta ' + nome + ': preço promocional inválido (ex.: 19,90).'); else if (p && pp.valor >= p.valor) e.push('A oferta ' + nome + ': o preço promocional deve ser menor que o preço normal.'); }
        const pl = problemaLink(o.link); if (pl) e.push('A oferta ' + nome + ' não pode ser publicada: ' + pl + '. Corrija na etapa Ofertas.');
      });
    }
    return e;
  }

  // Valores iniciais de uma página nova (editáveis). Reaproveita os textos da PMPE com {concurso}/{questoes}; preços e links ficam em branco de propósito.
  function padrao() {
    return normalizar({
      identificacao: { questoes: 105 },
      seo: { titulo: '{concurso} — Simulado de Informática | DevMapas', descricao: 'Prepare-se para {concurso} com um simulado de Informática de {questoes} questões comentadas e mapas de revisão. Material exclusivamente de Informática.' },
      cores: CORES,
      cabecalho: { marca: 'DevMapas - Informática' },
      hero: { etiqueta: 'Preparação para {concurso}', eyebrow: 'MATERIAL EXCLUSIVO DE INFORMÁTICA', titulo: 'Chegue mais preparado para a prova da [[{concurso}]] com prática e revisão de Informática',
        subtitulo: 'Treine com questões comentadas em formato de mini-aula e revise os pontos importantes da matéria com mapas mentais visuais.', aviso: { rotulo: 'Atenção:', texto: 'este material é somente de Informática. Não inclui as demais disciplinas do concurso.' },
        chips: ['📝 {questoes} questões', '💡 Comentários didáticos', '🧠 Revisão visual'], imagemAlt: 'Material visual de Informática do DevMapas', nota: { icone: '🎯', titulo: 'Foco na prova', texto: 'Pratique e revise' } },
      estrategia: { etiqueta: 'Pratique com estratégia', titulo: 'Treine Informática com um simulado de {questoes} questões', texto: 'Mais do que conferir o gabarito: entenda por que cada alternativa está certa ou errada e use os comentários para reforçar o conteúdo.',
        cards: [{ icone: '📝', titulo: 'Todo o conteúdo de Informática do edital', texto: '{questoes} questões para praticar os assuntos previstos no edital e identificar o que precisa de mais revisão.' },
          { icone: '💡', titulo: 'Comentários em formato de mini-aula', texto: 'Aprenda com explicações didáticas que ajudam a compreender o conteúdo cobrado.' },
          { icone: '🔎', titulo: 'Comentários em todas as alternativas', texto: 'Entenda por que cada opção está correta ou incorreta, em vez de apenas decorar o gabarito.' }],
        chamada: 'Quer conhecer também o material para aprofundar sua revisão?', botao: 'VER AS OPÇÕES DE ACESSO' },
      alem: { etiqueta: 'Quer ir além?', titulo: 'Aprofunde seus estudos com o pacote completo de mapas de revisão', texto: 'Além de praticar com questões, reforce a teoria com mapas mentais visuais que organizam os conteúdos de Informática para facilitar suas revisões.',
        lista: ['Conteúdo organizado visualmente por assunto', 'Palavras-chave e pontos importantes para revisar', 'Material digital para consultar durante a preparação'], mapasTitulo: 'Veja algumas amostras dos mapas', mapasTexto: 'Confira exemplos reais do estilo visual do material.',
        nota: 'As amostras são ilustrativas do material de revisão. Confira na oferta o conteúdo incluído em cada opção.' },
      depoimentos: { etiqueta: 'Experiências de alunos', titulo: 'Veja os depoimentos', texto: 'Confira relatos de quem já conhece os materiais do DevMapas.' },
      ofertas: { etiqueta: 'Escolha sua preparação', titulo: 'Qual opção combina com seu momento?', texto: 'Escolha entre praticar com o simulado ou combinar questões e revisão visual.',
        simulado: { rotulo: 'Opção 1', nome: 'Simulado de Informática', descricao: 'Para quem quer testar os conhecimentos e estudar pelos comentários.', itens: ['{questoes} questões de Informática', 'Comentários em formato de mini-aula', 'Comentários em todas as alternativas', 'Material digital em PDF', 'Acesso imediato após a confirmação da compra'], botao: 'QUERO SÓ O SIMULADO', nota: 'Material exclusivamente de Informática para {concurso}.' },
        pacote: { rotulo: 'Opção 2 · Pacote completo', selo: '★ Melhor custo-benefício', nome: 'Pacote Completo - Simulados + Mapas de Revisão', descricao: 'Para quem quer praticar questões e reforçar a teoria em um só pacote.', itens: ['3 simulados de Informática', '+150 mapas mentais de todo o conteúdo de Informática', 'Comentários em formato de mini-aula', 'Comentários explicativos em todas as alternativas', 'Material digital em PDF', 'Acesso imediato após a confirmação da compra', 'Acesso vitalício ao material adquirido'], botao: 'QUERO O PACOTE COMPLETO', nota: 'Tudo focado em Informática. Não inclui as demais disciplinas de {concurso}.' },
        compra: { icone: '🔒', titulo: 'Compra digital', texto: 'Após a confirmação do pagamento, siga as instruções de acesso enviadas pela plataforma de compra.' } },
      faq: { etiqueta: 'Dúvidas frequentes', titulo: 'Perguntas frequentes', itens: [
        { pergunta: 'O material inclui todas as matérias de {concurso}?', resposta: 'Não. Este produto é exclusivamente de Informática. Ele não inclui as demais disciplinas do concurso.' },
        { pergunta: 'O que recebo ao comprar o simulado?', resposta: 'Você recebe um simulado de Informática com {questoes} questões, comentários em formato de mini-aula e explicações de todas as alternativas.' },
        { pergunta: 'O que vem no pacote completo?', resposta: 'O pacote inclui os simulados de Informática e o pacote completo de mapas de revisão, conforme descrito na oferta.' },
        { pergunta: 'O material é digital?', resposta: 'Sim, é um material digital. As instruções de acesso serão apresentadas após a confirmação da compra.' },
        { pergunta: 'Como tiro dúvidas sobre a compra?', resposta: 'Você pode entrar em contato com o suporte pelo botão de WhatsApp desta página.' }] },
      suporte: { etiqueta: 'Estamos aqui para ajudar', titulo: 'Ainda ficou com alguma dúvida?', texto: 'Fale com o suporte se precisar de ajuda sobre o material ou o processo de compra.', botao: '📲 FALAR NO WHATSAPP' },
      rodape: { linha1: 'DevMapas · Material de Informática para concursos', linha2: '© 2026 — Todos os direitos reservados.' },
    });
  }

  // ====================================================================== PREENCHIMENTO RÁPIDO (texto colado)
  // Cada seção do texto -> campos do mesmo objeto de dados. tipo: t = texto numa linha · p = parágrafos · l = lista (- item) · c = cards (- ícone | título | texto) · n = número
  const T = (nome, caminho, tipo) => [nome, caminho, tipo || 't'];
  const OF_CAMPOS = (k) => [T('Rótulo', ['ofertas', k, 'rotulo']), T('Selo', ['ofertas', k, 'selo']), T('Nome', ['ofertas', k, 'nome']), T('Descrição', ['ofertas', k, 'descricao'], 'p'), T('Preço', ['ofertas', k, 'preco']), T('Preço promocional', ['ofertas', k, 'precoPromocional']), T('Diferença', ['ofertas', k, 'diferenca']), T('Itens', ['ofertas', k, 'itens'], 'l'), T('Botão', ['ofertas', k, 'botao']), T('Nota', ['ofertas', k, 'nota'])];
  const SECOES = [
    { chave: 'concurso', rotulo: 'CONCURSO', unico: ['identificacao', 'concurso'], tipo: 't' },
    { chave: 'cargo', rotulo: 'CARGO', unico: ['identificacao', 'cargo'], tipo: 't' },
    { chave: 'questoes', rotulo: 'QUESTOES', unico: ['identificacao', 'questoes'], tipo: 'n', dica: 'só o número' },
    { chave: 'seo', rotulo: 'SEO', campos: [T('Título da página', ['seo', 'titulo']), T('Descrição', ['seo', 'descricao'], 'p')] },
    { chave: 'cabecalho', rotulo: 'CABECALHO', campos: [T('Marca', ['cabecalho', 'marca'])] },
    { chave: 'hero', rotulo: 'HERO', campos: [T('Etiqueta', ['hero', 'etiqueta']), T('Chamada superior', ['hero', 'eyebrow']), T('Título', ['hero', 'titulo']), T('Subtítulo', ['hero', 'subtitulo'], 'p'), T('Rótulo do aviso', ['hero', 'aviso', 'rotulo']), T('Aviso', ['hero', 'aviso', 'texto']), T('Chips', ['hero', 'chips'], 'l'), T('Destaque ícone', ['hero', 'nota', 'icone']), T('Destaque título', ['hero', 'nota', 'titulo']), T('Destaque texto', ['hero', 'nota', 'texto'])] },
    { chave: 'estrategia', rotulo: 'ESTRATEGIA', campos: [T('Etiqueta', ['estrategia', 'etiqueta']), T('Título', ['estrategia', 'titulo']), T('Texto', ['estrategia', 'texto'], 'p'), T('Cards', ['estrategia', 'cards'], 'c'), T('Chamada', ['estrategia', 'chamada']), T('Botão', ['estrategia', 'botao'])] },
    { chave: 'alem', rotulo: 'QUER_IR_ALEM', campos: [T('Etiqueta', ['alem', 'etiqueta']), T('Título', ['alem', 'titulo']), T('Texto', ['alem', 'texto'], 'p'), T('Lista', ['alem', 'lista'], 'l'), T('Título dos mapas', ['alem', 'mapasTitulo']), T('Texto dos mapas', ['alem', 'mapasTexto']), T('Nota', ['alem', 'nota'], 'p')] },
    { chave: 'depoimentos', rotulo: 'DEPOIMENTOS', campos: [T('Etiqueta', ['depoimentos', 'etiqueta']), T('Título', ['depoimentos', 'titulo']), T('Texto', ['depoimentos', 'texto'], 'p')] },
    { chave: 'ofertas', rotulo: 'OFERTAS', campos: [T('Etiqueta', ['ofertas', 'etiqueta']), T('Título', ['ofertas', 'titulo']), T('Texto', ['ofertas', 'texto'], 'p'), T('Compra ícone', ['ofertas', 'compra', 'icone']), T('Compra título', ['ofertas', 'compra', 'titulo']), T('Compra texto', ['ofertas', 'compra', 'texto'], 'p')] },
    { chave: 'oferta1', rotulo: 'OFERTA_1_SIMULADO', campos: OF_CAMPOS('simulado') },
    { chave: 'oferta2', rotulo: 'OFERTA_2_PACOTE_COMPLETO', campos: OF_CAMPOS('pacote') },
    { chave: 'faq', rotulo: 'FAQ', campos: [T('Etiqueta', ['faq', 'etiqueta']), T('Título', ['faq', 'titulo'])], faq: true },
    { chave: 'suporte', rotulo: 'SUPORTE', campos: [T('Etiqueta', ['suporte', 'etiqueta']), T('Título', ['suporte', 'titulo']), T('Texto', ['suporte', 'texto'], 'p'), T('Botão', ['suporte', 'botao']), T('Mensagem', ['suporte', 'whatsapp', 'mensagem'])] },
    { chave: 'rodape', rotulo: 'RODAPE', campos: [T('Linha 1', ['rodape', 'linha1']), T('Linha 2', ['rodape', 'linha2'])] },
  ];
  const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const ALIAS = {}; SECOES.forEach((x) => { ALIAS[norm(x.rotulo)] = x.chave; });
  Object.assign(ALIAS, { 'PRATIQUE COM ESTRATEGIA': 'estrategia', 'ALEM': 'alem', 'PACOTE': 'alem', 'PACOTE COMPLETO': 'alem', 'MAPAS': 'alem', 'CAPA': 'hero', 'CONTATO': 'suporte', 'OFERTA 1': 'oferta1', 'OFERTA SIMULADO': 'oferta1', 'OFERTA 2': 'oferta2', 'OFERTA PACOTE': 'oferta2', 'OFERTA PACOTE COMPLETO': 'oferta2', 'PERGUNTAS FREQUENTES': 'faq', 'DUVIDAS FREQUENTES': 'faq', 'RODAPE': 'rodape', 'QUESTOES DO SIMULADO': 'questoes' });
  const SO_SECAO = new Set(Object.values(ALIAS).filter((k) => !['concurso', 'cargo', 'questoes'].includes(k)).concat(['concurso', 'cargo', 'questoes']));
  const NOME_SECAO = {}; SECOES.forEach((x) => { NOME_SECAO[x.chave] = x.rotulo.replace(/_/g, ' ').toLowerCase(); });
  const ITEM = /^(?:[-*•●▪]|\d{1,2}[.)])\s+(.*)$/;
  const resumo = (t) => (t.length > 50 ? t.slice(0, 47) + '…' : t);
  const ehLinkOuImagem = (t) => /https?:\/\/|www\.|!\[.*\]\(|\.(?:png|jpe?g|webp|gif)\b/i.test(t);

  function cabecalhoLinha(linha) {
    let t = linha.trim().replace(/\*\*|__/g, '').trim(), forma = '', m;
    if ((m = t.match(/^\[(.+)\]$/))) { t = m[1]; forma = 'colchetes'; }
    else if ((m = t.match(/^#{1,6}\s*(.+?)\s*#*$/))) { t = m[1]; forma = 'marcador'; }
    else if ((m = t.match(/^={2,}\s*(.+?)\s*=*$/))) { t = m[1]; forma = 'marcador'; }
    else if ((m = t.match(/^(.{2,60}?)\s*:\s*$/))) { t = m[1]; forma = 'doispontos'; }
    else if (t.length <= 60 && /[A-ZÀ-Ý]/.test(t) && !/[a-zà-ÿ]/.test(t)) forma = 'caixa';
    if (!forma) return null;
    const chave = ALIAS[norm(t)];
    if (chave && (forma === 'colchetes' || forma === 'marcador' || SO_SECAO.has(chave))) return { chave };
    if (forma === 'colchetes') return { desconhecido: t };
    return null;
  }
  const LINK_CHAVES = new Set(['LINK', 'CHECKOUT', 'URL', 'WHATSAPP', 'NUMERO', 'IMAGEM', 'FOTO']);

  function interpretarTexto(texto) {
    const avisos = [], encontradas = [], ops = []; const aten = (m) => avisos.push({ nivel: 'atencao', msg: m });
    const linhas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
    const secoes = []; let atual = null, pre = [];
    linhas.forEach((l) => { const c = cabecalhoLinha(l); if (c && c.chave) { atual = { chave: c.chave, linhas: [] }; secoes.push(atual); } else if (c && c.desconhecido) { aten('Seção desconhecida "' + resumo(c.desconhecido) + '": o conteúdo dela não foi usado.'); atual = { chave: null, linhas: [] }; } else if (atual) atual.linhas.push(l); else pre.push(l); });
    if (pre.join('').trim()) aten('Havia texto antes do primeiro marcador de seção; ele não foi usado.');
    if (!secoes.length) { avisos.unshift({ nivel: 'erro', msg: 'Não encontrei nenhum marcador de seção (ex.: [CONCURSO], [HERO]). Use o modelo padrão (botão "Copiar modelo para o ChatGPT").' }); return { ops, avisos, encontradas }; }
    const vistas = new Set();
    secoes.forEach((sec) => {
      if (!sec.chave) return; const def = SECOES.find((x) => x.chave === sec.chave), nome = NOME_SECAO[sec.chave], corpo = sec.linhas.map((x) => x.replace(/\*\*|__/g, ''));
      if (vistas.has(sec.chave)) aten('A seção ' + nome + ' aparece mais de uma vez; usei a última.'); vistas.add(sec.chave);
      if (def.unico) {
        const v = corpo.map((x) => x.trim()).filter(Boolean).join(' '); if (!v) { aten(nome + ': seção vazia (deixei como está).'); return; }
        if (ehLinkOuImagem(v)) aten(nome + ': o texto parece conter link ou imagem; confira.');
        if (def.tipo === 'n') { const n = parseInt(v.replace(/\D/g, ''), 10); if (Number.isInteger(n) && n > 0) ops.push({ caminho: def.unico, valor: n }); else aten(nome + ': não entendi o número "' + resumo(v) + '".'); } else ops.push({ caminho: def.unico, valor: v });
        encontradas.push(sec.chave); return;
      }
      const campos = {}; (def.campos || []).forEach(([n, c, t]) => { campos[norm(n)] = { caminho: c, tipo: t, nome: n }; });
      const listaPadrao = (def.campos || []).find(([, , t]) => t === 'l' || t === 'c');
      if (def.faq) {
        const faq = []; let cur = null;
        corpo.forEach((raw) => { const l = raw.trim(); if (!l) return; const tt = l.match(/^(Etiqueta|T[ií]tulo)\s*:\s*(.*)$/i); if (tt) { ops.push({ caminho: ['faq', /^e/i.test(tt[1]) ? 'etiqueta' : 'titulo'], valor: tt[2].trim() }); cur = null; return; }
          const m = l.match(/^(?:[-*•]\s*)?(?:\d{1,2}[.)]\s*)?(P|Pergunta|Q)\s*[:.)]\s*(.*)$/i), r = l.match(/^(?:[-*•]\s*)?(R|Resposta|A)\s*[:.)]\s*(.*)$/i);
          if (m) { cur = { pergunta: m[2].trim(), resposta: '', parte: 'p' }; faq.push(cur); return; } if (r && cur) { cur.resposta = r[2].trim(); cur.parte = 'r'; return; }
          const im = l.match(ITEM); if (im && im[1].includes('|')) { const [pg, ...rs] = im[1].split('|'); faq.push({ pergunta: pg.trim(), resposta: rs.join('|').trim(), parte: 'r' }); cur = null; return; }
          if (cur) { if (cur.parte === 'p') cur.pergunta += ' ' + l; else cur.resposta += (cur.resposta ? '\n' : '') + l; return; }
          aten('FAQ: a linha "' + resumo(l) + '" não está no formato "P: ..." / "R: ..."; não foi usada.'); });
        faq.forEach((f, i) => { if (!f.resposta) aten('FAQ, pergunta ' + (i + 1) + ' ("' + resumo(f.pergunta) + '"): sem resposta.'); delete f.parte; });
        if (faq.length) ops.push({ caminho: ['faq', 'itens'], valor: faq }); else aten('FAQ: não encontrei perguntas (use "P: ..." e "R: ...").');
        encontradas.push(sec.chave); return;
      }
      const val = {}; let cur = null, ignorando = false;
      corpo.forEach((raw) => {
        const l = raw.trim(); if (!l) return;
        const km = l.match(/^([A-Za-zÀ-ÿ0-9_ ]{2,28}?)\s*:\s*(.*)$/), k = km && norm(km[1]);
        if (km && (campos[k] || LINK_CHAVES.has(k))) {
          ignorando = false; if (!campos[k]) { ignorando = true; aten(nome + ': "' + km[1] + '" tem campo próprio (links, imagens e WhatsApp não são lidos do texto). Ignorei esta linha.'); return; }
          cur = campos[k]; val[cur.nome] = val[cur.nome] || { def: cur, texto: '', itens: [] }; if (km[2].trim()) { if (cur.tipo === 'l' || cur.tipo === 'c') km[2].split(/;/).forEach((x) => x.trim() && val[cur.nome].itens.push(x.trim())); else val[cur.nome].texto = km[2].trim(); } return;
        }
        if (ignorando) return;
        const im = l.match(ITEM);
        if (im) { const alvo = cur && (cur.tipo === 'l' || cur.tipo === 'c') ? cur : listaPadrao && { nome: listaPadrao[0], caminho: listaPadrao[1], tipo: listaPadrao[2] }; if (alvo) { val[alvo.nome] = val[alvo.nome] || { def: alvo, texto: '', itens: [] }; val[alvo.nome].itens.push(im[1].trim()); cur = alvo; } else aten(nome + ': a linha "' + resumo(l) + '" não foi usada.'); return; }
        if (cur && (cur.tipo === 'l' || cur.tipo === 'c') && val[cur.nome].itens.length) { val[cur.nome].itens[val[cur.nome].itens.length - 1] += ' ' + l; return; }
        if (cur) { const v = val[cur.nome]; v.texto += (v.texto ? (cur.tipo === 'p' ? '\n' : ' ') : '') + l; return; }
        aten(nome + ': a linha "' + resumo(l) + '" não está em "Campo: valor"; não foi usada.');
      });
      Object.keys(val).forEach((n) => { const v = val[n], def2 = v.def;
        if (def2.tipo === 'l') { const it = v.itens.filter((x) => !ehLinkOuImagem(x)); if (it.length) ops.push({ caminho: def2.caminho, valor: it }); else aten(nome + ' / ' + n + ': sem itens (use linhas "- item").'); }
        else if (def2.tipo === 'c') { const cards = v.itens.map((x, i) => { const p = x.split('|').map((y) => y.trim()); if (p.length >= 3) return { icone: p[0], titulo: p[1], texto: p.slice(2).join(' | ') }; if (p.length === 2) return { icone: '', titulo: p[0], texto: p[1] }; aten(nome + ', card ' + (i + 1) + ': use "- ícone | título | texto".'); return { icone: '', titulo: x, texto: '' }; }); if (cards.length) ops.push({ caminho: def2.caminho, valor: cards }); }
        else { if (ehLinkOuImagem(v.texto)) aten(nome + ' / ' + n + ': o texto parece conter link ou imagem; confira.'); if (v.texto || v.def) ops.push({ caminho: def2.caminho, valor: v.texto }); } });
      if (!Object.keys(val).length) aten(nome + ': seção vazia ou sem campos reconhecidos.');
      encontradas.push(sec.chave);
    });
    ['concurso', 'hero', 'oferta1', 'oferta2'].forEach((k) => { if (!vistas.has(k)) avisos.push({ nivel: 'atencao', msg: 'Não encontrei a seção ' + NOME_SECAO[k] + ': deixei como está (preencha manualmente se precisar).' }); });
    return { ops, avisos, encontradas };
  }

  // Aplica o texto interpretado sobre os dados atuais SEM apagar nada que o texto não trouxe:
  // só os campos presentes são trocados. Imagens, links, cores, WhatsApp e "visível" nunca são tocados pelo texto.
  function aplicar(atual, r) {
    const d = normalizar(atual);
    ((r && r.ops) || []).forEach((op) => { let o = d; for (let i = 0; i < op.caminho.length - 1; i++) o = o[op.caminho[i]]; o[op.caminho[op.caminho.length - 1]] = op.valor; });
    return normalizar(d);
  }

  const lerCaminho = (d, c) => c.reduce((o, k) => (o == null ? o : o[k]), d);
  // Texto padrão a partir dos campos (o painel usa para "Copiar texto atual" e para o modelo do ChatGPT)
  function gerarTexto(dados) {
    const d = normalizar(dados), L = [];
    SECOES.forEach((sec) => {
      L.push('[' + sec.rotulo + ']');
      if (sec.unico) { const v = lerCaminho(d, sec.unico); L.push(v == null ? '' : String(v)); }
      else if (sec.faq) { L.push('Etiqueta: ' + d.faq.etiqueta); L.push('Título: ' + d.faq.titulo); d.faq.itens.forEach((f) => { L.push('P: ' + f.pergunta); L.push('R: ' + f.resposta); }); }
      else sec.campos.forEach(([n, c, t]) => { const v = lerCaminho(d, c); if (t === 'l') { L.push(n + ':'); (v || []).forEach((x) => L.push('- ' + x)); } else if (t === 'c') { L.push(n + ':'); (v || []).forEach((x) => L.push('- ' + (x.icone ? x.icone + ' | ' : '') + x.titulo + ' | ' + x.texto)); } else L.push(n + ': ' + String(v == null ? '' : v).replace(/\n+/g, t === 'p' ? '\n' : ' ')); });
      L.push('');
    });
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  // Instrução para colar no ChatGPT (gera o texto no formato que o interpretador entende). O esqueleto é o próprio texto padrão.
  function modeloChatGPT() {
    return 'Você vai preparar o conteúdo de uma PÁGINA DE VENDAS de simulado de Informática para concursos.\n'
      + 'Responda SOMENTE com o texto abaixo, preenchido, mantendo EXATAMENTE os marcadores entre colchetes (cada um sozinho na linha) e os nomes dos campos.\n'
      + 'Regras: não invente preço, quantidade de questões, garantias nem links; se não souber, deixe o campo em branco. Não coloque URLs, números de WhatsApp nem imagens (são cadastrados em campos próprios). Texto simples, sem negrito.\n'
      + 'Pode usar {concurso}, {cargo} e {questoes} nos textos. No título do HERO, envolva a palavra em destaque com [[ ]].\n'
      + 'Em "Cards" e "Chips"/"Itens"/"Lista", use uma linha por item começando com "- ". Em Cards: "- ícone | título | texto". No FAQ: "P: pergunta" e "R: resposta".\n\n'
      + gerarTexto(padrao());
  }

  return { MAX, MAX_JSON, UUID_REGEX, CORES, slugify, slugValido, normalizar, padrao, idsImagens, excedeLimites, validar, validarPublicacao, interpretarTexto, aplicar, gerarTexto, modeloChatGPT, tokens, precoPartes, problemaLink, SECOES };
});
