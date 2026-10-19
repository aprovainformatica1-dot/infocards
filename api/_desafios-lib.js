// =====================================================================
// Desafios no Supabase — funções compartilhadas pelas APIs
//   /api/desafios-admin   (cadastro, publicação — protegida pela chave administrativa)
//   /api/desafio          (página pública /desafio/slug)
// Independente do Painel de Dicas (não importa nada dele). Reaproveita só as VARIÁVEIS DE AMBIENTE do Analytics:
//   ANALYTICS_SUPABASE_URL, ANALYTICS_SUPABASE_SERVICE_ROLE_KEY, ANALYTICS_ADMIN_KEY
// Começa com "_" para a Vercel NÃO tratar como rota.
// =====================================================================

const crypto = require('crypto');
const regras = require('../gerenciar-desafios/regras.js');
const MODELO = require('./_desafio-modelo.js');

const BASE_DESAFIO = 'https://devmapas.vercel.app/desafio/';
const IMAGEM_COMPARTILHAR = 'https://devmapas.vercel.app/img/desafio-informatica.png';   // a mesma prévia de compartilhamento dos desafios atuais

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corpo));
}
function chaveValida(recebida, esperada) {
  if (typeof recebida !== 'string' || !recebida || !esperada) return false;
  const a = crypto.createHash('sha256').update(recebida).digest(), b = crypto.createHash('sha256').update(esperada).digest();
  return crypto.timingSafeEqual(a, b);
}
function configuracao(precisaAdmin) {
  const supabaseUrl = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '';
  const adminKey = process.env.ANALYTICS_ADMIN_KEY || '';
  if (!supabaseUrl || !serviceKey || (precisaAdmin && !adminKey)) return null;
  const headers = { apikey: serviceKey };                       // chaves novas (sb_secret_...) usam só "apikey"
  if (serviceKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + serviceKey;
  return { supabaseUrl, adminKey, headers };
}
async function fetchComTimeout(url, opcoes, ms) {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, { ...opcoes, signal: controller.signal }); } finally { clearTimeout(timer); }
}
// Chamada ao PostgREST. Retorna { ok, status, dados, codigo }.
async function rest(cfg, caminho, { metodo = 'GET', corpo, ms = 6000 } = {}) {
  const headers = { ...cfg.headers };
  if (corpo !== undefined) { headers['Content-Type'] = 'application/json'; headers.Prefer = 'return=representation'; }
  const resp = await fetchComTimeout(cfg.supabaseUrl + '/rest/v1/' + caminho, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo) }, ms);
  let dados = null; try { dados = await resp.json(); } catch (e) { /* sem corpo */ }
  return { ok: resp.ok, status: resp.status, dados, codigo: dados && dados.code ? String(dados.code) : '' };
}
const lerCorpo = (req) => { let c = req.body; if (typeof c === 'string') { try { c = JSON.parse(c); } catch (e) { c = null; } } return c && typeof c === 'object' ? c : null; };
const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Monta o HTML do desafio (o mesmo código para a página pública e para a prévia do painel).
function renderizarDesafio({ titulo, subtitulo, conteudo }) {
  const c = regras.normalizar(conteudo);
  const dados = JSON.stringify({ t: regras.s(titulo), s: regras.s(subtitulo), q: c.q, c: c.cards }).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, ' ');
  const desc = regras.s(subtitulo) || 'Desafio interativo com ' + c.q.length + (c.q.length === 1 ? ' questão' : ' questões') + ' de Informática para concursos.';
  return MODELO.split('__TITULO__').join(esc(titulo)).split('__DESC__').join(esc(desc)).split('__OGIMG__').join(esc(IMAGEM_COMPARTILHAR)).split('__DADOS__').join(dados);
}
module.exports = { regras, BASE_DESAFIO, responder, chaveValida, configuracao, rest, lerCorpo, renderizarDesafio };
