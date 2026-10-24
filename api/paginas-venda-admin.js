// =====================================================================
// API administrativa das PÁGINAS DE VENDA (protegida por "x-admin-key", igual às outras APIs do projeto)
//
//   GET  /api/paginas-venda-admin            -> lista das páginas
//   GET  /api/paginas-venda-admin?id=UUID    -> uma página completa (para editar)
//   POST /api/paginas-venda-admin { id?, slug, dados }                 -> cria ou atualiza o cadastro (rascunho)
//   POST /api/paginas-venda-admin { acao:'previa', dados }             -> HTML da página (a mesma da página pública), sem gravar nada
//   POST /api/paginas-venda-admin { acao:'publicar'|'despublicar', id } -> só páginas publicadas abrem em /venda/slug
//
// Mesmas variáveis de ambiente do Analytics (somente servidor): ANALYTICS_SUPABASE_URL,
// ANALYTICS_SUPABASE_SERVICE_ROLE_KEY, ANALYTICS_ADMIN_KEY. Sem dependências.
// As imagens são enviadas pela API de imagens que já existe (/api/dicas-imagens, Supabase Storage);
// aqui só se guardam as referências. As imagens usadas ficam registradas em paginas_venda_imagens,
// e a chave estrangeira impede apagar do Storage uma imagem que alguma página usa.
// =====================================================================

const crypto = require('crypto');
const regras = require('../simulados/regras.js');
const { renderizarVenda } = require('./_venda-render.js');

