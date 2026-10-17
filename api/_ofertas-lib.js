// =====================================================================
// Central de Ofertas — funções compartilhadas das APIs /api/ofertas (pública) e /api/ofertas-admin (protegida).
// Reaproveita api/_dicas-lib.js. Começa com "_" para a Vercel não tratar como rota.
// Uma OFERTA = linha de ofertas_materiais (a coluna material_id é o id da oferta; NÃO depende mais da tabela materiais).
// =====================================================================

const { rest, urlImagem } = require('./_dicas-lib.js');

const ESTILOS = ['go a', 'go b', 'go wa', 'go gr'];           // os 4 estilos reais dos cards
const comWhatsApp = (estilo) => estilo === 'go wa' || estilo === 'go gr';   // ícone do WhatsApp no botão (verde = WhatsApp)

const paragrafos = (t) => (Array.isArray(t.paragrafos) ? t.paragrafos : []).filter((p) => typeof p === 'string' && p.trim());
const formatarTexto = (t) => ({ id: t.id, nome: t.nome || 'Principal', titulo: t.titulo || '', texto: paragrafos(t).join('\n\n'), botao: t.botao || '', ativo: t.ativo !== false });
const formatarLink = (l) => ({ id: l.id, nome: l.nome, url: l.url, preco: l.preco || '', principal: l.principal === true, ativo: l.ativo !== false });

// Lê as tabelas e monta a lista de ofertas (com pausadas). O primeiro texto (menor "ordem") é o texto PRINCIPAL;
// os demais são versões alternativas.
async function carregar(cfg) {
  const consultas = await Promise.all([
    rest(cfg, 'ofertas_materiais?select=*&limit=1000'),
    rest(cfg, 'ofertas_textos?select=*&order=ordem.asc,criado_em.asc&limit=5000'),
    rest(cfg, 'ofertas_links?select=*&order=ordem.asc,criado_em.asc&limit=5000'),
  ]);
  const ruim = consultas.find((r) => !r.ok);
  if (ruim) { const e = new Error('falha_consulta'); e.http = ruim.status; e.codigo = ruim.codigo; throw e; }
  const [ofertas, textos, links] = consultas.map((r) => r.dados);

  const ids = [...new Set(ofertas.map((o) => o.capa_imagem_id).filter(Boolean))];
  const caminhos = new Map();
  if (ids.length) {
    const r = await rest(cfg, 'dica_imagens?id=in.(' + ids.join(',') + ')&select=id,caminho&limit=1000');
    if (!r.ok) { const e = new Error('falha_consulta'); e.http = r.status; throw e; }
    r.dados.forEach((i) => caminhos.set(i.id, i.caminho));
  }
  const agrupar = (lista) => { const mp = new Map(); lista.forEach((x) => { if (!mp.has(x.material_id)) mp.set(x.material_id, []); mp.get(x.material_id).push(x); }); return mp; };
  const tx = agrupar(textos), lk = agrupar(links);

  return ofertas.map((o) => {
    const ts = (tx.get(o.material_id) || []).map(formatarTexto);
    const cam = caminhos.get(o.capa_imagem_id);
    const url = cam ? urlImagem(cfg, cam) : (o.imagem_url || '');
    return {
      id: o.material_id, nome: o.nome || o.chave, estilo: o.classe, pausado: o.pausado === true, chave: o.chave, cta: o.cta, ordem: o.ordem || 0,
      atualizado_em: o.atualizado_em || '', capa: url ? { id: o.capa_imagem_id || null, url } : null,
      principal: ts[0] || { id: null, nome: 'Principal', titulo: '', texto: '', botao: '', ativo: true }, alternativas: ts.slice(1),
      links: (lk.get(o.material_id) || []).map(formatarLink),
    };
  });
}

// Visão PÚBLICA, no formato que o Painel de Dicas e a página pública da dica já consomem.
// Só o que está no ar. Não há rótulo (kick), caixa "importante" nem preço no card: o card mostra capa, título, texto e botão.
function publico(ofertas) {
  const txt = (t) => ({ id: t.id, nome: t.nome, kick: '', titulo: t.titulo, paragrafos: t.texto ? t.texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : [], importante: '', botao: t.botao });
  return ofertas.filter((o) => !o.pausado).map((o) => ({
    id: o.id, chave: o.chave, nome: o.nome, tipo: '', cta: o.cta, icone: '🎁', classe: o.estilo, imagem: o.capa ? o.capa.url : '', capaEmoji: '', iconeWhatsapp: comWhatsApp(o.estilo), ordem: o.ordem,
    textos: [o.principal].concat(o.alternativas).filter((t) => t.id && t.ativo).map(txt),
    links: o.links.filter((l) => l.ativo).map((l) => ({ id: l.id, nome: l.nome, url: l.url, preco: l.preco, botao: '', principal: l.principal })),
  })).sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
}
module.exports = { ESTILOS, comWhatsApp, carregar, publico };
