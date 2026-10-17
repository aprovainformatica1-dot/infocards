/* DevMapas — cliente das ofertas da Central de Ofertas (independente do config/ofertas.js, que não é usado aqui).
   Usado pelo Painel de Dicas e pelas dicas publicadas.
   Lê GET /api/ofertas (público, só o que está no ar). Não tem chave nem segredo.

   Uma "seleção" é { m: id do material, t: id do texto, l: id do link } — os três escolhidos separadamente.

   API:  DevMapasOfertas.carregar()                   -> Promise<lista de materiais no ar>
         DevMapasOfertas.disponiveis(lista)           -> só materiais com ao menos 1 texto e 1 link
         DevMapasOfertas.achar(lista, sel)            -> { material, texto, link } ou null (se algo foi pausado/excluído)
         DevMapasOfertas.paraLegado(achado, opcoes)   -> objeto do card (capa, título, texto, botão, link, estilo); sem preço nem nomes internos
         DevMapasOfertas.resolver(lista, selecoes)    -> lista de objetos no formato legado, ignorando seleções que não valem mais
         DevMapasOfertas.montarSeletor(el, lista, sel, aoMudar) -> cria os 3 menus (Material / Texto / Link) */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.DevMapasOfertas = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  const URL_API = '/api/ofertas';
  const escHtml = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  async function carregar() {
    const resp = await fetch(URL_API, { headers: { Accept: 'application/json' } });
    const dados = await resp.json().catch(() => null);
    if (!resp.ok || !dados || dados.ok !== true || !Array.isArray(dados.materiais)) throw new Error('ofertas_indisponiveis');
    return dados.materiais;
  }
  const disponiveis = (lista) => (lista || []).filter((m) => m.textos && m.textos.length && m.links && m.links.length);

  function achar(lista, sel) {
    if (!sel) return null;
    const material = (lista || []).find((m) => m.id === sel.m); if (!material) return null;
    const texto = material.textos.find((t) => t.id === sel.t), link = material.links.find((l) => l.id === sel.l);
    return texto && link ? { material, texto, link } : null;
  }

  // Converte uma seleção no objeto que o card da dica sabe desenhar. O card público mostra SÓ: capa, título, texto e botão.
  // Rótulo (kick), nome interno, caixa "importante", preço e identificação do link ficam VAZIOS de propósito (são só para a administração).
  function paraLegado(a, opcoes) {
    const e = opcoes && opcoes.html ? escHtml : (x) => (x == null ? '' : String(x));
    const m = a.material, t = a.texto, l = a.link;
    return {
      id: m.chave, nome: '', icone: m.icone, cta: m.cta, classe: m.classe, kick: '', titulo: e(t.titulo),
      textos: (t.paragrafos || []).map(e), importante: '', botao: e(t.botao || ''),
      imagem: m.imagem || '', capaEmoji: m.capaEmoji || '', iconeWhatsapp: m.iconeWhatsapp === true, link: l.url, preco: '',
    };
  }
  function resolver(lista, selecoes, opcoes) {
    return (selecoes || []).map((s) => achar(lista, s)).filter(Boolean).map((a) => paraLegado(a, opcoes));
  }

  // ---- seletor (Material / Texto / Link) — HTML simples, herda o estilo de input/select da página que o usa
  function montarSeletor(el, lista, sel, aoMudar) {
    const doc = el.ownerDocument, mats = disponiveis(lista);
    const estado = { m: '', t: '', l: '' };
    const caixa = (rotulo) => { const l = doc.createElement('label'); l.textContent = rotulo; const s = doc.createElement('select'); s.style.width = '100%'; s.style.minHeight = '44px'; l.append(s); el.append(l); return s; };
    const sm = caixa('Material'), st = caixa('Texto'), sl = caixa('Link');
    const opcao = (s, valor, txt) => { const o = doc.createElement('option'); o.value = valor; o.textContent = txt; s.append(o); };
    const rotuloLink = (l) => l.nome + (l.preco ? ' — ' + l.preco : '') + (l.principal ? ' (principal)' : '');
    function preencher(m, t, l) {
      sm.textContent = ''; opcao(sm, '', mats.length ? 'Escolha o material…' : 'Nenhum material disponível'); mats.forEach((x) => opcao(sm, x.id, x.nome));
      sm.value = m || '';
      const mat = mats.find((x) => x.id === sm.value);
      st.textContent = ''; sl.textContent = '';
      if (mat) {
        mat.textos.forEach((x) => opcao(st, x.id, x.nome + ' — ' + x.titulo.slice(0, 40))); mat.links.forEach((x) => opcao(sl, x.id, rotuloLink(x)));
        st.value = mat.textos.some((x) => x.id === t) ? t : mat.textos[0].id;
        sl.value = mat.links.some((x) => x.id === l) ? l : (mat.links.find((x) => x.principal) || mat.links[0]).id;
      } else { opcao(st, '', '—'); opcao(sl, '', '—'); }
      st.disabled = sl.disabled = !mat;
      estado.m = mat ? mat.id : ''; estado.t = mat ? st.value : ''; estado.l = mat ? sl.value : '';
    }
    const avisar = () => aoMudar && aoMudar(estado.m ? { m: estado.m, t: estado.t, l: estado.l } : null);
    sm.addEventListener('change', () => { preencher(sm.value, '', ''); avisar(); });
    st.addEventListener('change', () => { estado.t = st.value; avisar(); });
    sl.addEventListener('change', () => { estado.l = sl.value; avisar(); });
    preencher(sel && sel.m, sel && sel.t, sel && sel.l);
    return { obter: () => (estado.m ? { m: estado.m, t: estado.t, l: estado.l } : null) };
  }
  return { carregar, disponiveis, achar, paraLegado, resolver, montarSeletor, escHtml };
});
