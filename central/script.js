/* Central DevMapas — menu das ferramentas. Só HTML/CSS/JS: sem banco, login nem backend.
   PARA ADICIONAR UM ITEM: acrescente um objeto em "itens" da seção certa (ou crie uma seção nova).
   Campos de um item:
     nome, desc, icone        textos e emoji
     href                     link da página (se não existir ainda, use emBreve: true)
     emBreve: true            mostra o item desativado, com o selo "EM BREVE"
     externo: true            abre em nova aba (links de fora do site)
     verde: true              destaque verde (WhatsApp)
     links: [{nome, href}]    item com vários atalhos (ex.: desafios publicados) */
const CENTRAL = [
  { icone: '🧠', titulo: 'DESAFIOS', itens: [
    { nome: 'Gerador de Desafios', desc: 'Crie um desafio de 5 questões', icone: '🛠️', href: '/gerador-desafios/' },
    { nome: 'Desafios publicados', desc: 'Abra os desafios que já foram criados', icone: '🎯', links: [
      { nome: 'PMMA', href: '/desafios/pmma.html' },
      { nome: 'Excel', href: '/desafios/excel.html' }
    ] }
  ] },
  { icone: '🎁', titulo: 'OFERTAS', itens: [
    { nome: 'Central de Ofertas', desc: 'Textos, imagens e links das ofertas', icone: '🎁', emBreve: true }
  ] },
  { icone: '📊', titulo: 'ANALYTICS', itens: [
    { nome: 'Painel de Analytics', desc: 'Acessos e cliques dos desafios', icone: '📊', href: '/painel-desafios/' }
  ] },
  { icone: '💡', titulo: 'CONTEÚDOS', itens: [
    { nome: 'Dicas, iscas e outros conteúdos', desc: 'Área reservada para o futuro', icone: '💡', emBreve: true }
  ] },
  { icone: '🔗', titulo: 'LINKS', itens: [
    { nome: 'Links dos materiais', desc: 'Página de links dos materiais', icone: '📚', emBreve: true },
    { nome: 'Links dos simulados', desc: 'Página de links dos simulados', icone: '📄', href: '/links/simulados.html' },
    { nome: 'Grupo do WhatsApp', desc: 'Grupo gratuito de estudos', icone: '💚', href: 'https://chat.whatsapp.com/EB9OpUq1uOl1KA5TdiLheD?mode=gi_t', externo: true, verde: true }
  ] }
];

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

function conteudo(it) {
  const ico = el('span', 'ico', it.icone || '•'); ico.setAttribute('aria-hidden', 'true');
  const txt = el('span', 'txt'); txt.append(el('span', 'nome', it.nome), el('span', 'desc', it.desc || ''));
  return [ico, txt];
}

function desenharItem(it) {
  if (it.links) {                                   // item com vários atalhos
    const box = el('div', 'item lista');
    const topo = el('div', 'topo'); topo.append(...conteudo(it));
    const chips = el('div', 'chips');
    it.links.forEach((l) => { const a = el('a', 'chip', l.nome); a.href = l.href; chips.append(a); });
    box.append(topo, chips);
    return box;
  }
  if (it.emBreve || !it.href) {                     // ainda não existe: não vira link
    const box = el('div', 'item breve'); box.setAttribute('aria-disabled', 'true');
    box.append(...conteudo(it), el('span', 'badge', 'EM BREVE'));
    return box;
  }
  const a = el('a', 'item' + (it.verde ? ' verde' : '')); a.href = it.href;
  if (it.externo) { a.target = '_blank'; a.rel = 'noopener'; }
  a.append(...conteudo(it), el('span', 'seta', '›'));
  return a;
}

const menu = document.getElementById('menu');
CENTRAL.forEach((sec) => {
  const s = el('section', 'sec');
  const h = el('h2', '', sec.icone + ' ' + sec.titulo);
  const grid = el('div', 'grid');
  sec.itens.forEach((it) => grid.append(desenharItem(it)));
  s.append(h, grid);
  menu.append(s);
});