const CAMPOS_LISTA = 'id,slug,nome,concurso,cargo,publicada,publicada_em,atualizado_em';
const BASE_VENDA = 'https://devmapas.vercel.app/venda/';
const comLink = (p) => (p ? { ...p, link: BASE_VENDA + p.slug } : p);
function responder(res, status, corpo) { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(corpo)); }
const erro = (res, status, codigo, extra) => responder(res, status, { ok: false, erro: codigo, ...(extra || {}) });
function chaveValida(recebida, esperada) {
  if (typeof recebida !== 'string' || !recebida || !esperada) return false;
  return crypto.timingSafeEqual(crypto.createHash('sha256').update(recebida).digest(), crypto.createHash('sha256').update(esperada).digest());
}
function configuracao() {
  const supabaseUrl = (process.env.ANALYTICS_SUPABASE_URL || '').replace(/\/+$/, ''), serviceKey = process.env.ANALYTICS_SUPABASE_SERVICE_ROLE_KEY || '', adminKey = process.env.ANALYTICS_ADMIN_KEY || '';
  if (!supabaseUrl || !serviceKey || !adminKey) return null;
  const headers = { apikey: serviceKey }; if (serviceKey.startsWith('eyJ')) headers.Authorization = 'Bearer ' + serviceKey;
  return { supabaseUrl, adminKey, headers };
}
async function rest(cfg, caminho, { metodo = 'GET', corpo, ms = 6000 } = {}) {
  const headers = { ...cfg.headers }; if (corpo !== undefined) { headers['Content-Type'] = 'application/json'; headers.Prefer = 'return=representation'; }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(cfg.supabaseUrl + '/rest/v1/' + caminho, { method: metodo, headers, body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: controller.signal });
    let dados = null; try { dados = await resp.json(); } catch (e) { /* sem corpo */ }
    return { ok: resp.ok, status: resp.status, dados, codigo: dados && dados.code ? String(dados.code) : '' };
  } finally { clearTimeout(timer); }
}
const agora = () => new Date().toISOString();
const garantir = (r, c) => { if (!r.ok) { const e = new Error(c || 'falha_gravacao'); e.http = r.status; e.codigo = r.codigo; throw e; } return r; };

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return erro(res, 405, 'metodo_nao_permitido'); }
  const cfg = configuracao();
  if (!cfg) { console.error('[paginas-venda-admin] Variáveis de ambiente não configuradas.'); return erro(res, 500, 'configuracao'); }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return erro(res, 401, 'chave_invalida');

  try {
    if (req.method === 'GET') {
      const id = req.query && typeof req.query.id === 'string' ? req.query.id : '';
      if (id) {
        if (!regras.UUID_REGEX.test(id)) return erro(res, 400, 'id_invalido');
        const r = garantir(await rest(cfg, 'paginas_venda?id=eq.' + id + '&select=*&limit=1'), 'falha_consulta');
        if (!r.dados.length) return erro(res, 404, 'nao_encontrada');
        return responder(res, 200, { ok: true, pagina: comLink({ ...r.dados[0], dados: regras.normalizar(r.dados[0].dados) }) });
      }
      const r = garantir(await rest(cfg, 'paginas_venda?select=' + CAMPOS_LISTA + '&order=atualizado_em.desc&limit=500'), 'falha_consulta');
      return responder(res, 200, { ok: true, paginas: r.dados.map(comLink) });
    }

    // ------------------------------------------------------------ salvar
    let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
    if (!b || typeof b !== 'object') return erro(res, 400, 'corpo_invalido');
    const idReq = typeof b.id === 'string' ? b.id : '';
    if (b.id !== undefined && b.id !== null && !regras.UUID_REGEX.test(idReq)) return erro(res, 400, 'id_invalido');
    // ---- prévia: monta a página de verdade (mesmo código da página pública) com o que está no formulário; não grava nada
    if (b.acao === 'previa') return responder(res, 200, { ok: true, html: renderizarVenda({ slug: 'previa', dados: b.dados }) });

    // ---- publicar / despublicar
    if (b.acao === 'publicar' || b.acao === 'despublicar') {
      if (!idReq) return erro(res, 400, 'id_invalido');
      const ex = garantir(await rest(cfg, 'paginas_venda?id=eq.' + idReq + '&select=id,dados&limit=1'), 'falha_consulta');
      if (!ex.dados.length) return erro(res, 404, 'nao_encontrada');
      if (b.acao === 'publicar') { const falta = regras.validarPublicacao(ex.dados[0].dados); if (falta.length) return erro(res, 422, 'dados_invalidos', { detalhes: falta }); }
      const r = garantir(await rest(cfg, 'paginas_venda?id=eq.' + idReq, { metodo: 'PATCH', corpo: b.acao === 'publicar' ? { publicada: true, publicada_em: agora() } : { publicada: false } }));
      return responder(res, 200, { ok: true, pagina: comLink({ ...r.dados[0], dados: regras.normalizar(r.dados[0].dados) }) });
    }
    if (b.acao !== undefined) return erro(res, 400, 'acao_invalida');

    // ---- salvar (rascunho)
    const slug = typeof b.slug === 'string' ? b.slug.trim() : '';
    if (regras.excedeLimites(b.dados)) return erro(res, 413, 'limite_excedido');
    const problemas = regras.validar(slug, b.dados);
    if (problemas.length) return erro(res, 422, 'dados_invalidos', { detalhes: problemas });
    const dados = regras.normalizar(b.dados);
    if (JSON.stringify(dados).length > regras.MAX_JSON) return erro(res, 413, 'conteudo_grande');

    // as imagens da biblioteca precisam existir (e ficam registradas para não serem apagadas)
    const ids = regras.idsImagens(dados);
    if (ids.length) {
      const im = garantir(await rest(cfg, 'dica_imagens?id=in.(' + ids.join(',') + ')&select=id&limit=1000'), 'falha_consulta');
      if (im.dados.length !== ids.length) return erro(res, 400, 'imagem_nao_encontrada');
    }
    const nome = dados.identificacao.concurso + (dados.identificacao.cargo ? ' — ' + dados.identificacao.cargo : '');
    const campos = { slug, nome, concurso: dados.identificacao.concurso, cargo: dados.identificacao.cargo, dados, atualizado_em: agora() };
    let r;
    if (idReq) {
      const ex = garantir(await rest(cfg, 'paginas_venda?id=eq.' + idReq + '&select=id&limit=1'), 'falha_consulta');
      if (!ex.dados.length) return erro(res, 404, 'nao_encontrada');
      r = await rest(cfg, 'paginas_venda?id=eq.' + idReq, { metodo: 'PATCH', corpo: campos });
    } else r = await rest(cfg, 'paginas_venda', { metodo: 'POST', corpo: { id: crypto.randomUUID(), criado_em: campos.atualizado_em, ...campos } });
    if (!r.ok) {
      if (r.status === 409 && r.codigo === '23505') return erro(res, 409, 'slug_em_uso');
      console.error('[paginas-venda-admin] Falha ao salvar. HTTP', r.status, r.codigo); return erro(res, 500, 'falha_gravacao');
    }
    const pagina = r.dados[0];

    // registra quais imagens a página usa (protege contra exclusão no Storage)
    const atuais = garantir(await rest(cfg, 'paginas_venda_imagens?pagina_id=eq.' + pagina.id + '&select=imagem_id'), 'falha_consulta').dados.map((x) => x.imagem_id);
    const novos = ids.filter((i) => !atuais.includes(i));
    if (novos.length) garantir(await rest(cfg, 'paginas_venda_imagens', { metodo: 'POST', corpo: novos.map((imagem_id) => ({ pagina_id: pagina.id, imagem_id })) }));
    for (const i of atuais.filter((x) => !ids.includes(x))) garantir(await rest(cfg, 'paginas_venda_imagens?pagina_id=eq.' + pagina.id + '&imagem_id=eq.' + i, { metodo: 'DELETE' }));
    return responder(res, idReq ? 200 : 201, { ok: true, pagina: comLink({ ...pagina, dados }) });
  } catch (err) {
    console.error('[paginas-venda-admin] Erro:', err && err.message, err && err.http, err && err.codigo);
    return erro(res, 500, err && err.message === 'falha_consulta' ? 'falha_consulta' : 'falha_gravacao');
  }
};
