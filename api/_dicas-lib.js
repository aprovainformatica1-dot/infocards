// =====================================================================
// Dicas no Supabase — funções compartilhadas pelas APIs:
//   /api/dicas-admin     (cadastro, publicação — protegida)
//   /api/dicas-imagens   (biblioteca de imagens — protegida)
//   /api/dica            (página pública /dica/slug)
//
// Mesmas variáveis de ambiente das APIs do Analytics (somente servidor):
//   ANALYTICS_SUPABASE_URL
//   ANALYTICS_SUPABASE_SERVICE_ROLE_KEY
//   ANALYTICS_ADMIN_KEY
// O arquivo começa com "_" para a Vercel NÃO tratá-lo como uma rota.
// =====================================================================

const crypto = require('crypto');
const regras = require('../painel-dicas/regras.js');
const MODELO = require('./_dica-modelo.js');

const BASE_DICA = 'https://devmapas.vercel.app/dica/';
const BUCKET = 'dicas-imagens';

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corpo));
}

// Compara as chaves por hash (igual ao links-admin.js).
function chaveValida(recebida, esperada) {
  if (typeof recebida !== 'string' || !recebida || !esperada) return false;
  const a = crypto.createHash('sha256').update(recebida).digest();
  const b = crypto.createHash('sha256').update(esperada).digest();
  return crypto.timingSafeEqual(a, b);
}

// Variáveis do servidor. Retorna null se faltar alguma (precisaAdmin = false na página pública).
function configuracao(precisaAdmin) {
  const supabaseUrl = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '';
  const adminKey = process.env.ANALYTICS_ADMIN_KEY || '';
  if (!supabaseUrl || !serviceKey || (precisaAdmin && !adminKey)) return null;
  // Chaves novas (sb_secret_...) usam só "apikey"; chaves JWT legadas também aceitam "Authorization: Bearer".
  const headers = { apikey: serviceKey };
  if (serviceKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + serviceKey;
  return { supabaseUrl, adminKey, headers };
}

async function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...opcoes, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}

// Chamada ao PostgREST. Retorna { ok, status, dados, codigo, total }.
async function rest(cfg, caminho, { metodo = 'GET', corpo, extra = {}, ms = 6000 } = {}) {
  const headers = { ...cfg.headers, ...extra };
  if (corpo !== undefined) { headers['Content-Type'] = 'application/json'; headers.Prefer = headers.Prefer || 'return=representation'; }
  const resp = await fetchComTimeout(cfg.supabaseUrl + '/rest/v1/' + caminho, {
    method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo),
  }, ms);
  let dados = null;
  try { dados = await resp.json(); } catch (e) { /* sem corpo */ }
  const faixa = resp.headers && resp.headers.get ? resp.headers.get('content-range') : null;
  const total = faixa && /\/(\d+)$/.test(faixa) ? Number(faixa.split('/')[1]) : null;
  return { ok: resp.ok, status: resp.status, dados, codigo: dados && dados.code ? String(dados.code) : '', total };
}

const urlImagem = (cfg, caminho) => (caminho ? cfg.supabaseUrl + '/storage/v1/object/public/' + BUCKET + '/' + caminho : '');

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Monta o HTML da Dica (o mesmo para a página pública e para a prévia do painel).
function renderizarDica({ titulo, conteudo, imagemUrl }) {
  const c = regras.normalizar(conteudo);
  const dados = JSON.stringify({ f: c.f, o: c.o, of: c.of, itens: c.itens, q: c.q }).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' ');
  const img = imagemUrl && /^https?:\/\/\S+$/i.test(imagemUrl) ? esc(imagemUrl) : '';
  let html = MODELO.split('__TITULO__').join(esc(titulo))
    .split('__OGIMG__').join(img)
    .split('__CONFIG__').join((c.o.length ? '<script src="/config/ofertas.js"></' + 'script>\n' : '') + (c.of.length ? '<script src="/config/ofertas-api.js"></' + 'script>\n' : ''))
    .split('__DADOS__').join(dados);
  if (!img) {   // sem imagem de compartilhamento
    html = html.replace(/<meta property="og:image[^>]*>\n|<meta name="twitter:image"[^>]*>\n/g, '').replace('content="summary_large_image"', 'content="summary"');
  }
  return html;
}

function lerCorpo(req) {
  let corpo = req.body;
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch (e) { corpo = null; } }
  return corpo && typeof corpo === 'object' ? corpo : null;
}

module.exports = { regras, BASE_DICA, BUCKET, responder, chaveValida, configuracao, fetchComTimeout, rest, urlImagem, esc, renderizarDica, lerCorpo };
