/* Interpretador do texto cru da Dica — roda no navegador, não grava nada, NÃO usa IA e NÃO inventa texto.
   Reconhece o que é claro e AVISA o que não é:
     - avisos nivel "erro"    -> falta algo obrigatório (você corrige no editor antes de publicar)
     - avisos nivel "atencao" -> o sistema deduziu algo; confira
     - "nao" (não aproveitados) -> trechos que não deu para classificar: você decide o que fazer
   Pistas reconhecidas (todas opcionais e tolerantes a negrito/markdown/emoji):
     Tópico:        "HTTP: explicação"  |  "HTTP — explicação"  |  nome numa linha e explicação nas seguintes
     Memorização:   linha com 🧠, "Para memorizar", "Memorização", "Macete", "Mnemônico"
     Frase final:   "Frase final: ..."
     Questão:       "Questão 1" / "1)" / "1." + alternativas A) B) C) + "Gabarito: B" + "Comentário: ..." */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.DicaInterpretador = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const PICT = '[\\p{Extended_Pictographic}\\uFE0F\\u200d\\s]*';
  const MEMO_RE = new RegExp('^' + PICT + '(?:para\\s+memorizar|memoriza[cç][aã]o|memorize|macete|mnem[ôo]nico|dica\\s+de\\s+memoriza[cç][aã]o|como\\s+memorizar)\\s*[:\\-–—]?\\s*(.*)$', 'iu');
  const ALT_RE = /^\(?([A-Ea-e])\s*[)\.\-–—:]\s*(.+)$/u;
  const SPLIT_RE = /^(.{1,50}?)(?::\s+|\s+[—–-]\s+)(.+)$/u;
  const FRASE_RE = /^frase\s+final\s*[:\-–—]\s*(.+)$/i;
  const INI_Q = /^(?:quest[aã]o|pergunta|q)\s*\.?\s*(\d+)\s*[:.)\-–—]?\s*(.*)$/iu;
  const INI_NUM = /^(\d{1,2})\s*[.)\-–—]\s+(.+)$/u;
  const GAB_RE = new RegExp('^' + PICT + '(?:gabarito|resposta(?:\\s+correta)?|alternativa\\s+correta|correta)\\s*[:\\-–—]?\\s*\\(?([A-Ea-e])\\)?(?![A-Za-zÀ-ÿ])\\s*[).\\-–—:]?\\s*(.*)$', 'iu');
  const COM_RE = new RegExp('^' + PICT + '(?:coment[aá]rio(?:\\s+da\\s+quest[aã]o)?|explica[cç][aã]o|justificativa|resolu[cç][aã]o)\\s*[:\\-–—]?\\s*(.*)$', 'iu');
  const MARCA_INI = /^(?:✅|✔️?|☑️?)\s*/u;
  const MARCA_FIM = /\s*(?:✅|✔️?|☑️?|\((?:correta|certa)\))\s*$/iu;

  function limparTexto(t) {
    return String(t || '').replace(/\r\n?/g, '\n').replace(/[\u200b\u200c\u200d\ufeff]/g, '').replace(/\u00a0/g, ' ').replace(/\t/g, ' ');
  }
  // tira marcações do ChatGPT (#, >, **, __, marcadores) sem mexer no texto
  function semMarkdown(l) {
    return l.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*>\s?/, '').replace(/\*\*|__/g, '')
      .replace(/(^|\s)\*(\S(?:[^*]*\S)?)\*(?=\s|$)/g, '$1$2')
      .replace(/^\s*[-*•●▪◦‣]\s+/, '').replace(/^\s*[-–—_*]{3,}\s*$/, '').replace(/\s+/g, ' ').trim();
  }
  const linhasDe = (t) => limparTexto(t).split('\n').map(semMarkdown);
  const blocosDe = (t) => limparTexto(t).split(/\n\s*\n/).map((b) => b.split('\n').map(semMarkdown).filter(Boolean)).filter((b) => b.length);

  function memoLinha(l) {
    const m = l.match(MEMO_RE);
    if (m) return { texto: m[1].trim() };
    if (/^🧠/u.test(l)) return { texto: l.replace(/^🧠\uFE0F?\s*/u, '').trim() };
    return null;
  }
  function separar(l) {
    const m = l.match(SPLIT_RE);
    if (!m) return null;
    const n = m[1].trim();
    if (!n || n.split(/\s+/).length > 6 || /[.!?]$/.test(n)) return null;
    return [n, m[2].trim()];
  }
  const limparNome = (n) => n.replace(/^[\p{Extended_Pictographic}\uFE0F\u200d\s]+/u, '').replace(/^\d+\s*[.)\-–—]\s*/, '').replace(/\s*:\s*$/, '').trim();
  const resumo = (t) => (t.length > 60 ? t.slice(0, 57) + '…' : t);

  // ------------------------------------------------------------------ tópicos
  function interpretarTopicos(texto) {
    const avisos = [], nao = [], cards = [];
    let f = '', ultimo = null;
    blocosDe(texto).forEach((linhas) => {
      if (linhas.filter((l) => ALT_RE.test(l)).length >= 2) {
        nao.push({ texto: linhas.join('\n'), motivo: 'Parece uma questão. Cole as questões no campo "Questões extras".' }); return;
      }
      if (linhas.length === 1 && FRASE_RE.test(linhas[0])) {
        const v = linhas[0].match(FRASE_RE)[1].trim();
        if (f) nao.push({ texto: linhas[0], motivo: 'Já existe uma frase final; esta ficou de fora.' }); else f = v;
        return;
      }
      const normais = linhas.filter((l) => !memoLinha(l));
      const todasSplit = normais.length >= 2 && normais.every((l) => separar(l));
      const doBloco = []; let curr = null, esperaMemo = null;
      const pendurar = (alvo, txt, linha) => {
        if (!alvo) { nao.push({ texto: linha, motivo: 'Memorização sem tópico para ligar.' }); return; }
        if (alvo.m) { nao.push({ texto: linha, motivo: 'O tópico "' + resumo(alvo.n) + '" já tem uma memorização; esta sobrou.' }); return; }
        alvo.m = txt;
      };
      linhas.forEach((l) => {
        if (esperaMemo) { const alvo = esperaMemo; esperaMemo = null; if (!memoLinha(l)) return pendurar(alvo, l, l); }
        const mm = memoLinha(l);
        if (mm) {
          const alvo = curr || ultimo;
          if (mm.texto) pendurar(alvo, mm.texto, l); else if (alvo) esperaMemo = alvo; else nao.push({ texto: l, motivo: 'Memorização sem tópico para ligar.' });
          return;
        }
        const sp = separar(l);
        if (!curr || (todasSplit && sp)) {
          curr = { n: sp ? sp[0] : l, e: sp ? sp[1] : '', m: '' }; doBloco.push(curr);
        } else curr.e = curr.e ? curr.e + '\n' + l : l;
      });
      doBloco.forEach((t) => {
        t.n = limparNome(t.n);
        if (!t.e || !t.n) {
          nao.push({ texto: t.n + (t.m ? '\n🧠 ' + t.m : ''), motivo: 'Linha sem explicação (pode ser um título ou uma introdução).' }); return;
        }
        cards.push({ itens: [t] }); ultimo = t;
      });
    });
    const vistos = new Map();
    cards.forEach((c, i) => {
      const t = c.itens[0], chave = t.n.toLowerCase();
      if (t.n.length > 60 || /[.!?]$/.test(t.n) || t.n.split(/\s+/).length > 8) avisos.push({ nivel: 'atencao', msg: 'Tópico ' + (i + 1) + ': o nome "' + resumo(t.n) + '" parece uma frase. Confira onde termina o nome e começa a explicação.' });
      if (vistos.has(chave)) avisos.push({ nivel: 'atencao', msg: 'O tópico "' + t.n + '" aparece mais de uma vez (cards ' + vistos.get(chave) + ' e ' + (i + 1) + ').' });
      else vistos.set(chave, i + 1);
    });
    if (!cards.length) avisos.push({ nivel: 'erro', msg: 'Não identifiquei nenhum tópico. Cada tópico precisa de um nome e uma explicação (ex.: "HTTP: protocolo da Web").' });
    if (nao.length) avisos.push({ nivel: 'atencao', msg: nao.length + (nao.length === 1 ? ' trecho não foi aproveitado' : ' trechos não foram aproveitados') + '. Veja abaixo e decida o que fazer.' });
    return { cards, f, avisos, nao };
  }

  // ------------------------------------------------------------------ questões
  function interpretarQuestoes(texto) {
    const avisos = [], q = [];
    const linhas = linhasDe(texto).filter((l) => l);
    if (!linhas.length) return { q, avisos };
    const chunks = [];
    linhas.forEach((l) => {
      const ini = INI_Q.test(l) || INI_NUM.test(l);
      if (ini || !chunks.length) chunks.push([]);
      chunks[chunks.length - 1].push(l);
    });
    if (!linhas.some((l) => INI_Q.test(l) || INI_NUM.test(l)) && linhas.some((l) => ALT_RE.test(l))) {
      avisos.push({ nivel: 'atencao', msg: 'Não encontrei numeração ("Questão 1", "1)"). Tratei todo o texto como UMA questão.' });
    }
    chunks.forEach((chunk, qi) => {
      const rot = 'Questão ' + (qi + 1) + ': ';
      const av = (nivel, msg) => avisos.push({ nivel, msg: rot + msg });
      let enun = [], alts = [], com = [], memo = [], gab = '', modo = 'enun', comImplicito = false, memoVazio = false;
      chunk.forEach((l0, i) => {
        let l = l0;
        if (i === 0) { const m = l.match(INI_Q) || l.match(INI_NUM); if (m) l = (m[2] || '').trim(); if (!l) return; }
        let g;
        if (memoVazio) { memoVazio = false; if (!memoLinha(l)) { memo.push(l); return; } }
        const mm = memoLinha(l);
        if (mm) { modo = 'memo'; if (mm.texto) memo.push(mm.texto); else memoVazio = true; return; }
        if ((g = l.match(GAB_RE))) {
          if (gab && gab !== g[1].toUpperCase()) av('erro', 'há mais de um gabarito diferente (' + gab + ' e ' + g[1].toUpperCase() + ').');
          gab = g[1].toUpperCase(); modo = 'gab';
          const resto = (g[2] || '').trim();
          if (resto) { com.push(resto.replace(/^coment[aá]rio\s*[:\-–—]?\s*/i, '')); modo = 'com'; comImplicito = true; }
          return;
        }
        if (COM_RE.test(l)) { modo = 'com'; comImplicito = false; const t = l.match(COM_RE)[1].trim(); if (t) com.push(t); return; }
        const marcada = MARCA_INI.test(l) || MARCA_FIM.test(l);
        const am = l.replace(MARCA_INI, '').match(ALT_RE);
        if (am && (modo === 'enun' || modo === 'alt')) {
          alts.push({ letra: am[1].toUpperCase(), texto: am[2].replace(MARCA_FIM, '').trim(), marcada }); modo = 'alt'; return;
        }
        if (modo === 'enun') enun.push(l);
        else if (modo === 'alt') { alts[alts.length - 1].texto += ' ' + l; av('atencao', 'a linha "' + resumo(l) + '" foi anexada à alternativa ' + alts[alts.length - 1].letra + '. Confira.'); }
        else if (modo === 'gab' || modo === 'com') { if (modo === 'gab') { modo = 'com'; comImplicito = true; } com.push(l); }
        else if (modo === 'memo') memo.push(l);
      });
      if (comImplicito && com.length) av('atencao', 'tratei o texto depois do gabarito como comentário (não havia o rótulo "Comentário:"). Confira.');
      const marcadas = alts.filter((a) => a.marcada).map((a) => a.letra);
      if (marcadas.length > 1) av('erro', 'mais de uma alternativa marcada como correta.');
      if (gab && marcadas.length === 1 && marcadas[0] !== gab) av('erro', 'o gabarito diz ' + gab + ' mas a alternativa marcada é ' + marcadas[0] + '.');
      const letra = gab || (marcadas.length === 1 ? marcadas[0] : '');
      let c = -1;
      if (!letra) av('erro', 'não identifiquei o gabarito (ex.: "Gabarito: B"). Escolha a alternativa correta no editor.');
      else { c = alts.findIndex((a) => a.letra === letra); if (c < 0) av('erro', 'o gabarito ' + letra + ' não corresponde a nenhuma alternativa.'); }
      if (!enun.length) av('erro', 'não identifiquei o enunciado.');
      if (alts.length !== 3) av('erro', 'encontrei ' + alts.length + ' alternativas; a Dica usa exatamente 3. Ajuste no editor.');
      if (alts.some((a, k) => a.letra !== 'ABCDE'[k])) av('atencao', 'as letras das alternativas não estão em sequência (A, B, C…). Confira.');
      if (!com.length) av('erro', 'não encontrei o comentário (ex.: "Comentário: ..."). Escreva no editor; o sistema não inventa comentários.');
      q.push({ e: enun.join('\n'), a: alts.map((a) => a.texto), c, x: com.join('\n'), m: memo.join('\n') });
    });
    return { q, avisos };
  }

  function interpretar({ topicos, questoes }) {
    const t = interpretarTopicos(topicos), z = interpretarQuestoes(questoes);
    return { cards: t.cards, f: t.f, q: z.q, avisos: t.avisos.concat(z.avisos), nao: t.nao };
  }
  return { interpretar, interpretarTopicos, interpretarQuestoes };
});
