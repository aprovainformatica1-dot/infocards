// =====================================================================
// Página pública de venda:  /venda/slug  ->  (vercel.json)  ->  /api/venda?slug=slug
// Busca o cadastro PUBLICADO no Supabase e devolve o HTML pronto (com as meta tags de compartilhamento).
// Rascunhos e páginas despublicadas respondem 404. Somente leitura; a chave do Supabase fica só no servidor.
// =====================================================================

const regras = require('../gerenciar-paginas-venda/regras.js');
const { renderizarVenda } = require('./_venda-render.js');

function paginaErro(res, status, titulo, mensagem) {
  res.statusCode = status; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex');
  res.end('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + '</title>' +
    '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f4fd;color:#1f1a33;text-align:center;padding:24px}h1{font-size:1.4rem;margin:0 0 8px;color:#3b1d6e}p{margin:0;color:#6b6485}</style></head><body><div><h1>' + titulo + '</h1><p>' + mensagem + '</p></div></body></html>');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return paginaErro(res, 405, 'Método não permitido', 'Use um link normal para acessar.'); }
  let slug = req.query && req.query.slug; if (Array.isArray(slug)) slug = slug[0];
  if (!regras.slugValido(slug)) return paginaErro(res, 404, 'Página não encontrada', 'Esta página não existe ou não está mais disponível.');
  const url = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, ''), key = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) { console.error('[venda] Variáveis de ambiente não configuradas.'); return paginaErro(res, 500, 'Serviço indisponível', 'Tente novamente em instantes.'); }
  const headers = { apikey: key }; if (key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  let linha = null; const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(url + '/rest/v1/paginas_venda?slug=eq.' + encodeURIComponent(slug) + '&publicada=eq.true&select=dados&limit=1', { headers, signal: controller.signal });
    if (!resp.ok) { console.error('[venda] Falha ao buscar. HTTP', resp.status); return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.'); }
    const dados = await resp.json(); linha = Array.isArray(dados) && dados.length ? dados[0] : null;
  } catch (err) { console.error('[venda] Erro:', err && err.name ? err.name : 'erro'); return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.'); } finally { clearTimeout(timer); }
  if (!linha) return paginaErro(res, 404, 'Página não encontrada', 'Esta página não existe ou não está mais disponível.');
  res.statusCode = 200; res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache curto na borda (60 s), sem "stale-while-revalidate": uma página despublicada some em até 1 minuto.
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.end(req.method === 'HEAD' ? undefined : renderizarVenda({ slug, dados: linha.dados }));
};
