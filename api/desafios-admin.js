// =====================================================================
// API administrativa dos DESAFIOS (protegida por "x-admin-key", igual às outras APIs do projeto)
//
//   GET  /api/desafios-admin            -> lista dos desafios
//   GET  /api/desafios-admin?id=UUID    -> um desafio completo (para editar)
//   POST /api/desafios-admin { acao }   -> salvar | previa | publicar | despublicar
//
// "salvar" grava só o RASCUNHO; a versão pública (colunas pub_*) só muda em "publicar".
// Não grava nada de rastreamento de cliques. Sem dependências.
// =====================================================================

const crypto = require('crypto');
const { regras, BASE_DESAFIO, responder, chaveValida, configuracao, rest, lerCorpo, renderizarDesafio } = require('./_desafios-lib.js');

const CAMPOS_LISTA = 'id,slug,titulo,subtitulo,status,alteracoes_pendentes,publicado_em,primeira_publicacao_em,atualizado_em';
const erro = (res, status, codigo, extra) => responder(res, status, { ok: false, erro: codigo, ...(extra || {}) });
const linha = (v, max) => regras.s(typeof v === 'string' ? v.replace(/\s+/g, ' ') : '').slice(0, max);
const comLink = (d) => (d ? { ...d, link: BASE_DESAFIO + d.slug } : d);
const agora = () => new Date().toISOString();

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return erro(res, 405, 'metodo_nao_permitido'); }
  const cfg = configuracao(true);
  if (!cfg) { console.error('[desafios-admin] Variáveis de ambiente não configuradas.'); return erro(res, 500, 'configuracao'); }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return erro(res, 401, 'chave_invalida');

  try {
    // ------------------------------------------------------------ GET
    if (req.method === 'GET') {
      const id = req.query && typeof req.query.id === 'string' ? req.query.id : '';
      if (id) {
        if (!regras.UUID_REGEX.test(id)) return erro(res, 400, 'id_invalido');
        const r = await rest(cfg, 'desafios?id=eq.' + id + '&select=*&limit=1');
        if (!r.ok) return erro(res, 500, 'falha_consulta');
        if (!r.dados.length) return erro(res, 404, 'nao_encontrado');
        return responder(res, 200, { ok: true, desafio: comLink(r.dados[0]) });
      }
      const r = await rest(cfg, 'desafios?select=' + CAMPOS_LISTA + '&order=atualizado_em.desc&limit=500');
      if (!r.ok) return erro(res, 500, 'falha_consulta');
      return responder(res, 200, { ok: true, desafios: r.dados.map(comLink) });
    }

    // ------------------------------------------------------------ POST
    const b = lerCorpo(req); if (!b) return erro(res, 400, 'corpo_invalido');
    const idReq = typeof b.id === 'string' ? b.id : '';
    if (b.id !== undefined && b.id !== null && !regras.UUID_REGEX.test(idReq)) return erro(res, 400, 'id_invalido');

    // ---- prévia: só monta o HTML (a página real do desafio), não grava nada
    if (b.acao === 'previa') {
      const titulo = linha(b.titulo, 120); if (!titulo) return erro(res, 400, 'titulo_invalido');
      return responder(res, 200, { ok: true, html: renderizarDesafio({ titulo, subtitulo: linha(b.subtitulo, 200), conteudo: b.conteudo }) });
    }

    // ---- salvar (cria ou atualiza o RASCUNHO)
    if (b.acao === 'salvar') {
      const titulo = linha(b.titulo, 120); if (!titulo) return erro(res, 400, 'titulo_invalido');
      const slug = typeof b.slug === 'string' ? b.slug.trim() : ''; if (!regras.slugValido(slug)) return erro(res, 400, 'slug_invalido');
      if (regras.excedeLimites(b.conteudo)) return erro(res, 413, 'limite_excedido');
      const conteudo = regras.normalizar(b.conteudo);
      if (JSON.stringify(conteudo).length > regras.MAX_JSON) return erro(res, 413, 'conteudo_grande');
      const campos = { slug, titulo, subtitulo: linha(b.subtitulo, 200), texto_original: typeof b.texto_original === 'string' ? b.texto_original.slice(0, 100000) : '', conteudo, atualizado_em: agora() };
      let r;
      if (idReq) {
        const at = await rest(cfg, 'desafios?id=eq.' + idReq + '&select=id,slug,status,primeira_publicacao_em&limit=1');
        if (!at.ok) return erro(res, 500, 'falha_consulta');
        if (!at.dados.length) return erro(res, 404, 'nao_encontrado');
        if (at.dados[0].primeira_publicacao_em && at.dados[0].slug !== slug) return erro(res, 409, 'slug_travado');
        r = await rest(cfg, 'desafios?id=eq.' + idReq, { metodo: 'PATCH', corpo: { ...campos, alteracoes_pendentes: at.dados[0].status === 'publicado' } });
      } else {
        r = await rest(cfg, 'desafios', { metodo: 'POST', corpo: { id: crypto.randomUUID(), status: 'rascunho', criado_em: campos.atualizado_em, ...campos } });
      }
      if (!r.ok) {
        if (r.status === 409 && r.codigo === '23505') return erro(res, 409, 'slug_em_uso');
        console.error('[desafios-admin] Falha ao salvar. HTTP', r.status, r.codigo);
        return erro(res, 500, 'falha_gravacao');
      }
      return responder(res, idReq ? 200 : 201, { ok: true, desafio: comLink(r.dados[0]) });
    }

    // as ações abaixo precisam de um desafio existente
    if (!['publicar', 'despublicar'].includes(b.acao)) return erro(res, 400, 'acao_invalida');
    if (!idReq) return erro(res, 400, 'id_invalido');
    const at = await rest(cfg, 'desafios?id=eq.' + idReq + '&select=*&limit=1');
    if (!at.ok) return erro(res, 500, 'falha_consulta');
    if (!at.dados.length) return erro(res, 404, 'nao_encontrado');
    const d = at.dados[0];

    if (b.acao === 'publicar') {
      const problemas = regras.validar(d.titulo, d.conteudo);
      if (problemas.length) return erro(res, 422, 'conteudo_invalido', { detalhes: problemas });
      if (d.status === 'publicado' && b.confirmar !== true) return erro(res, 409, 'confirmacao_necessaria');
      const agoraIso = agora();
      const r = await rest(cfg, 'desafios?id=eq.' + idReq, { metodo: 'PATCH', corpo: {
        status: 'publicado', pub_titulo: d.titulo, pub_subtitulo: d.subtitulo || '', pub_conteudo: regras.normalizar(d.conteudo),
        publicado_em: agoraIso, primeira_publicacao_em: d.primeira_publicacao_em || agoraIso, alteracoes_pendentes: false,
      } });
      if (!r.ok) { console.error('[desafios-admin] Falha ao publicar. HTTP', r.status); return erro(res, 500, 'falha_gravacao'); }
      return responder(res, 200, { ok: true, desafio: comLink(r.dados[0]) });
    }

    // despublicar
    if (d.status !== 'publicado') return erro(res, 409, 'nao_publicado');
    const r = await rest(cfg, 'desafios?id=eq.' + idReq, { metodo: 'PATCH', corpo: { status: 'despublicado' } });
    if (!r.ok) return erro(res, 500, 'falha_gravacao');
    return responder(res, 200, { ok: true, desafio: comLink(r.dados[0]) });
  } catch (err) {
    console.error('[desafios-admin] Erro:', err && err.name ? err.name : 'erro');
    return erro(res, 500, 'falha_interna');
  }
};
