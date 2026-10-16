// =====================================================================
// API PÚBLICA (somente leitura): GET /api/ofertas
// Lista os materiais da Central de Ofertas que estão NO AR, com seus textos e links ativos.
// Usada pelas dicas publicadas, pelo Painel de Dicas e pelo Gerador de Desafios.
// Só devolve o que já é público nas páginas (textos, preços, links de compra). Nada de chave.
// =====================================================================

const { responder, configuracao } = require('./_dicas-lib.js');
const { carregar, publico } = require('./_ofertas-lib.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');          // a prévia do painel roda em iframe isolado (origem "null")
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); res.statusCode = 204; return res.end(); }
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); return responder(res, 405, { ok: false, erro: 'metodo_nao_permitido' }); }
  const cfg = configuracao(false);
  if (!cfg) { console.error('[ofertas] Variáveis de ambiente não configuradas.'); return responder(res, 500, { ok: false, erro: 'configuracao' }); }
  try {
    const materiais = publico(await carregar(cfg));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache só na borda (30 s): alivia o banco. max-age=0 faz o navegador sempre perguntar de novo; sem "stale-while-revalidate"
    // para que uma oferta pausada ou editada nunca apareça velha por causa de cache do navegador.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
    res.end(JSON.stringify({ ok: true, materiais }));
  } catch (err) {
    console.error('[ofertas] Falha ao consultar:', err && err.message, err && err.http);
    responder(res, 503, { ok: false, erro: 'falha_consulta' });
  }
};
