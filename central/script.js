/* Central DevMapas — menu das ferramentas. Só HTML/CSS/JS: sem banco, login nem backend.
   PARA ADICIONAR OU ATIVAR UM CARD: edite a lista "CARDS".
   Campos de um card:
     nome, desc, icone        textos e emoji
     href                     link da página (se não existir ainda, use emBreve: true)
     emBreve: true            mostra o card desativado, com o selo "EM BREVE"
     externo: true            abre em nova aba (links de fora do site)
   Para ativar um card "EM BREVE": troque emBreve: true por href: '/caminho/'. */
const CARDS = [
  { nome: 'Painel de Dicas', desc: 'Cadastrar e gerenciar dicas', icone: '💡', emBreve: true },
  { nome: 'Gerador de Desafios', desc: 'Criar desafios', icone: '🛠️', href: '/gerador-desafios/' },
  { nome: 'Ofertas e Materiais', desc: 'Gerenciar ofertas e materiais', icone: '🎁', emBreve: true },
  { nome: 'Gerenciador de Links', desc: 'Localizar e copiar links', icone: '🔗', emBreve: true },
  { nome: 'Analytics', desc: 'Acompanhar resultados', icone: '📊', href: '/painel-desafios/' },
  { nome: 'Desafios publicados', desc: 'Consultar os desafios prontos', icone: '🎯', emBreve: true }
];

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

function conteudo(c) {
  const ico = el('span', 'ico', c.icone); ico.setAttribute('aria-hidden', 'true');
  const txt = el('span', 'txt'); txt.append(el('span', 'nome', c.nome), el('span', 'desc', c.desc));
  return [ico, txt];
}

function desenharCard(c) {
  if (c.emBreve || !c.href) {                       // ainda não existe: não vira link
    const box = el('div', 'item breve'); box.setAttribute('aria-disabled', 'true');
    box.append(...conteudo(c), el('span', 'badge', 'EM BREVE'));
    return box;
  }
  const a = el('a', 'item'); a.href = c.href;
  if (c.externo) { a.target = '_blank'; a.rel = 'noopener'; }
  const seta = el('span', 'seta', '›'); seta.setAttribute('aria-hidden', 'true');
  a.append(...conteudo(c), seta);
  return a;
}

const menu = document.getElementById('menu');
CARDS.forEach((c) => menu.append(desenharCard(c)));
