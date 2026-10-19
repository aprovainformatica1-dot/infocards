// =====================================================================
// Página pública do desafio:  /desafio/slug  ->  (vercel.json)  ->  /api/desafio?slug=slug
// Busca a versão PUBLICADA no Supabase e devolve o HTML pronto (com as meta tags de compartilhamento).
// Rascunhos e desafios despublicados respondem 404. Somente leitura; a chave do Supabase fica só no servidor.
// =====================================================================

const { regras, configuracao, rest, renderizarDesafio } = require('./_desafios-lib.js');

function paginaErro(res, status, titulo, mensagem) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + '</title>' +
    '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f4fd;color:#1f1a33;text-align:center;padding:24px}' +
    'h1{font-size:1.4rem;margin:0 0 8px;color:#3b1d6e}p{margin:0;color:#6b6485}</style></head><body><div><h1>' + titulo + '</h1><p>' + mensagem + '</p></div></body></html>');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return paginaErro(res, 405, 'Método não permitido', 'Use um link normal para acessar.'); }
  let slug = req.query && req.query.slug; if (Array.isArray(slug)) slug = slug[0];
  if (!regras.slugValido(slug)) return paginaErro(res, 404, 'Desafio não encontrado', 'Este desafio não existe ou não está mais disponível.');
  const cfg = configuracao(false);
  if (!cfg) { console.error('[desafio] Variáveis de ambiente não configuradas.'); return paginaErro(res, 500, 'Serviço indisponível', 'Tente novamente em instantes.'); }
  let linha = null;
  try {
    const r = await rest(cfg, 'desafios?slug=eq.' + encodeURIComponent(slug) + '&status=eq.publicado&select=pub_titulo,pub_subtitulo,pub_conteudo&limit=1', { ms: 5000 });
    if (!r.ok) { console.error('[desafio] Falha ao buscar. HTTP', r.status); return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.'); }
    linha = Array.isArray(r.dados) && r.dados.length ? r.dados[0] : null;
  } catch (err) { console.error('[desafio] Erro:', err && err.name ? err.name : 'erro'); return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.'); }
  if (!linha || !linha.pub_titulo) return paginaErro(res, 404, 'Desafio não encontrado', 'Este desafio não existe ou não está mais disponível.');
  const html = renderizarDesafio({ titulo: linha.pub_titulo, subtitulo: linha.pub_subtitulo, conteudo: linha.pub_conteudo });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache curto na borda (60 s), sem "stale-while-revalidate": um desafio despublicado some em até 1 minuto.
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.end(req.method === 'HEAD' ? undefined : html);
};
