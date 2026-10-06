// =====================================================================
// DevMapas Analytics — ETAPA 3.1: API do Gerador de Links
//
//   GET  /api/links-admin  -> materiais ativos + conteúdos
//   POST /api/links-admin  -> cria um registro na tabela links
//
// Protegida por chave administrativa enviada no cabeçalho "x-admin-key".
//
// Variáveis de ambiente (somente servidor):
//   ANALYTICS_SUPABASE_URL
//   ANALYTICS_SUPABASE_SERVICE_ROLE_KEY
//   ANALYTICS_ADMIN_KEY
//
// Usa SOMENTE o Supabase novo (devmapas-analytics). Sem dependências.
// =====================================================================

const crypto = require('crypto');

const BASE_LINK = 'https://devmapas.vercel.app/r/';
const CODIGO_REGEX = /^[a-z0-9_-]{3,32}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORIGENS = ['stories', 'direct', 'bio', 'whatsapp', 'desafios', 'dicas'];

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(corpo));
}

// Compara as chaves por hash para não vazar o tamanho nem o conteúdo.
function chaveValida(recebida, esperada) {
  if (typeof recebida !== 'string' || !recebida || !esperada) return false;
  const a = crypto.createHash('sha256').update(recebida).digest();
  const b = crypto.createHash('sha256').update(esperada).digest();
  return crypto.timingSafeEqual(a, b);
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
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return responder(res, 405, { ok: false, erro: 'metodo_nao_permitido' });
  }

  // Configuração do servidor
  const supabaseUrl = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, '');
  const serviceKey = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '';
  const adminKey = process.env.ANALYTICS_ADMIN_KEY || '';
  if (!supabaseUrl || !serviceKey || !adminKey) {
    console.error('[links-admin] Variáveis de ambiente não configuradas.');
    return responder(res, 500, { ok: false, erro: 'configuracao' });
  }

  // 1) Chave administrativa (sempre primeiro)
  if (!chaveValida(req.headers && req.headers['x-admin-key'], adminKey)) {
    return responder(res, 401, { ok: false, erro: 'chave_invalida' });
  }

  // Chaves novas (sb_secret_...) usam só "apikey"; chaves JWT legadas também
  // aceitam "Authorization: Bearer".
  const headersBase = { apikey: serviceKey };
  if (serviceKey.startsWith('eyJ')) {
    headersBase.Authorization = 'Bearer ' + serviceKey;
  }

  const consultar = (caminho) =>
    fetchComTimeout(supabaseUrl + '/rest/v1/' + caminho, { headers: headersBase }, 5000);

  // ------------------------------------------------------------------
  // GET: listas para a página
  // ------------------------------------------------------------------
  if (req.method === 'GET') {
    try {
      const [rm, rc] = await Promise.all([
        consultar('materiais?ativo=eq.true&select=id,nome,tipo&order=nome.asc'),
        consultar('conteudos?select=id,nome,tipo&order=nome.asc'),
      ]);
      if (!rm.ok || !rc.ok) {
        console.error('[links-admin] Falha ao listar. HTTP', rm.status, rc.status);
        return responder(res, 500, { ok: false, erro: 'falha_consulta' });
      }
      const materiais = await rm.json();
      const conteudos = await rc.json();
      return responder(res, 200, { ok: true, materiais, conteudos });
    } catch (err) {
      console.error('[links-admin] Erro ao listar:', err && err.name ? err.name : 'erro');
      return responder(res, 500, { ok: false, erro: 'falha_consulta' });
    }
  }

  // ------------------------------------------------------------------
  // POST: criar link
  // ------------------------------------------------------------------
  let corpo = req.body;
  if (typeof corpo === 'string') {
    try { corpo = JSON.parse(corpo); } catch (e) { corpo = null; }
  }
  if (!corpo || typeof corpo !== 'object') {
    return responder(res, 400, { ok: false, erro: 'corpo_invalido' });
  }

  const { codigo, origem } = corpo;
  const materialId = corpo.material_id;
  const conteudoId = corpo.conteudo_id || null;

  if (typeof codigo !== 'string' || !CODIGO_REGEX.test(codigo)) {
    return responder(res, 400, { ok: false, erro: 'codigo_invalido' });
  }
  if (typeof origem !== 'string' || !ORIGENS.includes(origem)) {
    return responder(res, 400, { ok: false, erro: 'origem_invalida' });
  }
  if (typeof materialId !== 'string' || !UUID_REGEX.test(materialId)) {
    return responder(res, 400, { ok: false, erro: 'material_invalido' });
  }
  if (conteudoId !== null && (typeof conteudoId !== 'string' || !UUID_REGEX.test(conteudoId))) {
    return responder(res, 400, { ok: false, erro: 'conteudo_invalido' });
  }

  try {
    // Origem (por slug), material ativo e conteúdo (se informado)
    const [ro, rm, rc] = await Promise.all([
      consultar('origens?slug=eq.' + origem + '&ativo=eq.true&select=id&limit=1'),
      consultar('materiais?id=eq.' + materialId + '&ativo=eq.true&select=id&limit=1'),
      conteudoId
        ? consultar('conteudos?id=eq.' + conteudoId + '&select=id&limit=1')
        : Promise.resolve(null),
    ]);

    if (!ro.ok || !rm.ok || (rc && !rc.ok)) {
      console.error('[links-admin] Falha nas conferências. HTTP', ro.status, rm.status, rc ? rc.status : '-');
      return responder(res, 500, { ok: false, erro: 'falha_consulta' });
    }

    const origens = await ro.json();
    const materiais = await rm.json();
    const conteudos = rc ? await rc.json() : [];

    if (!origens.length) return responder(res, 400, { ok: false, erro: 'origem_invalida' });
    if (!materiais.length) return responder(res, 404, { ok: false, erro: 'material_nao_encontrado' });
    if (conteudoId && !conteudos.length) {
      return responder(res, 404, { ok: false, erro: 'conteudo_nao_encontrado' });
    }

    // Inserir. A duplicidade é barrada pela restrição UNIQUE de links.codigo.
    const ri = await fetchComTimeout(
      supabaseUrl + '/rest/v1/links',
      {
        method: 'POST',
        headers: {
          ...headersBase,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          codigo,
          origem_id: origens[0].id,
          material_id: materialId,
          conteudo_id: conteudoId,
        }),
      },
      5000
    );

    if (!ri.ok) {
      let codigoErro = '';
      try {
        const e = await ri.json();
        codigoErro = e && e.code ? String(e.code) : '';
      } catch (e) { /* corpo ilegível */ }

      if (ri.status === 409 && codigoErro === '23505') {
        return responder(res, 409, { ok: false, erro: 'codigo_em_uso' });
      }
      console.error('[links-admin] Falha ao gravar link. HTTP', ri.status, codigoErro);
      return responder(res, 500, { ok: false, erro: 'falha_gravacao' });
    }

    return responder(res, 201, { ok: true, codigo, link: BASE_LINK + codigo });
  } catch (err) {
    console.error('[links-admin] Erro ao criar link:', err && err.name ? err.name : 'erro');
    return responder(res, 500, { ok: false, erro: 'falha_gravacao' });
  }
};
