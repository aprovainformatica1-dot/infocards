/* Regras e interpretador dos DESAFIOS — um único arquivo usado pelo painel (navegador) e pela API (servidor).
   Independente do Painel de Dicas. Não tem segredo. Não usa IA e NÃO inventa texto: reconhece o que é claro e AVISA o resto.

   Conteúdo de um desafio:  { q: [ { t, e, a, g, x, m } ], cards: [ { m, l } ] }
     q.t  'me' (múltipla escolha) | 'ce' (Certo/Errado)      q.e enunciado
     q.a  alternativas (só 'me', de 2 a 5, A–E)               q.g gabarito: índice da alternativa; em 'ce': 0 = Certo, 1 = Errado
     q.x  comentário (obrigatório)                            q.m "Para memorizar" (opcional)
   cards: materiais da Central de Ofertas — m = id da oferta, l = id do link escolhido */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.DesafioRegras = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const MAX_Q = 20, MIN_ALT = 2, MAX_ALT = 5, MAX_CARDS = 6, MAX_JSON = 200000;
  const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const s = (v) => (typeof v === 'string' ? v.trim() : '');

  function slugify(v) {
    return s(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/, '');
  }
  const slugValido = (v) => typeof v === 'string' && v.length >= 3 && v.length <= 80 && SLUG_REGEX.test(v);

  // Converte qualquer entrada na forma { q, cards }. Nunca lança erro e nunca inventa texto.
  function normalizar(c) {
    c = c && typeof c === 'object' ? c : {};
    const q = (Array.isArray(c.q) ? c.q : []).slice(0, MAX_Q).map((x) => {
      x = x || {}; const t = x.t === 'ce' ? 'ce' : 'me';
      return { t, e: s(x.e), a: t === 'me' ? (Array.isArray(x.a) ? x.a : []).slice(0, MAX_ALT).map(s) : [], g: Number.isInteger(x.g) && x.g >= 0 && x.g < MAX_ALT ? x.g : -1, x: s(x.x), m: s(x.m) };
    });
    const cards = (Array.isArray(c.cards) ? c.cards : []).filter((k) => k && typeof k.m === 'string' && typeof k.l === 'string' && UUID_REGEX.test(k.m) && UUID_REGEX.test(k.l))
      .slice(0, MAX_CARDS).map((k) => ({ m: k.m.toLowerCase(), l: k.l.toLowerCase() }));
    return { q, cards };
  }
  // true se o conteúdo bruto passa dos limites (a API recusa em vez de cortar em silêncio)
  const excedeLimites = (c) => !!c && ((Array.isArray(c.q) && c.q.length > MAX_Q) || (Array.isArray(c.cards) && c.cards.length > MAX_CARDS) || (Array.isArray(c.q) && c.q.some((x) => x && Array.isArray(x.a) && x.a.length > MAX_ALT)));

  // Problemas que IMPEDEM a publicação (lista vazia = pode publicar)
  function validar(titulo, conteudo) {
    const c = normalizar(conteudo), erros = [];
    if (!s(titulo)) erros.push('Falta o título.');
    if (!c.q.length) erros.push('Cole e interprete as questões: o desafio precisa de pelo menos 1.');
    c.q.forEach((q, i) => {
      const n = 'Questão ' + (i + 1) + ': ';
      if (!q.e) erros.push(n + 'falta o enunciado.');
      if (q.t === 'me') {
        if (q.a.length < MIN_ALT || q.a.length > MAX_ALT || q.a.some((a) => !a)) erros.push(n + 'precisa de ' + MIN_ALT + ' a ' + MAX_ALT + ' alternativas preenchidas (agora há ' + q.a.length + ').');
        if (!(q.g >= 0 && q.g < q.a.length)) erros.push(n + 'escolha qual alternativa é a correta (gabarito).');
      } else if (!(q.g === 0 || q.g === 1)) erros.push(n + 'escolha o gabarito: Certo ou Errado.');
      if (!q.x) erros.push(n + 'falta o comentário.');
    });
    return erros;
  }

  // ------------------------------------------------------------------ interpretador de questões
  const PICT = '[\\p{Extended_Pictographic}\\uFE0F\\u200d\\s]*';
  const LAB = (nomes) => new RegExp('^' + PICT + '(?:' + nomes + ')\\b\\s*[:：\\-–—]?\\s*(.*)$', 'iu');
  const L_ENUN = new RegExp('^' + PICT + '(?:enunciado|pergunta)\\s*[:：\\-–—]\\s*(.*)$', 'iu');
  const L_GAB = LAB('gabarito|resposta(?:\\s+correta)?|alternativa\\s+correta');
  const L_COM = LAB('coment[aá]rio(?:\\s+da\\s+quest[aã]o)?|explica[cç][aã]o|justificativa');
  const L_MEM = LAB('para\\s+memorizar|memorizar|macete|dica\\s+de\\s+memoriza[cç][aã]o');
  const ALT = /^\(?([A-Ea-e])\s*[)\.\-–—:]\s*(.+)$/u;
  const INI_Q = /^(?:quest[aã]o|q)\s*\.?\s*(\d+)\s*[:.)\-–—]?\s*(.*)$/iu;
  const INI_NUM = /^(\d{1,2})\s*[.)\-–—]\s+(.+)$/u;

  const limpar = (t) => String(t || '').replace(/\r\n?/g, '\n').replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\u00a0/g, ' ').replace(/\t/g, ' ');
  const semMarkdown = (l) => l.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*>\s?/, '').replace(/\*\*|__/g, '').replace(/(^|\s)\*(\S(?:[^*]*\S)?)\*(?=\s|$)/g, '$1$2')
    .replace(/^\s*[-*•●▪◦‣]\s+/, '').replace(/^\s*[-–—_*]{3,}\s*$/, '').replace(/[ ]+/g, ' ').trim();
  const resumo = (t) => (t.length > 50 ? t.slice(0, 47) + '…' : t);

  // Lê o valor do gabarito. Devolve { letra | ambiguo | palavra, resto } ou null.
  //   letra A, B, D  -> alternativa;  ambiguo C, E -> letra (com alternativas) ou Certo/Errado (sem);  palavra CERTO/ERRADO -> Certo/Errado
  //   resto = texto que veio depois do gabarito na mesma linha (nunca é aproveitado sem avisar)
  function lerGabarito(v) {
    const t = s(v).replace(/^[\s(]+/, ''); if (!t) return null;
    const limpaResto = (x) => x.replace(/^[\s.:;,\-–—)]+/, '');
    let m = t.match(/^(?:ALTERNATIVA\s+|LETRA\s+)?([A-E])\)?(?![A-Za-zÀ-ÿ0-9])/i);
    if (m) { const L = m[1].toUpperCase(); return Object.assign((L === 'C' || L === 'E') ? { ambiguo: L } : { letra: L }, { resto: limpaResto(t.slice(m[0].length)) }); }
    m = t.match(/^(CERTO|CERTA|ERRADO|ERRADA)(?![A-Za-zÀ-ÿ])/i);
    if (m) return { palavra: m[1][0].toUpperCase() === 'C' ? 'C' : 'E', resto: limpaResto(t.slice(m[0].length)) };
    return null;
  }

  function lerQuestao(linhas, n, av) {
    const erro = (m) => av.push({ nivel: 'erro', msg: 'Questão ' + n + ': ' + m });
    const aten = (m) => av.push({ nivel: 'atencao', msg: 'Questão ' + n + ': ' + m });
    let enun = [], alts = [], gabTexto = '', com = [], mem = [], modo = 'enun', esperaGab = false, resto = '';
    linhas.forEach((l0, i) => {
      let l = l0;
      if (i === 0) { const m = l.match(INI_Q) || l.match(INI_NUM); if (m && !L_ENUN.test(l)) l = (m[2] || '').trim(); }
      if (!l) return;
      if (esperaGab) { esperaGab = false; if (!L_GAB.test(l) && !L_COM.test(l) && !L_MEM.test(l)) { gabTexto = l; return; } }
      let m;
      if ((m = l.match(L_ENUN))) { modo = 'enun'; if (m[1]) enun.push(m[1]); return; }
      if ((m = l.match(L_GAB))) {
        if (gabTexto) erro('há mais de um gabarito.');
        gabTexto = m[1].trim(); modo = 'gab'; if (!gabTexto) esperaGab = true;
        const g = lerGabarito(gabTexto); if (g && g.resto) resto = g.resto;
        return;
      }
      if ((m = l.match(L_COM))) { modo = 'com'; if (m[1]) com.push(m[1]); return; }
      if ((m = l.match(L_MEM))) { modo = 'mem'; if (m[1]) mem.push(m[1]); return; }
      const am = l.match(ALT);
      if (am && (modo === 'enun' || modo === 'alt')) { alts.push({ letra: am[1].toUpperCase(), texto: am[2].trim() }); modo = 'alt'; return; }
      if (modo === 'enun') enun.push(l);
      else if (modo === 'alt') { alts[alts.length - 1].texto += ' ' + l; aten('a linha "' + resumo(l) + '" foi anexada à alternativa ' + alts[alts.length - 1].letra + '. Confira.'); }
      else if (modo === 'com') com.push(l);
      else if (modo === 'mem') mem.push(l);
      else if (modo === 'gab') { com.push(l); modo = 'com'; aten('tratei o texto depois do gabarito como comentário (faltou o rótulo "COMENTÁRIO:"). Confira.'); }
    });
    if (resto) { com.unshift(resto); aten('havia texto junto do gabarito; usei como início do comentário. Confira.'); }

    const q = { t: 'me', e: enun.join('\n').trim(), a: [], g: -1, x: com.join('\n').trim(), m: mem.join('\n').trim() };
    if (!q.e) erro('não identifiquei o enunciado.');
    if (alts.length === 1) erro('encontrei só 1 alternativa; use de ' + MIN_ALT + ' a ' + MAX_ALT + ' (A–E) ou nenhuma (Certo/Errado).');
    if (alts.length > MAX_ALT) erro('encontrei ' + alts.length + ' alternativas; o máximo é ' + MAX_ALT + '.');
    const g = lerGabarito(gabTexto);
    if (alts.length >= MIN_ALT) {
      q.a = alts.map((a) => a.texto).slice(0, MAX_ALT);
      if (alts.some((a, k) => a.letra !== 'ABCDE'[k])) aten('as letras das alternativas não estão em sequência (A, B, C…). Confira.');
      if (!g) erro(gabTexto ? 'não entendi o gabarito "' + resumo(gabTexto) + '" (use uma letra de A a E).' : 'não identifiquei o gabarito (ex.: "GABARITO: C").');
      else if (g.palavra) erro('a questão tem alternativas, mas o gabarito diz "' + (g.palavra === 'C' ? 'CERTO' : 'ERRADO') + '". Use a letra da alternativa correta.');
      else { const letra = g.letra || g.ambiguo, idx = alts.findIndex((a) => a.letra === letra); if (idx < 0) erro('o gabarito ' + letra + ' não corresponde a nenhuma alternativa.'); else q.g = idx; }
    } else if (alts.length === 0) {
      q.t = 'ce';
      if (!g) erro(gabTexto ? 'não entendi o gabarito "' + resumo(gabTexto) + '" (use CERTO ou ERRADO).' : 'não identifiquei o gabarito (use "GABARITO: CERTO" ou "GABARITO: ERRADO").');
      else if (g.letra) erro('sem alternativas a questão é Certo/Errado, mas o gabarito diz "' + g.letra + '". Use CERTO ou ERRADO (ou adicione as alternativas).');
      else q.g = (g.palavra || g.ambiguo) === 'C' ? 0 : 1;
    }
    if (!q.x) erro('não encontrei o comentário (ex.: "COMENTÁRIO: ..."). Escreva no editor; o sistema não inventa comentários.');
    return q;
  }

  function interpretar(texto) {
    const avisos = [], nao = [];
    const linhas = limpar(texto).split('\n').map(semMarkdown).filter(Boolean);
    if (!linhas.length) return { q: [], avisos: [{ nivel: 'erro', msg: 'Cole as questões primeiro.' }], nao };
    // onde começa cada questão: pelo rótulo ENUNCIADO: (formato do gerador antigo) ou pela numeração
    let inicios = linhas.map((l, i) => (L_ENUN.test(l) ? i : -1)).filter((i) => i >= 0);
    if (inicios.length) inicios = inicios.map((i) => { let k = i; while (k > 0 && (INI_Q.exec(linhas[k - 1]) || [])[2] === '' ) k--; return k; });
    else inicios = linhas.map((l, i) => (INI_Q.test(l) || INI_NUM.test(l) ? i : -1)).filter((i) => i >= 0);
    if (!inicios.length) {
      if (linhas.filter((l) => L_GAB.test(l)).length > 1) return { q: [], avisos: [{ nivel: 'erro', msg: 'Não consegui separar as questões. Comece cada uma com "ENUNCIADO:" ou numere (Questão 1, Questão 2…).' }], nao };
      inicios = [0]; avisos.push({ nivel: 'atencao', msg: 'Não encontrei "ENUNCIADO:" nem numeração; tratei o texto todo como UMA questão.' });
    }
    if (inicios[0] > 0) nao.push({ texto: linhas.slice(0, inicios[0]).join('\n'), motivo: 'Texto antes da primeira questão (não usado).' });
    const q = [];
    inicios.forEach((ini, k) => q.push(lerQuestao(linhas.slice(ini, k + 1 < inicios.length ? inicios[k + 1] : linhas.length), k + 1, avisos)));
    if (q.length > MAX_Q) avisos.push({ nivel: 'erro', msg: 'Encontrei ' + q.length + ' questões; o máximo é ' + MAX_Q + '.' });
    else if (q.length !== 5) avisos.push({ nivel: 'atencao', msg: 'Encontrei ' + q.length + (q.length === 1 ? ' questão' : ' questões') + '. Os desafios costumam ter 5; se for isso mesmo, pode seguir.' });
    if (nao.length) avisos.push({ nivel: 'atencao', msg: nao.length + (nao.length === 1 ? ' trecho não foi aproveitado' : ' trechos não foram aproveitados') + '. Veja abaixo.' });
    return { q: q.slice(0, MAX_Q), avisos, nao };
  }

  return { MAX_Q, MIN_ALT, MAX_ALT, MAX_CARDS, MAX_JSON, UUID_REGEX, s, slugify, slugValido, normalizar, excedeLimites, validar, interpretar };
});
