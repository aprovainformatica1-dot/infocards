/* Regras da Dica — UM ÚNICO ARQUIVO usado pelo painel (navegador) e pela API (servidor).
   Não tem segredo nenhum. Mantém as mesmas regras do Gerador de Dicas antigo (lerEstruturado):
   card com 1 ou 2 itens; questão com exatamente 3 alternativas, 1 correta e comentário. */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.DicaRegras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const MIN_Q = 3, MAX_Q = 4;                 // quando houver questões extras
  const MAX_CARDS = 60, MAX_QUESTOES = 10, MAX_ALTS = 6, MAX_OFERTAS = 30;
  const MAX_JSON = 200000;                    // tamanho máximo do conteúdo salvo
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const OFERTA_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const s = (v) => (typeof v === 'string' ? v.trim() : '');

  function slugify(v) {
    return s(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
  }
  const slugValido = (v) => typeof v === 'string' && v.length >= 3 && v.length <= 80 && SLUG_REGEX.test(v);

  // Converte qualquer entrada na forma {f, o, itens, q}. Nunca lança erro, nunca inventa texto.
  // Rascunhos podem ficar incompletos; a checagem de "pode publicar" é feita em validar().
  function normalizar(c) {
    c = c && typeof c === 'object' ? c : {};
    const itens = (Array.isArray(c.itens) ? c.itens : []).slice(0, MAX_CARDS).map((g) => ({
      itens: (g && Array.isArray(g.itens) ? g.itens : []).slice(0, 4).map((x) => ({ n: s(x && x.n), e: s(x && x.e), m: s(x && x.m) })),
    }));
    const q = (Array.isArray(c.q) ? c.q : []).slice(0, MAX_QUESTOES).map((x) => ({
      e: s(x && x.e),
      a: (x && Array.isArray(x.a) ? x.a : []).slice(0, MAX_ALTS).map(s),
      c: x && Number.isInteger(x.c) && x.c >= 0 && x.c < MAX_ALTS ? x.c : -1,
      x: s(x && x.x),
      m: s(x && x.m),
    }));
    const o = (Array.isArray(c.o) ? c.o : []).filter((id) => typeof id === 'string' && OFERTA_REGEX.test(id)).slice(0, MAX_OFERTAS);
    return { f: s(c.f), o: [...new Set(o)], itens, q };
  }

  // Lista de problemas que IMPEDEM a publicação (vazia = pode publicar).
  function validar(titulo, conteudo) {
    const c = normalizar(conteudo), erros = [];
    if (!s(titulo)) erros.push('Falta o título.');
    if (!c.itens.length) erros.push('É preciso ter pelo menos 1 card de tópicos.');
    c.itens.forEach((g, i) => {
      const n = 'Card ' + (i + 1) + ': ';
      if (!g.itens.length) return erros.push(n + 'precisa ter 1 ou 2 tópicos.');
      if (g.itens.length > 2) return erros.push(n + 'no máximo 2 tópicos por card (tem ' + g.itens.length + ').');
      g.itens.forEach((x, k) => {
        if (!x.n) erros.push(n + 'tópico ' + (k + 1) + ': falta o nome.');
        if (!x.e) erros.push(n + 'tópico ' + (k + 1) + ': falta a explicação.');
      });
    });
    if (c.q.length && (c.q.length < MIN_Q || c.q.length > MAX_Q)) {
      erros.push('As questões extras precisam ser de ' + MIN_Q + ' a ' + MAX_Q + ' (agora há ' + c.q.length + '). Para não ter questões, deixe esse campo vazio.');
    }
    c.q.forEach((q, i) => {
      const n = 'Questão ' + (i + 1) + ': ';
      if (!q.e) erros.push(n + 'falta o enunciado.');
      if (q.a.length !== 3 || q.a.some((v) => !v)) erros.push(n + 'precisa ter exatamente 3 alternativas preenchidas (agora há ' + q.a.length + ').');
      if (!(q.c >= 0 && q.c <= 2) || q.c >= q.a.length) erros.push(n + 'escolha qual alternativa é a correta.');
      if (!q.x) erros.push(n + 'falta o comentário.');
    });
    return erros;
  }

  return { MIN_Q, MAX_Q, MAX_JSON, SLUG_REGEX, UUID_REGEX, OFERTA_REGEX, s, slugify, slugValido, normalizar, validar };
});
