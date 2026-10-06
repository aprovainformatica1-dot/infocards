// =====================================================================
// DevMapas Analytics — ETAPA 2: rota /r/[codigo]
// Fluxo: valida código -> busca link no Supabase NOVO (devmapas-analytics)
//        -> confere link/material ativos -> define destino
//        -> registra clique -> redireciona (302).
//
// Variáveis de ambiente (somente servidor):
//   ANALYTICS_SUPABASE_URL
//   ANALYTICS_SUPABASE_SERVICE_ROLE_KEY
//
// Não usa o Supabase do banco de questões. Não armazena IP nem User-Agent.
// =====================================================================

const CODIGO_REGEX = /^[A-Za-z0-9_-]{3,32}$/;

// Robôs de pré-visualização de link (não contam como clique).
// ATENÇÃO: "Instagram" NÃO entra aqui de propósito. O navegador interno do
// app do Instagram envia "Instagram" no User-Agent em cliques de pessoas
// reais (Stories, Direct, Bio). O robô de prévia da Meta usa
// facebookexternalhit / meta-externalagent / Facebot.
const BOT_REGEX = new RegExp(
  [
    'whatsapp',
    'facebookexternalhit',
    'facebot',
    'meta-externalagent',
    'meta-webindexer',
    'twitterbot',
    'telegrambot',
    'slackbot',
    'slack-imgproxy',
    'linkedinbot',
    'discordbot',
    'skypeuripreview',
    'pinterestbot',
    'googlebot',
    'bingbot',
    'applebot',
    'bot\\b',
    'crawler',
    'spider',
  ].join('|'),
  'i'
);

function paginaErro(res, status, titulo, mensagem) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end(
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + titulo + '</title>' +
      '<style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;' +
      'justify-content:center;min-height:100vh;margin:0;background:#f5f5f5;color:#222;' +
      'text-align:center;padding:24px}h1{font-size:1.4rem;margin:0 0 8px}' +
      'p{margin:0;color:#555}</style></head><body><div><h1>' + titulo +
      '</h1><p>' + mensagem + '</p></div></body></html>'
  );
}

function naoEncontrado(res) {
  paginaErro(res, 404, 'Link não encontrado', 'Este link não existe ou não está mais disponível.');
}

function ehPrefetch(req) {
  const h = req.headers || {};
  const valores = [h['purpose'], h['sec-purpose'], h['x-moz'], h['x-purpose']]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return valores.includes('prefetch') || valores.includes('preview');
}

async function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opcoes, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = async function handler(req, res) {
  // Somente GET e HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return paginaErro(res, 405, 'Método não permitido', 'Use um link normal para acessar.');
  }

  // 1) Código vindo do rewrite /r/:codigo -> /api/r?codigo=:codigo
  let codigo = req.query && req.query.codigo;
  if (Array.isArray(codigo)) codigo = codigo[0];
  if (typeof codigo !== 'string' || !CODIGO_REGEX.test(codigo)) {
    return naoEncontrado(res);
  }

  // 2) Configuração do servidor
  const supabaseUrl = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    console.error('[r] Variáveis de ambiente do Analytics não configuradas.');
    return paginaErro(res, 500, 'Serviço indisponível', 'Tente novamente em instantes.');
  }

  // Chaves novas (sb_secret_...) usam só "apikey"; chaves JWT legadas também
  // aceitam "Authorization: Bearer".
  const headersBase = { apikey: serviceKey };
  if (serviceKey.startsWith('eyJ')) {
    headersBase.Authorization = 'Bearer ' + serviceKey;
  }

  // 3) Buscar link + material (consulta única)
  let link = null;
  try {
    const consulta =
      supabaseUrl +
      '/rest/v1/links' +
      '?codigo=eq.' + encodeURIComponent(codigo) +
      '&select=id,ativo,url_destino,materiais(ativo,destino_url)' +
      '&limit=1';

    const resp = await fetchComTimeout(consulta, { headers: headersBase }, 5000);
    if (!resp.ok) {
      console.error('[r] Falha ao buscar link. HTTP', resp.status);
      return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.');
    }
    const linhas = await resp.json();
    link = Array.isArray(linhas) && linhas.length ? linhas[0] : null;
  } catch (err) {
    console.error('[r] Erro ao consultar o Supabase:', err && err.name ? err.name : 'erro');
    return paginaErro(res, 503, 'Serviço indisponível', 'Tente novamente em instantes.');
  }

  if (!link) return naoEncontrado(res);

  // 4) Link e material precisam estar ativos
  const material = Array.isArray(link.materiais) ? link.materiais[0] : link.materiais;
  if (link.ativo !== true || !material || material.ativo !== true) {
    return naoEncontrado(res);
  }

  // 5) Destino: links.url_destino, senão materiais.destino_url (sempre do banco)
  const destinoBruto =
    (typeof link.url_destino === 'string' && link.url_destino.trim()) ||
    (typeof material.destino_url === 'string' && material.destino_url.trim()) ||
    '';

  let destino;
  try {
    const parsed = new URL(destinoBruto);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('protocolo não permitido');
    }
    destino = parsed.href;
  } catch (err) {
    console.error('[r] Destino inválido para o link', link.id);
    return naoEncontrado(res);
  }

  // 6) Registrar clique (não conta HEAD, prefetch nem robôs de prévia)
  const userAgent = String((req.headers && req.headers['user-agent']) || '');
  const deveContar =
    req.method === 'GET' && !ehPrefetch(req) && !BOT_REGEX.test(userAgent);

  if (deveContar) {
    try {
      const resp = await fetchComTimeout(
        supabaseUrl + '/rest/v1/cliques',
        {
          method: 'POST',
          headers: {
            ...headersBase,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({ link_id: link.id }),
        },
        3000
      );
      if (!resp.ok) {
        console.error('[r] Falha ao registrar clique. HTTP', resp.status);
      }
    } catch (err) {
      console.error('[r] Erro ao registrar clique:', err && err.name ? err.name : 'erro');
    }
  }

  // 7) Redirecionar (302, sem cache)
  res.statusCode = 302;
  res.setHeader('Location', destino);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.end();
};
