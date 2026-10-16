// =====================================================================
// Central de Ofertas — funções compartilhadas das APIs /api/ofertas (pública) e /api/ofertas-admin (protegida).
// Reaproveita api/_dicas-lib.js (configuração, chave administrativa, chamadas ao Supabase).
// Começa com "_" para a Vercel não tratar como rota.
// =====================================================================

const { rest } = require('./_dicas-lib.js');

const TIPOS = ['simulado', 'mapa', 'personalizado', 'grupo', 'cartilha'];     // valores exatos de materiais.tipo
const CLASSES = ['go a', 'go b', 'go wa', 'go gr'];                           // estilos de card que já existem nos desafios e dicas

// Lê as quatro tabelas e monta a lista completa (inclui pausados; as APIs filtram depois).
async function carregar(cfg) {
  const consultas = await Promise.all([
    rest(cfg, 'materiais?select=id,nome,tipo,destino_url,ativo&order=nome.asc&limit=1000'),
    rest(cfg, 'ofertas_materiais?select=*&limit=1000'),
    rest(cfg, 'ofertas_textos?select=*&order=ordem.asc,criado_em.asc&limit=5000'),
    rest(cfg, 'ofertas_links?select=*&order=ordem.asc,criado_em.asc&limit=5000'),
  ]);
  const ruim = consultas.find((r) => !r.ok);
  if (ruim) { const e = new Error('falha_consulta'); e.http = ruim.status; e.codigo = ruim.codigo; throw e; }
  const [m, e, t, l] = consultas.map((r) => r.dados);
  const porMaterial = (lista) => { const mp = new Map(); lista.forEach((x) => { if (!mp.has(x.material_id)) mp.set(x.material_id, []); mp.get(x.material_id).push(x); }); return mp; };
  const ext = new Map(e.map((x) => [x.material_id, x])), textos = porMaterial(t), links = porMaterial(l);
  return m.map((x) => ({
    id: x.id, nome: x.nome, tipo: x.tipo, destino_url: x.destino_url, ativo_analytics: x.ativo !== false,
    oferta: ext.has(x.id) ? ext.get(x.id) : null,
    textos: (textos.get(x.id) || []).map(formatarTexto), links: (links.get(x.id) || []).map(formatarLink),
  }));
}
const formatarTexto = (t) => ({ id: t.id, nome: t.nome, kick: t.kick || '', titulo: t.titulo, paragrafos: Array.isArray(t.paragrafos) ? t.paragrafos : [], importante: t.importante || '', ativo: t.ativo !== false, ordem: t.ordem || 0 });
const formatarLink = (l) => ({ id: l.id, nome: l.nome, url: l.url, preco: l.preco || '', botao: l.botao, principal: l.principal === true, ativo: l.ativo !== false, ordem: l.ordem || 0 });

// Visão PÚBLICA: só o que está no ar (material não pausado e ativo no Analytics, texto/link ativos).
function publico(materiais) {
  return materiais
    .filter((m) => m.oferta && m.oferta.pausado !== true && m.ativo_analytics)
    .map((m) => ({
      id: m.id, chave: m.oferta.chave, nome: m.nome, tipo: m.tipo, cta: m.oferta.cta, icone: m.oferta.icone, classe: m.oferta.classe,
      imagem: m.oferta.imagem_url || '', capaEmoji: m.oferta.capa_emoji || '', iconeWhatsapp: m.oferta.icone_whatsapp === true, ordem: m.oferta.ordem || 0,
      textos: m.textos.filter((t) => t.ativo).map(({ id, nome, kick, titulo, paragrafos, importante }) => ({ id, nome, kick, titulo, paragrafos, importante })),
      links: m.links.filter((l) => l.ativo).map(({ id, nome, url, preco, botao, principal }) => ({ id, nome, url, preco, botao, principal })),
    }))
    .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
}
module.exports = { TIPOS, CLASSES, carregar, publico, formatarTexto, formatarLink };
