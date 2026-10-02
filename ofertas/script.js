/* Central de Ofertas — INTERFACE (prévia). Sem banco, login nem backend; nada é salvo: as edições valem só nesta sessão.
   Os dados iniciais abaixo são uma CÓPIA da configuração OFERTAS de gerador-desafios/script.js (o gerador não é lido
   nem alterado). Ligar esta tela ao gerador de verdade fica para outra etapa. */
const BASE_IMG = "https://devmapas.vercel.app/img/";

/* ----- cópia de OFERTAS (gerador-desafios/script.js) ----- */
const OFERTAS = {
  simulado: {
    id: 'simulado', cta: 'simulado', classe: 'go a',
    kick: '📄 SIMULADO DE INFORMÁTICA',
    titulo: 'GOSTOU DE RESOLVER AS QUESTÕES ASSIM?',
    textos: [
      'O que você acabou de fazer foi uma demonstração interativa gratuita de como trabalho minhas questões e comentários.',
      'No material completo, você encontra mais de 100 questões de Informática comentadas para continuar praticando e revisar seus conhecimentos.'
    ],
    importante: 'O MATERIAL COMPLETO É DISPONIBILIZADO EM PDF.',
    botao: '📄 QUERO MAIS QUESTÕES',
    imagem: BASE_IMG + 'capa-simulado.png', capaEmoji: '📄',
    link: 'https://pay.kiwify.com.br/gpyqBa2'
  },
  mapas: {
    id: 'mapas', cta: 'mapas', classe: 'go b',
    kick: '🗺️ MAPAS DE INFORMÁTICA',
    titulo: 'E QUANDO VOCÊ PRECISAR REVISAR O CONTEÚDO?',
    textos: [
      'Depois de praticar questões, você consegue perceber quais assuntos ainda precisam de atenção.',
      'Os Mapas de Informática organizam os principais conteúdos de forma resumida para facilitar suas revisões.'
    ],
    botao: '🗺️ CONHECER OS MAPAS',
    imagem: BASE_IMG + 'capa-mapas.png', capaEmoji: '🗺️',
    link: 'https://pay.kiwify.com.br/6nLacpi'
  },
  personalizado: {
    id: 'personalizado', cta: 'whatsapp', classe: 'go wa',
    kick: '🎯 SIMULADO PERSONALIZADO',
    titulo: 'ESTUDANDO PARA UM CONCURSO ESPECÍFICO?',
    textos: ['Posso preparar um simulado personalizado de Informática, de acordo com o seu concurso e sua banca.'],
    botao: 'FALAR COMIGO NO WHATSAPP', iconeWhatsapp: true,
    link: 'https://wa.me/5561996169903'
  },
  grupo: {
    id: 'grupo', cta: 'grupo', classe: 'go gr',
    kick: '💚 GRUPO GRATUITO DE ESTUDOS',
    titulo: 'QUER CONTINUAR RECEBENDO QUESTÕES E DICAS?',
    textos: ['Entre no grupo gratuito do DevMapas e receba questões, dicas e conteúdos de Informática para concursos diretamente no WhatsApp.'],
    botao: 'ENTRAR NO GRUPO GRATUITO', iconeWhatsapp: true,
    link: 'https://chat.whatsapp.com/EB9OpUq1uOl1KA5TdiLheD?mode=gi_t'
  }
};
/* Nome e ícone de cada oferta na Central. "tipo": 'geral' ou 'mapa' (mapas individuais virão aqui no futuro:
   Microsoft 365, Segurança da Informação, Sistemas Operacionais, Internet, Hardware, Correio Eletrônico, Navegadores, Cartilha de atalhos). */
const META = {
  simulado: { nome: 'Simulado', icone: '📄' },
  mapas: { nome: 'Mapas', icone: '🗺️' },
  personalizado: { nome: 'Simulado personalizado', icone: '🎯' },
  grupo: { nome: 'Grupo gratuito', icone: '💚' }
};
const SECOES = [
  { tipo: 'geral', titulo: 'OFERTAS GERAIS', vazio: 'Nenhuma oferta geral cadastrada.' },
  { tipo: 'mapa', titulo: 'MAPAS INDIVIDUAIS', vazio: 'Nenhum mapa individual cadastrado ainda.' }
];

let ofertas = Object.values(OFERTAS).map((o) => ({ ...JSON.parse(JSON.stringify(o)), tipo: 'geral', ...META[o.id] }));
let editando = null;   // índice em "ofertas"; null = nova oferta

