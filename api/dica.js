// =====================================================================
// Página pública da Dica:  /dica/slug  ->  (vercel.json)  ->  /api/dica?slug=slug
// Busca a versão PUBLICADA no Supabase e devolve o HTML pronto (com as meta tags de
// compartilhamento já escritas, para WhatsApp/Instagram funcionarem).
// Rascunhos e dicas despublicadas respondem 404.
// Somente leitura. Chave do Supabase só no servidor.
// =====================================================================

const { regras, configuracao, rest, urlImagem, renderizarDica } = require('./_dicas-lib.js');

function paginaErro(res, status, titulo, mensagem) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + '</title>' +
    '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f7f4fd;color:#1f1a33;text-align:center;padding:24px}' +
    'h1{font-size:1.4rem;margin:0 0 8px;color:#3b1d6e}p{margin:0;color:#6b6485}</style></head><body><div><h1>' + titulo + '</h1><p>' + mensagem + '</p></div></body></html>');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return paginaErro(res, 405, 'Método não permitido', 'Use um link normal para acessar.');
  }

  let slug = req.query && req.query.slug;
  if (Array.isArray(slug)) slug = slug[0];
  if (!regras.slugValido(slug)) return paginaErro(res, 404, 'Dica não encontrada', 'Esta dica não existe ou não está mais disponível.');

  const cfg = configuracao(false);
  if (!cfg) {
    console.error('[dica] Variáveis de ambiente não configuradas.');
    return paginaErro(res, 500, 'Serviço indisponível', 'Tente novamente em instantes.');
  }

  let linha = null;
  try {
    const r = await rest(cfg, 'dicas?slug=eq.' + encodeURIComponent(slug) + '&status=eq.publicada&select=pub_titulo,pub_conteudo,pub_og_caminho&limit=1', { ms: 5000 });
    if (!r.ok) {
      console.error('[dica] Falha ao buscar a dica. HTTP', r.status);
      return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.');
    }
    linha = Array.isArray(r.dados) && r.dados.length ? r.dados[0] : null;
  } catch (err) {
    console.error('[dica] Erro ao consultar o Supabase:', err && err.name ? err.name : 'erro');
    return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.');
  }

  if (!linha || !linha.pub_titulo) return paginaErro(res, 404, 'Dica não encontrada', 'Esta dica não existe ou não está mais disponível.');

  const html = renderizarDica({ titulo: linha.pub_titulo, conteudo: linha.pub_conteudo, imagemUrl: urlImagem(cfg, linha.pub_og_caminho) });
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  // Cache curto na borda: alivia o banco e o plano Free; uma alteração publicada aparece em até 1 minuto.
  // (Sem "stale-while-revalidate" de propósito: uma dica despublicada some em até 1 minuto.)
  res.setHeader('Cache-Control', 'public, s-maxage=60');
  res.end(req.method === 'HEAD' ? undefined : html);
};
