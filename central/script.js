/* Central DevMapas — página principal da área administrativa. Só HTML/CSS/JS: sem banco, login nem backend.
   PARA ADICIONAR UM ITEM: acrescente um objeto em "itens" da seção certa (ou crie uma seção nova).
   Campos de uma seção:
     id, icone, titulo, desc  identificador (usado no atalho do topo), emoji, nome e frase curta
   Campos de um item:
     nome, desc, icone        textos e emoji
     href                     link da página (se não existir ainda, use emBreve: true)
     emBreve: true            mostra o item desativado, com o selo "EM BREVE"
     externo: true            abre em nova aba (links de fora do site)
     verde: true              destaque verde (WhatsApp)
     links: [{nome, href}]    item com vários atalhos (ex.: desafios publicados) */
const CENTRAL = [
  { id: 'conteudos', icone: '💡', titulo: 'CONTEÚDOS', desc: 'Dicas e desafios que você cria e publica', itens: [
    { nome: 'Painel de Dicas', desc: 'Reúna as dicas já criadas', icone: '💡', emBreve: true },
    { nome: 'Gerador de Desafios', desc: 'Crie um desafio de 5 questões', icone: '🛠️', href: '/gerador-desafios/' },
    { nome: 'Desafios publicados', desc: 'Abra os desafios que já foram criados', icone: '🎯', links: [
      { nome: 'PMMA', href: '/desafios/pmma.html' },
      { nome: 'Excel', href: '/desafios/excel.html' }
    ] }
  ] },
  { id: 'materiais', icone: '🎁', titulo: 'MATERIAIS E OFERTAS', desc: 'O que você entrega e o que você vende', itens: [
    { nome: 'Central de Ofertas', desc: 'Veja, cadastre e edite as ofertas', icone: '🎁', emBreve: true },
    { nome: 'Gerenciamento de materiais', desc: 'Organize os materiais de estudo', icone: '📚', emBreve: true }
  ] },
  { id: 'links', icone: '🔗', titulo: 'LINKS E DIVULGAÇÃO', desc: 'Encontre, copie e compartilhe seus links', itens: [
    { nome: 'Links dos materiais', desc: 'Página de links dos materiais', icone: '📚', emBreve: true },
    { nome: 'Links dos simulados', desc: 'Página de links dos simulados', icone: '📄', href: '/links/simulados.html' },
    { nome: 'Gerenciador de Links', desc: 'Localize e copie qualquer link', icone: '🔗', emBreve: true },
    { nome: 'Grupo do WhatsApp', desc: 'Grupo gratuito de estudos', icone: '💚', href: 'https://chat.whatsapp.com/EB9OpUq1uOl1KA5TdiLheD?mode=gi_t', externo: true, verde: true }
  ] },
  { id: 'analytics', icone: '📊', titulo: 'ANALYTICS', desc: 'Acompanhe acessos e cliques', itens: [
    { nome: 'Painel de Analytics', desc: 'Acessos e cliques dos desafios', icone: '📊', href: '/painel-desafios/' }
  ] }
];

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const disponivel = (it) => !!(it.links || (it.href && !it.emBreve));

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
  if (!disponivel(it)) {                            // ainda não existe: não vira link
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
const atalhos = document.getElementById('atalhos');
let totalOk = 0, totalBreve = 0;

CENTRAL.forEach((sec) => {
  const ok = sec.itens.filter(disponivel).length;
  const total = sec.itens.length;
  totalOk += ok; totalBreve += total - ok;

  const s = el('section', 'sec'); s.id = sec.id; s.setAttribute('aria-labelledby', sec.id + '-t');
  const ico = el('span', 'sec-ico', sec.icone); ico.setAttribute('aria-hidden', 'true');
  const h = el('h2', '', sec.titulo); h.id = sec.id + '-t';
  const txt = el('div', 'sec-txt'); txt.append(h, el('p', 'sec-desc', sec.desc));
  const cont = el('span', 'sec-cont' + (ok === total ? ' todos' : ''), ok === total ? 'tudo pronto' : ok + ' de ' + total + ' prontos');
  const topo = el('div', 'sec-topo'); topo.append(ico, txt, cont);
  const grid = el('div', 'grid');
  sec.itens.forEach((it) => grid.append(desenharItem(it)));
  s.append(topo, grid);
  menu.append(s);

  const at = el('a', 'atalho', sec.icone + ' ' + sec.titulo.charAt(0) + sec.titulo.slice(1).toLowerCase());
  at.href = '#' + sec.id;
  atalhos.append(at);
});

const resumo = document.getElementById('resumo');
resumo.append(
  el('span', 'pilula ok', totalOk + (totalOk === 1 ? ' ferramenta no ar' : ' ferramentas no ar')),
  el('span', 'pilula breve', totalBreve + ' em breve')
);
