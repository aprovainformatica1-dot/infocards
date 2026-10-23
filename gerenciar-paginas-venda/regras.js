/* Regras do cadastro de PÁGINAS DE VENDA — um único arquivo usado pelo painel (navegador) e pela API (servidor).
   Não tem segredo. Define o formato dos dados, limpa o que vem do formulário, valida o mínimo e
   interpreta o texto colado (preenchimento rápido) — por regras simples, sem IA e sem serviço pago.

   dados = {
     identificacao: { concurso, cargo },
     aparencia:     { titulo, subtitulo, cores: { principal, escura, destaque, fundo }, capa: IMG },
     apresentacao:  { problemas: { titulo, itens: [{ icone, titulo, texto }] },
                      beneficios: { titulo, texto, itens: [{ imagem: IMG, titulo, texto }] } },
     amostras:      { titulo, itens: [{ imagem: IMG, legenda }] },          // amostras do simulado
     pacote:        { titulo, texto },
     mapas:         { titulo, itens: [{ imagem: IMG, legenda }] },
     depoimentos:   { titulo, itens: [{ imagem: IMG, legenda }] },
     ofertas:       { titulo, simulado: { nome, preco, descricao, questoes, itens: [texto], link, botao },
                              pacote:   { nome, preco, descricao, itens: [texto], link, botao } },
     finalizacao:   { faqTitulo, faq: [{ pergunta, resposta }], contato: { titulo, texto }, garantias: [texto],
                      whatsapp: { numero, mensagem }, rodape }
   }
   IMG = { url, id }   url: https://... ou /caminho-do-site.png ; id: imagem da biblioteca (Storage), ou null quando é só uma URL */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.PaginaRegras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX = { problemas: 8, beneficios: 8, amostras: 30, mapas: 30, depoimentos: 30, faq: 20, incluidos: 12, garantias: 8 };
  const MAX_JSON = 300000;
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const COR_REGEX = /^#[0-9a-fA-F]{6}$/;
  const URL_REGEX = /^(?:https:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*)$/;          // https://... ou caminho do próprio site
  const LINK_REGEX = /^https?:\/\/[^\s"'<>]+$/i;                                // checkout
  const CORES = { principal: '#7E22CE', escura: '#4C1D95', destaque: '#F4A81D', fundo: '#F8F5FF' };   // as cores atuais do site de vendas
  const s = (v, max) => { const t = typeof v === 'string' ? v.replace(/\r/g, '').trim() : ''; return max ? t.slice(0, max) : t; };
  const glifos = (v) => [...v].slice(0, 6).join('');

  function slugify(v) { return s(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, ''); }
  const slugValido = (v) => typeof v === 'string' && v.length >= 3 && v.length <= 80 && SLUG_REGEX.test(v);

  const img = (x) => { x = x && typeof x === 'object' ? x : {}; const url = s(x.url, 1000); return { url: URL_REGEX.test(url) ? url : '', id: typeof x.id === 'string' && UUID_REGEX.test(x.id) && URL_REGEX.test(url) ? x.id.toLowerCase() : null }; };
  const lista = (v, max, f) => (Array.isArray(v) ? v : []).slice(0, max).map((x) => f(x && typeof x === 'object' ? x : {}));
  const textos = (v, max) => (Array.isArray(v) ? v : []).slice(0, max).map((x) => s(x, 200)).filter(Boolean);
  const vazioImg = (i) => !i.imagem.url && !i.legenda;

  // Valores iniciais de uma página nova (editáveis): só o que o próprio site atual já usa
  function padrao() {
    return normalizar({ aparencia: { cores: CORES }, ofertas: { pacote: { itens: ['Simulado principal', '2 simulados adicionais', 'Mapas de revisão'] } },
      finalizacao: { garantias: ['Acesso imediato', 'Garantia de 7 dias', 'Compra 100% segura pela Kiwify'] } });
  }

  // Converte qualquer entrada no formato acima. Nunca lança erro, nunca inventa texto, não corta listas em silêncio (veja excedeLimites).
  function normalizar(d) {
    d = d && typeof d === 'object' ? d : {};
    const g = (k) => (d[k] && typeof d[k] === 'object' ? d[k] : {});
    const ap = g('aparencia'), cr = ap.cores && typeof ap.cores === 'object' ? ap.cores : {}, apr = g('apresentacao'), pro = apr.problemas || {}, ben = apr.beneficios || {}, of = g('ofertas'), fin = g('finalizacao'), wa = fin.whatsapp || {}, ct = fin.contato || {};
    const cor = (k) => (COR_REGEX.test(s(cr[k])) ? s(cr[k]).toUpperCase() : CORES[k]);
    const sec = (k) => ({ titulo: s(g(k).titulo, 200), itens: lista(g(k).itens, MAX[k], (x) => ({ imagem: img(x.imagem), legenda: s(x.legenda, 200) })).filter((i) => !vazioImg(i)) });
    const oferta = (o, comQuestoes) => { o = o && typeof o === 'object' ? o : {}; const link = s(o.link, 1000); const r = { nome: s(o.nome, 120), preco: s(o.preco, 40), descricao: s(o.descricao, 1500), itens: textos(o.itens, MAX.incluidos), link: LINK_REGEX.test(link) ? link : '', botao: s(o.botao, 60) };
      if (comQuestoes) { const n = parseInt(o.questoes, 10); r.questoes = Number.isInteger(n) && n >= 0 && n <= 9999 ? n : null; } return r; };
    return {
      identificacao: { concurso: s(g('identificacao').concurso, 120), cargo: s(g('identificacao').cargo, 120) },
      aparencia: { titulo: s(ap.titulo, 200), subtitulo: s(ap.subtitulo, 600), cores: { principal: cor('principal'), escura: cor('escura'), destaque: cor('destaque'), fundo: cor('fundo') }, capa: img(ap.capa) },
      apresentacao: {
        problemas: { titulo: s(pro.titulo, 200), itens: lista(pro.itens, MAX.problemas, (x) => ({ icone: glifos(s(x.icone)), titulo: s(x.titulo, 200), texto: s(x.texto, 1000) })).filter((i) => i.icone || i.titulo || i.texto) },
        beneficios: { titulo: s(ben.titulo, 200), texto: s(ben.texto, 1500), itens: lista(ben.itens, MAX.beneficios, (x) => ({ imagem: img(x.imagem), titulo: s(x.titulo, 200), texto: s(x.texto, 1000) })).filter((i) => i.imagem.url || i.titulo || i.texto) },
      },
      amostras: sec('amostras'),
      pacote: { titulo: s(g('pacote').titulo, 200), texto: s(g('pacote').texto, 2000) },
      mapas: sec('mapas'), depoimentos: sec('depoimentos'),
      ofertas: { titulo: s(of.titulo, 200), simulado: oferta(of.simulado, true), pacote: oferta(of.pacote, false) },
      finalizacao: {
        faqTitulo: s(fin.faqTitulo, 200), faq: lista(fin.faq, MAX.faq, (x) => ({ pergunta: s(x.pergunta, 300), resposta: s(x.resposta, 2000) })).filter((i) => i.pergunta || i.resposta),
        contato: { titulo: s(ct.titulo, 200), texto: s(ct.texto, 1000) }, garantias: textos(fin.garantias, MAX.garantias),
        whatsapp: { numero: s(wa.numero).replace(/\D/g, '').slice(0, 15), mensagem: s(wa.mensagem, 300) }, rodape: s(fin.rodape, 500),
      },
    };
  }
  // ids das imagens da biblioteca usadas na página (a API registra para que elas não possam ser apagadas)
  function idsImagens(d) {
    const n = normalizar(d), ids = new Set(); const add = (i) => { if (i && i.id) ids.add(i.id); };
    add(n.aparencia.capa); n.apresentacao.beneficios.itens.forEach((i) => add(i.imagem)); ['amostras', 'mapas', 'depoimentos'].forEach((k) => n[k].itens.forEach((i) => add(i.imagem)));
    return [...ids];
  }
  // true se alguma lista passa do limite (a API recusa em vez de cortar em silêncio)
  function excedeLimites(d) {
    if (!d || typeof d !== 'object') return false; const n = (v) => (Array.isArray(v) ? v.length : 0); const ap = d.apresentacao || {}, of = d.ofertas || {}, fin = d.finalizacao || {};
    return n(d.amostras && d.amostras.itens) > MAX.amostras || n(d.mapas && d.mapas.itens) > MAX.mapas || n(d.depoimentos && d.depoimentos.itens) > MAX.depoimentos || n(ap.problemas && ap.problemas.itens) > MAX.problemas || n(ap.beneficios && ap.beneficios.itens) > MAX.beneficios
      || n(fin.faq) > MAX.faq || n(fin.garantias) > MAX.garantias || n(of.simulado && of.simulado.itens) > MAX.incluidos || n(of.pacote && of.pacote.itens) > MAX.incluidos;
  }
  // O que impede SALVAR (o resto pode ficar em branco e ser preenchido depois)
  function validar(slug, dadosBrutos) {
    const e = [], d = normalizar(dadosBrutos), b = dadosBrutos && typeof dadosBrutos === 'object' ? dadosBrutos : {};
    if (!slugValido(slug)) e.push('O endereço (slug) deve ter de 3 a 80 caracteres, só letras minúsculas, números e hífen.');
    if (!d.identificacao.concurso) e.push('Informe o nome do concurso.');
    const wa = d.finalizacao.whatsapp.numero; if (wa && (wa.length < 10 || wa.length > 15)) e.push('WhatsApp: informe o número com DDI e DDD (de 10 a 15 dígitos), ex.: 5561999999999.');
    const bruto = (b.ofertas || {}); [['simulado', 'Oferta 1 (simulado)'], ['pacote', 'Oferta 2 (pacote completo)']].forEach(([k, r]) => { const l = bruto[k] && typeof bruto[k].link === 'string' ? bruto[k].link.trim() : ''; if (l && !LINK_REGEX.test(l)) e.push(r + ': o link de checkout precisa começar com https://.'); });
    return e;
  }
  // O que impede PUBLICAR
  function validarPublicacao(dadosBrutos) {
    const d = normalizar(dadosBrutos), e = [];
    if (!d.aparencia.titulo) e.push('Falta o título principal (etapa Aparência).');
    if (!(d.ofertas.simulado.link || d.ofertas.pacote.link)) e.push('Cadastre pelo menos um link de checkout (etapa Ofertas).');
    ['simulado', 'pacote'].forEach((k) => { const o = d.ofertas[k]; if ((o.nome || o.preco || o.descricao || o.itens.length) && !o.link) e.push('A oferta "' + (o.nome || (k === 'simulado' ? 'simulado individual' : 'pacote completo')) + '" está sem link de checkout.'); });
    return e;
  }

  // ====================================================================== PREENCHIMENTO RÁPIDO (texto colado)
  const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const ALIAS = {
    'CONCURSO': 'concurso', 'CARGO': 'cargo', 'TITULO': 'titulo', 'TITULO PRINCIPAL': 'titulo', 'SUBTITULO': 'subtitulo',
    'PROBLEMAS': 'problemas', 'BENEFICIOS': 'beneficios', 'AMOSTRAS DO SIMULADO': 'amostras', 'AMOSTRAS SIMULADO': 'amostras', 'AMOSTRAS': 'amostras',
    'PACOTE': 'pacote', 'PACOTE COMPLETO': 'pacote', 'AMOSTRAS DOS MAPAS': 'mapas', 'AMOSTRAS MAPAS': 'mapas', 'MAPAS': 'mapas', 'DEPOIMENTOS': 'depoimentos',
    'OFERTAS': 'ofertas', 'OFERTA 1': 'oferta1', 'OFERTA SIMULADO': 'oferta1', 'OFERTA 1 SIMULADO': 'oferta1', 'OFERTA SIMULADO INDIVIDUAL': 'oferta1', 'OFERTA 1 SIMULADO INDIVIDUAL': 'oferta1',
    'OFERTA 2': 'oferta2', 'OFERTA PACOTE': 'oferta2', 'OFERTA PACOTE COMPLETO': 'oferta2', 'OFERTA 2 PACOTE COMPLETO': 'oferta2', 'OFERTA 2 PACOTE': 'oferta2',
    'FAQ': 'faq', 'PERGUNTAS FREQUENTES': 'faq', 'DUVIDAS FREQUENTES': 'faq', 'CONTATO': 'contato', 'RODAPE': 'rodape', 'GARANTIAS': 'garantias', 'SELOS': 'garantias',
  };
  const SO_SECAO = new Set(['problemas', 'beneficios', 'amostras', 'pacote', 'mapas', 'depoimentos', 'ofertas', 'oferta1', 'oferta2', 'faq', 'contato', 'rodape', 'garantias']);   // aceitam "NOME:" sozinho na linha
  const NOMES = { concurso: 'Concurso', cargo: 'Cargo', titulo: 'Título', subtitulo: 'Subtítulo', problemas: 'Problemas', beneficios: 'Benefícios', amostras: 'Amostras do simulado', pacote: 'Pacote completo', mapas: 'Amostras dos mapas', depoimentos: 'Depoimentos', ofertas: 'Título das ofertas', oferta1: 'Oferta 1 (simulado)', oferta2: 'Oferta 2 (pacote)', faq: 'FAQ', contato: 'Contato', rodape: 'Rodapé', garantias: 'Garantias' };

  function cabecalho(linha) {
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
  const ITEM = /^(?:[-*•●▪]|\d{1,2}[.)])\s+(.*)$/;
  const SO_EMOJI = /^[\p{Extended_Pictographic}\uFE0F\u200d]{1,12}$/u;
  const resumo = (t) => (t.length > 50 ? t.slice(0, 47) + '…' : t);
  const ehLinkOuImagem = (t) => /https?:\/\/|www\.|!\[.*\]\(|\.(?:png|jpe?g|webp|gif)\b/i.test(t);

  // Lê "Chave: valor" (valor pode continuar nas linhas seguintes) e itens de lista ("- ..."). chaves = { NORMALIZADA: 'campo' }
  function blocos(linhas, chaves, av, secao) {
    const out = { campos: {}, itens: [], itensDeChave: {} };
    let atual = null, itemAtual = null, ignorando = false;
    linhas.forEach((raw) => {
      const l = raw.trim(); if (!l) { itemAtual = null; if (atual && !ignorando) atual.vazio = true; return; }
      const km = l.match(/^([A-Za-zÀ-ÿ ]{2,24}?)\s*:\s*(.*)$/); const k = km && norm(km[1]);
      if (km && (chaves[k] || k === 'LINK' || k === 'CHECKOUT' || k === 'URL' || k === 'WHATSAPP' || k === 'NUMERO')) {
        itemAtual = null; ignorando = false;
        if (!chaves[k]) { ignorando = true; av.push({ nivel: 'atencao', msg: NOMES[secao] + ': "' + km[1] + '" tem campo próprio (links e WhatsApp não são lidos do texto). Ignorei esta linha.' }); return; }
        atual = { campo: chaves[k], valor: km[2].trim(), lista: [] }; out.campos[atual.campo] = atual; return;
      }
      if (ignorando) return;
      const im = l.match(ITEM);
      if (im) { itemAtual = { texto: im[1].trim() }; if (atual && chaves._lista === atual.campo) atual.lista.push(itemAtual); else out.itens.push(itemAtual); return; }
      if (itemAtual) { itemAtual.texto += ' ' + l; return; }
      if (atual) { atual.valor += (atual.valor ? '\n' : '') + l; return; }
      out.itens.push({ texto: l, solto: true });
    });
    return out;
  }
  const campoTexto = (b, c) => (b.campos[c] ? b.campos[c].valor.trim() : undefined);

  function interpretarTexto(texto) {
    const avisos = [], encontradas = [], p = {}; const aten = (m) => avisos.push({ nivel: 'atencao', msg: m });
    const linhas = String(texto || '').replace(/\r\n?/g, '\n').split('\n');
    const secoes = []; let atual = null, pre = [];
    linhas.forEach((l) => { const c = cabecalho(l); if (c && c.chave) { atual = { chave: c.chave, linhas: [] }; secoes.push(atual); } else if (c && c.desconhecido) { aten('Seção desconhecida "' + resumo(c.desconhecido) + '": o conteúdo dela não foi usado.'); atual = { chave: null, linhas: [] }; } else if (atual) atual.linhas.push(l); else pre.push(l); });
    if (pre.join('').trim()) aten('Havia texto antes do primeiro marcador de seção; ele não foi usado.');
    if (!secoes.length) { avisos.unshift({ nivel: 'erro', msg: 'Não encontrei nenhum marcador de seção (ex.: [TITULO], [PROBLEMAS]). Use o modelo padrão (botão "Copiar modelo para o ChatGPT").' }); return { parcial: p, avisos, encontradas }; }
    const set = (obj, caminho, valor) => { let o = obj; for (let i = 0; i < caminho.length - 1; i++) o = o[caminho[i]] = o[caminho[i]] || {}; o[caminho[caminho.length - 1]] = valor; };
    const vistas = new Set();

    secoes.forEach((sec) => {
      if (!sec.chave) return; const k = sec.chave, corpo = sec.linhas.map((x) => x.replace(/\*\*|__/g, ''));
      if (vistas.has(k)) { aten('A seção ' + NOMES[k] + ' aparece mais de uma vez; usei a última.'); } vistas.add(k);
      const unico = corpo.map((x) => x.trim()).filter(Boolean).join('\n');
      if (['concurso', 'cargo', 'titulo', 'subtitulo', 'rodape'].includes(k)) {
        if (!unico) { aten(NOMES[k] + ': seção vazia (deixei em branco).'); return; }
        if (ehLinkOuImagem(unico)) aten(NOMES[k] + ': o texto parece conter link ou imagem; confira.');
        const alvo = { concurso: ['identificacao', 'concurso'], cargo: ['identificacao', 'cargo'], titulo: ['aparencia', 'titulo'], subtitulo: ['aparencia', 'subtitulo'], rodape: ['finalizacao', 'rodape'] }[k];
        set(p, alvo, unico.replace(/\n+/g, k === 'subtitulo' || k === 'rodape' ? ' ' : ' ')); encontradas.push(k); return;
      }
      if (k === 'problemas' || k === 'beneficios') {
        const b = blocos(corpo, k === 'problemas' ? { TITULO: 'titulo' } : { TITULO: 'titulo', TEXTO: 'texto' }, avisos, k);
        const itens = b.itens.map((it, i) => {
          if (it.solto) { aten(NOMES[k] + ': a linha "' + resumo(it.texto) + '" não está em formato de lista (use "- Título | Texto"); não foi usada.'); return null; }
          const partes = it.texto.split('|').map((x) => x.trim()); let icone = '', titulo = '', txt = '';
          if (k === 'problemas' && partes.length >= 3 && SO_EMOJI.test(partes[0])) { icone = partes[0]; titulo = partes[1]; txt = partes.slice(2).join(' | '); }
          else if (partes.length >= 2) { titulo = partes[0]; txt = partes.slice(1).join(' | '); if (k === 'problemas' && SO_EMOJI.test(titulo)) { icone = titulo; titulo = txt; txt = ''; aten('Problemas, item ' + (i + 1) + ': só encontrei ícone e título; sem texto.'); } }
          else { const cm = it.texto.match(/^(.{2,80}?)\s*[:–—]\s+(.+)$/); if (cm) { titulo = cm[1]; txt = cm[2]; aten(NOMES[k] + ', item ' + (i + 1) + ': separei título e texto no ":" (o padrão é "Título | Texto"). Confira.'); } else { titulo = it.texto; aten(NOMES[k] + ', item ' + (i + 1) + ': sem texto (só título "' + resumo(titulo) + '").'); } }
          if (k === 'problemas' && !icone) { const em = titulo.match(/^([\p{Extended_Pictographic}\uFE0F\u200d]+)\s*(.*)$/u); if (em) { icone = em[1]; titulo = em[2]; } }
          return k === 'problemas' ? { icone, titulo, texto: txt } : { titulo, texto: txt };
        }).filter(Boolean);
        const ap = k === 'problemas' ? ['apresentacao', 'problemas'] : ['apresentacao', 'beneficios'];
        const t = campoTexto(b, 'titulo'); if (t !== undefined) set(p, ap.concat('titulo'), t); if (k === 'beneficios') { const tx = campoTexto(b, 'texto'); if (tx !== undefined) set(p, ap.concat('texto'), tx); }
        if (itens.length) set(p, ap.concat('itens'), itens); else aten(NOMES[k] + ': não encontrei itens (use linhas "- Título | Texto").');
        encontradas.push(k); return;
      }
      if (k === 'amostras' || k === 'mapas' || k === 'depoimentos') {
        const b = blocos(corpo, { TITULO: 'titulo' }, avisos, k);
        const legendas = []; b.itens.forEach((it) => { if (it.solto) { aten(NOMES[k] + ': a linha "' + resumo(it.texto) + '" não está em formato de lista; não foi usada.'); return; } if (ehLinkOuImagem(it.texto)) { aten(NOMES[k] + ': "' + resumo(it.texto) + '" parece link/imagem; imagens têm campo próprio e não foram lidas.'); return; } legendas.push(it.texto.replace(/^(?:imagem|foto|print|amostra|depoimento)\s*\d+\s*[:\-–—]\s*/i, '')); });
        const t = campoTexto(b, 'titulo'); if (t !== undefined) set(p, [k, 'titulo'], t); if (legendas.length) set(p, [k, 'legendas'], legendas);
        encontradas.push(k); return;
      }
      if (k === 'pacote' || k === 'ofertas' || k === 'contato') {
        const mapa = k === 'pacote' ? { TITULO: 'titulo', TEXTO: 'texto' } : k === 'ofertas' ? { TITULO: 'titulo' } : { TITULO: 'titulo', TEXTO: 'texto', MENSAGEM: 'mensagem' };
        const b = blocos(corpo, mapa, avisos, k); let t = campoTexto(b, 'titulo'), tx = campoTexto(b, 'texto');
        if (t === undefined && tx === undefined && k !== 'contato' && b.itens.length) { const solto = b.itens.map((i) => i.texto); t = k === 'pacote' || k === 'ofertas' ? solto[0] : undefined; tx = k === 'pacote' ? solto.slice(1).join('\n') : undefined; aten(NOMES[k] + ': sem "Título:" e "Texto:"; usei a primeira linha como título' + (tx ? ' e o resto como texto' : '') + '. Confira.'); }
        if (k === 'pacote') { if (t !== undefined) set(p, ['pacote', 'titulo'], t); if (tx !== undefined) set(p, ['pacote', 'texto'], tx); }
        else if (k === 'ofertas') { if (t !== undefined) set(p, ['ofertas', 'titulo'], t); }
        else { if (t !== undefined) set(p, ['finalizacao', 'contato', 'titulo'], t); if (tx !== undefined) set(p, ['finalizacao', 'contato', 'texto'], tx); const ms = campoTexto(b, 'mensagem'); if (ms !== undefined) set(p, ['finalizacao', 'whatsapp', 'mensagem'], ms); if (b.itens.length && t === undefined && tx === undefined && campoTexto(b, 'mensagem') === undefined) aten('Contato: use "Título:", "Texto:" e "Mensagem:" (o número do WhatsApp tem campo próprio).'); }
        encontradas.push(k); return;
      }
      if (k === 'oferta1' || k === 'oferta2') {
        const mapa = { NOME: 'nome', PRECO: 'preco', DESCRICAO: 'descricao', BOTAO: 'botao', ITENS: 'itens', 'ITENS INCLUIDOS': 'itens', QUESTOES: 'questoes', 'QUANTIDADE DE QUESTOES': 'questoes', _lista: 'itens' };
        const b = blocos(corpo, mapa, avisos, k); const o = {};
        ['nome', 'preco', 'descricao', 'botao'].forEach((c) => { const v = campoTexto(b, c); if (v !== undefined) o[c] = v.replace(/\n+/g, c === 'descricao' ? '\n' : ' '); });
        const q = campoTexto(b, 'questoes'); if (q !== undefined) { if (k === 'oferta2') aten('Oferta 2: "Questões" só existe na oferta do simulado; ignorei.'); else { const n = parseInt(q.replace(/\D/g, ''), 10); if (Number.isInteger(n)) o.questoes = n; else aten('Oferta 1: não entendi a quantidade de questões "' + resumo(q) + '".'); } }
        const itens = (b.campos.itens ? b.campos.itens.lista.map((i) => i.texto) : []).concat(b.campos.itens && b.campos.itens.valor ? b.campos.itens.valor.split(/\n|;/).map((x) => x.trim()).filter(Boolean) : []);
        if (b.itens.length && !itens.length) b.itens.forEach((i) => { if (!i.solto) itens.push(i.texto); });
        if (itens.length) o.itens = itens;
        if (o.preco && !/\d/.test(o.preco)) aten(NOMES[k] + ': o preço "' + o.preco + '" não tem números; confira.');
        if (!Object.keys(o).length) aten(NOMES[k] + ': seção vazia ou sem campos reconhecidos (Nome:, Preço:, Descrição:, Itens:, Botão:).'); else set(p, ['ofertas', k === 'oferta1' ? 'simulado' : 'pacote'], o);
        encontradas.push(k); return;
      }
      if (k === 'faq') {
        const faq = []; let cur = null, titulo;
        corpo.forEach((raw) => { const l = raw.trim(); if (!l) return; const m = l.match(/^(?:[-*•]\s*)?(?:\d{1,2}[.)]\s*)?(P|Pergunta|Q)\s*[:.)]\s*(.*)$/i), r = l.match(/^(?:[-*•]\s*)?(R|Resposta|A)\s*[:.)]\s*(.*)$/i), tt = l.match(/^T[ií]tulo\s*:\s*(.*)$/i);
          if (tt) { titulo = tt[1].trim(); cur = null; return; }
          if (m) { cur = { pergunta: m[2].trim(), resposta: '', parte: 'p' }; faq.push(cur); return; }
          if (r && cur) { cur.resposta = r[2].trim(); cur.parte = 'r'; return; }
          const im = l.match(ITEM); if (im && im[1].includes('|')) { const [pg, ...rs] = im[1].split('|'); faq.push({ pergunta: pg.trim(), resposta: rs.join('|').trim(), parte: 'r' }); cur = null; return; }
          if (cur) { if (cur.parte === 'p') cur.pergunta += ' ' + l; else cur.resposta += (cur.resposta ? '\n' : '') + l; return; }
          aten('FAQ: a linha "' + resumo(l) + '" não está no formato "P: ..." / "R: ..."; não foi usada.'); });
        faq.forEach((f, i) => { if (!f.resposta) aten('FAQ, pergunta ' + (i + 1) + ' ("' + resumo(f.pergunta) + '"): sem resposta.'); delete f.parte; });
        if (titulo !== undefined) set(p, ['finalizacao', 'faqTitulo'], titulo); if (faq.length) set(p, ['finalizacao', 'faq'], faq); else aten('FAQ: não encontrei perguntas (use "P: ..." e "R: ...").');
        encontradas.push(k); return;
      }
      if (k === 'garantias') { const itens = corpo.map((l) => l.trim()).filter(Boolean).map((l) => (l.match(ITEM) || [0, l])[1].trim()).filter((x) => x && !ehLinkOuImagem(x)); if (itens.length) set(p, ['finalizacao', 'garantias'], itens); else aten('Garantias: seção vazia.'); encontradas.push(k); }
    });
    ['titulo', 'concurso', 'oferta1', 'oferta2'].forEach((k) => { if (!vistas.has(k)) avisos.push({ nivel: 'atencao', msg: 'Não encontrei a seção ' + NOMES[k] + ': deixei como está (preencha na etapa correspondente).' }); });
    return { parcial: p, avisos, encontradas };
  }

  // Aplica o texto interpretado sobre os dados atuais SEM perder imagens, links, cores nem WhatsApp:
  // textos das seções encontradas são substituídos; legendas entram na ordem das imagens que já existem.
  function aplicar(atual, p) {
    const d = normalizar(atual); p = p || {}; const tem = (v) => v !== undefined;
    if (p.identificacao) { if (tem(p.identificacao.concurso)) d.identificacao.concurso = p.identificacao.concurso; if (tem(p.identificacao.cargo)) d.identificacao.cargo = p.identificacao.cargo; }
    if (p.aparencia) { if (tem(p.aparencia.titulo)) d.aparencia.titulo = p.aparencia.titulo; if (tem(p.aparencia.subtitulo)) d.aparencia.subtitulo = p.aparencia.subtitulo; }
    const ap = p.apresentacao || {};
    if (ap.problemas) { if (tem(ap.problemas.titulo)) d.apresentacao.problemas.titulo = ap.problemas.titulo; if (ap.problemas.itens) d.apresentacao.problemas.itens = ap.problemas.itens; }
    if (ap.beneficios) { const b = d.apresentacao.beneficios; if (tem(ap.beneficios.titulo)) b.titulo = ap.beneficios.titulo; if (tem(ap.beneficios.texto)) b.texto = ap.beneficios.texto;
      if (ap.beneficios.itens) b.itens = ap.beneficios.itens.map((x, i) => ({ imagem: (b.itens[i] && b.itens[i].imagem) || { url: '', id: null }, titulo: x.titulo, texto: x.texto })).concat(b.itens.slice(ap.beneficios.itens.length)); }
    ['amostras', 'mapas', 'depoimentos'].forEach((k) => { const x = p[k]; if (!x) return; if (tem(x.titulo)) d[k].titulo = x.titulo;
      if (x.legendas) d[k].itens = x.legendas.map((leg, i) => ({ imagem: (d[k].itens[i] && d[k].itens[i].imagem) || { url: '', id: null }, legenda: leg })).concat(d[k].itens.slice(x.legendas.length)); });
    if (p.pacote) { if (tem(p.pacote.titulo)) d.pacote.titulo = p.pacote.titulo; if (tem(p.pacote.texto)) d.pacote.texto = p.pacote.texto; }
    if (p.ofertas) { if (tem(p.ofertas.titulo)) d.ofertas.titulo = p.ofertas.titulo; ['simulado', 'pacote'].forEach((k) => { if (p.ofertas[k]) Object.assign(d.ofertas[k], p.ofertas[k]); }); }
    const f = p.finalizacao || {}; if (tem(f.faqTitulo)) d.finalizacao.faqTitulo = f.faqTitulo; if (f.faq) d.finalizacao.faq = f.faq; if (f.garantias) d.finalizacao.garantias = f.garantias; if (tem(f.rodape)) d.finalizacao.rodape = f.rodape;
    if (f.contato) Object.assign(d.finalizacao.contato, f.contato); if (f.whatsapp && tem(f.whatsapp.mensagem)) d.finalizacao.whatsapp.mensagem = f.whatsapp.mensagem;
    return normalizar(d);
  }

  // Texto padrão a partir dos campos (volta e meia o painel usa para "alternar" entre modo rápido e manual sem perder nada)
  function gerarTexto(dados) {
    const d = normalizar(dados), L = []; const sec = (n, corpo) => { L.push('[' + n + ']'); if (corpo) L.push(corpo); L.push(''); };
    const kv = (k, v) => (v ? k + ': ' + v : k + ':'); const lista2 = (arr) => arr.map((x) => '- ' + x).join('\n');
    sec('CONCURSO', d.identificacao.concurso); sec('CARGO', d.identificacao.cargo); sec('TITULO', d.aparencia.titulo); sec('SUBTITULO', d.aparencia.subtitulo);
    sec('PROBLEMAS', [kv('Título', d.apresentacao.problemas.titulo)].concat(d.apresentacao.problemas.itens.map((i) => '- ' + (i.icone ? i.icone + ' | ' : '') + i.titulo + ' | ' + i.texto)).join('\n'));
    sec('BENEFICIOS', [kv('Título', d.apresentacao.beneficios.titulo), kv('Texto', d.apresentacao.beneficios.texto)].concat(d.apresentacao.beneficios.itens.map((i) => '- ' + i.titulo + ' | ' + i.texto)).join('\n'));
    sec('AMOSTRAS_SIMULADO', [kv('Título', d.amostras.titulo)].concat(d.amostras.itens.map((i) => '- ' + i.legenda)).join('\n'));
    sec('PACOTE_COMPLETO', [kv('Título', d.pacote.titulo), kv('Texto', d.pacote.texto)].join('\n'));
    sec('AMOSTRAS_MAPAS', [kv('Título', d.mapas.titulo)].concat(d.mapas.itens.map((i) => '- ' + i.legenda)).join('\n'));
    sec('DEPOIMENTOS', [kv('Título', d.depoimentos.titulo)].concat(d.depoimentos.itens.map((i) => '- ' + i.legenda)).join('\n'));
    sec('OFERTAS', kv('Título', d.ofertas.titulo));
    const of = (n, o, q) => sec(n, [kv('Nome', o.nome), kv('Preço', o.preco), kv('Descrição', o.descricao)].concat(q ? [kv('Questões', o.questoes == null ? '' : String(o.questoes))] : []).concat([kv('Botão', o.botao), 'Itens:', lista2(o.itens)]).filter((x) => x !== '').join('\n'));
    of('OFERTA_1_SIMULADO', d.ofertas.simulado, true); of('OFERTA_2_PACOTE_COMPLETO', d.ofertas.pacote, false);
    sec('FAQ', [kv('Título', d.finalizacao.faqTitulo)].concat(d.finalizacao.faq.map((f) => 'P: ' + f.pergunta + '\nR: ' + f.resposta)).join('\n'));
    sec('GARANTIAS', lista2(d.finalizacao.garantias)); sec('CONTATO', [kv('Título', d.finalizacao.contato.titulo), kv('Texto', d.finalizacao.contato.texto), kv('Mensagem', d.finalizacao.whatsapp.mensagem)].join('\n')); sec('RODAPE', d.finalizacao.rodape);
    return L.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }

  // Instrução para colar no ChatGPT (gera o texto no formato que o interpretador entende)
  function modeloChatGPT() {
    return `Você vai preparar o conteúdo de uma PÁGINA DE VENDAS de simulado de Informática para concursos.
Responda SOMENTE com o texto abaixo, preenchido, usando EXATAMENTE estes marcadores entre colchetes (cada um sozinho na linha) e o formato indicado.
Regras: não invente preço, quantidade de questões nem garantias; se não souber, deixe em branco. Não coloque links, URLs, números de WhatsApp nem imagens (eles são cadastrados em campos próprios). Texto simples, sem negrito.

[CONCURSO]
(nome do concurso)

[CARGO]
(cargo)

[TITULO]
(título principal da página)

[SUBTITULO]
(subtítulo)

[PROBLEMAS]
Título: (título da seção)
- 📚 | (título do problema) | (texto)
- ⏰ | (título do problema) | (texto)

[BENEFICIOS]
Título: (título da seção)
Texto: (texto de apresentação)
- (título do benefício) | (texto)
- (título do benefício) | (texto)

[AMOSTRAS_SIMULADO]
Título: (título da seção)
- (legenda da imagem 1)
- (legenda da imagem 2)

[PACOTE_COMPLETO]
Título: (título da seção)
Texto: (texto explicativo do pacote completo)

[AMOSTRAS_MAPAS]
Título: (título da seção)
- (legenda da imagem 1)

[DEPOIMENTOS]
Título: (título da seção)
- (legenda do depoimento 1)

[OFERTAS]
Título: (título da seção de escolha)

[OFERTA_1_SIMULADO]
Nome: (nome do produto)
Preço: (ex.: R$ 27,00)
Descrição: (descrição)
Questões: (quantidade)
Botão: (texto do botão)
Itens:
- (item incluído)

[OFERTA_2_PACOTE_COMPLETO]
Nome: (nome do produto)
Preço: (ex.: R$ 47,00)
Descrição: (descrição)
Botão: (texto do botão)
Itens:
- (item incluído)

[FAQ]
Título: (título da seção)
P: (pergunta)
R: (resposta)

[GARANTIAS]
- (garantia ou selo)

[CONTATO]
Título: (título da seção)
Texto: (texto)
Mensagem: (mensagem inicial do WhatsApp)

[RODAPE]
(texto do rodapé)
`;
  }

  return { MAX, MAX_JSON, UUID_REGEX, URL_REGEX, CORES, s, slugify, slugValido, padrao, normalizar, idsImagens, excedeLimites, validar, validarPublicacao, interpretarTexto, aplicar, gerarTexto, modeloChatGPT, NOMES };
});
