/*
  API PRIVADA — DADOS DOS DESAFIOS (Vercel Web Analytics)
  URL depois do deploy:  GET /api/desafios-analytics?dias=30
  Cabeçalho obrigatório:  x-painel-chave: <valor de PAINEL_CHAVE>

  Variáveis de ambiente (configuradas na Vercel, nunca neste arquivo):
    ANALYTICS_API_TOKEN   token de acesso da Vercel (somente leitura de dados)
    ANALYTICS_PROJECT_ID  ID (prj_...) ou nome do projeto no qual o Web Analytics está ligado
    ANALYTICS_TEAM_ID     opcional — só para projetos de time (conta pessoal/Hobby: não preencher)
    PAINEL_CHAVE          chave que o futuro painel enviará para ter acesso a esta API

  Como os desafios são identificados (plano Hobby não tem eventos personalizados):
    /desafios/<id>.html        -> acesso ao desafio
    /ir/<id>-simulado.html     -> clique no botão do simulado
    /ir/<id>-grupo.html        -> clique no botão do grupo
  Cada linha vem de GET https://api.vercel.com/v1/query/web-analytics/visits/aggregate (by=requestPath).
*/
import { createHash, timingSafeEqual } from 'node:crypto';

const VERCEL_API = 'https://api.vercel.com/v1/query/web-analytics/visits/aggregate';
const LIMITES = [1000, 500, 200, 100]; // tenta o maior aceito; se a Vercel recusar (400), tenta o próximo

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(corpo));
}

const hash = (s) => createHash('sha256').update(String(s)).digest();
const chaveValida = (recebida, esperada) => timingSafeEqual(hash(recebida || ''), hash(esperada));
const dataISO = (d) => d.toISOString().slice(0, 10);

async function buscarVisitas({ token, projectId, teamId, desde, ate }) {
  let status = 0;
  for (const limite of LIMITES) {
    const params = new URLSearchParams({ projectId, since: desde, until: ate, by: 'requestPath', limit: String(limite) });
    if (teamId) params.set('teamId', teamId);
    const r = await fetch(VERCEL_API + '?' + params, { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) {
      const json = await r.json();
      return Array.isArray(json && json.data) ? json.data : [];
    }
    status = r.status;
    if (status !== 400) break;
  }
  throw Object.assign(new Error('vercel'), { status });
}

function agrupar(linhas) {
  const mapa = new Map();
  let parcial = false;
  const item = (id) => {
    if (!mapa.has(id)) mapa.set(id, { id, acessos: 0, cliques_simulado: 0, cliques_grupo: 0 });
    return mapa.get(id);
  };
  for (const l of linhas) {
    const bruto = String(l.requestPath ?? l.path ?? '');
    const paginas = Number(l.pageviews) || 0;
    if (bruto.toLowerCase() === 'others') { if (paginas > 0) parcial = true; continue; }
    const caminho = bruto.split(/[?#]/)[0].replace(/\/+$/, '').replace(/\.html$/i, '').toLowerCase();
    let m;
    if ((m = caminho.match(/^\/desafios\/([a-z0-9_-]+)$/)) && m[1] !== 'index') item(m[1]).acessos += paginas;
    else if ((m = caminho.match(/^\/ir\/([a-z0-9_-]+)-(simulado|grupo)$/))) item(m[1])['cliques_' + m[2]] += paginas;
  }
  const desafios = [...mapa.values()].sort((a, b) => b.acessos - a.acessos || a.id.localeCompare(b.id));
  const total = desafios.reduce((t, d) => ({
    acessos: t.acessos + d.acessos,
    cliques_simulado: t.cliques_simulado + d.cliques_simulado,
    cliques_grupo: t.cliques_grupo + d.cliques_grupo
  }), { acessos: 0, cliques_simulado: 0, cliques_grupo: 0 });
  return { total, desafios, parcial };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return responder(res, 405, { erro: 'Método não permitido.' });
  }

  const { ANALYTICS_API_TOKEN: token, ANALYTICS_PROJECT_ID: projectId, ANALYTICS_TEAM_ID: teamId, PAINEL_CHAVE: chave } = process.env;
  if (!token || !projectId || !chave) {
    return responder(res, 500, { erro: 'API não configurada: faltam variáveis de ambiente na Vercel.' });
  }
  if (!chaveValida(req.headers['x-painel-chave'], chave)) {
    return responder(res, 401, { erro: 'Acesso negado.' });
  }

  const url = new URL(req.url, 'http://localhost');
  let dias = parseInt(url.searchParams.get('dias') || '30', 10);
  if (!(dias >= 1)) dias = 30;
  dias = Math.min(dias, 30); // o plano Hobby guarda 1 mês de dados
  const hoje = new Date();
  const ate = dataISO(hoje);
  const desde = dataISO(new Date(hoje.getTime() - (dias - 1) * 86400000));

  try {
    const linhas = await buscarVisitas({ token, projectId, teamId, desde, ate });
    const { total, desafios, parcial } = agrupar(linhas);
    return responder(res, 200, { periodo: { desde, ate, dias }, atualizado_em: hoje.toISOString(), parcial, total, desafios });
  } catch (e) {
    console.error('Falha ao consultar o Vercel Web Analytics. Status:', e && e.status);
    return responder(res, 502, { erro: 'Não foi possível consultar o Vercel Web Analytics.', status_vercel: (e && e.status) || null });
  }
}