const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const url = (v) => /^https?:\/\/\S+$/i.test(v);

function linhaDado(rotulo, valor) { const d = el('div'); d.append(el('span', '', rotulo), el('b', '', valor || '—')); return d; }

function desenharCard(o, idx) {
  const c = el('article', 'card' + (o.classe && o.classe.includes('wa') ? ' verde' : ''));
  const h = el('h3'); h.append(el('span', 'ico', o.icone || '🎁'), document.createTextNode(o.nome));
  c.append(h);
  if (o.imagem) {                                   // só aparece se a imagem carregar
    const im = new Image(); im.alt = 'Capa da oferta'; im.className = 'capa';
    im.onload = () => h.after(im); im.src = o.imagem;
  }
  const resumo = (o.textos && o.textos[0]) || '';
  c.append(el('p', 'kick', o.kick || ''), el('p', 'tit', o.titulo || ''),
    el('p', 'res', resumo.length > 120 ? resumo.slice(0, 117) + '…' : resumo));
  const d = el('div', 'dados');
  const cta = el('div'); cta.append(el('span', '', 'CTA'), el('span', 'badge', o.cta || '—'));
  d.append(linhaDado('BOTÃO', o.botao), linhaDado('LINK', o.link), linhaDado('IMAGEM', o.imagem), cta, linhaDado('CLASSE VISUAL', o.classe));
  c.append(d);
  const b = el('button', 'btn ghost', '✏️ EDITAR OFERTA'); b.type = 'button';
  b.addEventListener('click', () => abrir(idx));
  c.append(b);
  return c;
}

function desenhar() {
  const lista = $('lista'); lista.textContent = '';
  SECOES.forEach((s) => {
    lista.append(el('h2', 'sec', s.titulo));
    const itens = ofertas.map((o, i) => [o, i]).filter(([o]) => o.tipo === s.tipo);
    if (!itens.length) lista.append(el('p', 'vazio', s.vazio));
    itens.forEach(([o, i]) => lista.append(desenharCard(o, i)));
  });
}

const CAMPOS = ['nome', 'kick', 'titulo', 'importante', 'botao', 'imagem', 'link', 'cta'];
function abrir(idx) {
  editando = idx;
  const o = idx === null ? { tipo: 'geral', textos: [], classe: 'go a' } : ofertas[idx];
  $('edTitulo').textContent = idx === null ? 'Nova oferta' : 'Editar oferta';
  CAMPOS.forEach((k) => { $('f-' + k).value = o[k] || ''; });
  $('f-tipo').value = o.tipo;
  $('f-textos').value = (o.textos || []).join('\n');
  const sel = $('f-classe');
  if (o.classe && ![...sel.options].some((op) => op.value === o.classe)) sel.add(new Option(o.classe, o.classe));
  sel.value = o.classe || 'go a';
  $('erro').hidden = true;
  $('ed').showModal();
  $('f-nome').focus();
}

function salvar(e) {
  e.preventDefault();
  const v = {}; CAMPOS.forEach((k) => { v[k] = $('f-' + k).value.trim(); });
  const erros = [];
  if (!v.nome) erros.push('Preencha o nome da oferta.');
  if (v.link && !url(v.link)) erros.push('O link deve começar com http:// ou https://');
  if (v.imagem && !url(v.imagem)) erros.push('A imagem deve ser uma URL que começa com http:// ou https://');
  if (erros.length) { $('erro').textContent = erros.join('\n'); $('erro').style.whiteSpace = 'pre-line'; $('erro').hidden = false; return; }
  const dados = { ...v, tipo: $('f-tipo').value, classe: $('f-classe').value, textos: $('f-textos').value.split('\n').map((t) => t.trim()).filter(Boolean) };
  if (!dados.importante) delete dados.importante;
  if (!dados.imagem) delete dados.imagem;
  if (editando === null) {
    const base = v.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'oferta';
    let id = base, n = 2; while (ofertas.some((o) => o.id === id)) id = base + '-' + n++;
    ofertas.push({ id, icone: dados.tipo === 'mapa' ? '🗺️' : '🎁', ...dados });
  } else {
    const ant = ofertas[editando];
    ofertas[editando] = { ...ant, ...dados };
    if (!dados.importante) delete ofertas[editando].importante;
    if (!dados.imagem) delete ofertas[editando].imagem;
  }
  $('ed').close(); desenhar();
}

$('nova').addEventListener('click', () => abrir(null));
$('cancelar').addEventListener('click', () => $('ed').close());
$('form').addEventListener('submit', salvar);
desenhar();
