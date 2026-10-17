// =====================================================================
// API PÚBLICA (somente leitura): GET /api/ofertas
// Lista as ofertas da Central de Ofertas que estão NO AR (não pausadas), com texto(s) e links ativos.
// Usada pelo Painel de Dicas e pelas dicas publicadas. Sem chave, sem segredo.
// =====================================================================

const { responder, configuracao } = require('./_dicas-lib.js');
const { carregar, publico } = require('./_ofertas-lib.js');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');          // a prévia roda em iframe isolado (origem "null")
  if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); res.statusCode = 204; return res.end(); }
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); return responder(res, 405, { ok: false, erro: 'metodo_nao_permitido' }); }
  const cfg = configuracao(false);
  if (!cfg) { console.error('[ofertas] Variáveis de ambiente não configuradas.'); return responder(res, 500, { ok: false, erro: 'configuracao' }); }
  try {
    const materiais = publico(await carregar(cfg));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache só na borda (30 s). max-age=0 + sem "stale-while-revalidate": oferta pausada/editada nunca aparece velha no navegador.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30');
    res.end(JSON.stringify({ ok: true, materiais }));
  } catch (err) {
    console.error('[ofertas] Falha ao consultar:', err && err.message, err && err.http);
    responder(res, 503, { ok: false, erro: 'falha_consulta' });
  }
};
