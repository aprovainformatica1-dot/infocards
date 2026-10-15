// =====================================================================
// API administrativa das Dicas (protegida por "x-admin-key", igual ao links-admin.js)
//
//   GET  /api/dicas-admin            -> lista das dicas
//   GET  /api/dicas-admin?id=UUID    -> uma dica completa (para editar)
//   POST /api/dicas-admin  { acao }  -> salvar | previa | publicar | despublicar | excluir
//
// Variáveis de ambiente (somente servidor): ANALYTICS_SUPABASE_URL,
// ANALYTICS_SUPABASE_SERVICE_ROLE_KEY, ANALYTICS_ADMIN_KEY (as mesmas do Analytics).
// Sem dependências. O navegador nunca recebe a service_role.
// =====================================================================

const crypto = require('crypto');
const { regras, BASE_DICA, responder, chaveValida, configuracao, rest, urlImagem, renderizarDica, lerCorpo } = require('./_dicas-lib.js');

const MAX_TEXTO = 100000;
const CAMPOS_LISTA = 'id,slug,titulo,status,alteracoes_pendentes,publicado_em,primeira_publicacao_em,atualizado_em,conteudo_id';

const erro = (res, status, codigo, extra) => responder(res, status, { ok: false, erro: codigo, ...(extra || {}) });
const linhaTitulo = (v) => regras.s(typeof v === 'string' ? v.replace(/\s+/g, ' ') : '');
const texto = (v) => (typeof v === 'string' ? v.slice(0, MAX_TEXTO) : '');

async function buscarImagem(cfg, id) {
  if (!id) return null;
  const r = await rest(cfg, 'dica_imagens?id=eq.' + id + '&select=id,nome,caminho&limit=1');
  if (!r.ok) throw new Error('imagem');
  return Array.isArray(r.dados) && r.dados.length ? r.dados[0] : null;
}

// Integração com o painel de links: cada dica publicada vira um registro em "conteudos"
// (nome = título), que o Gerador de Links já lista (GET /api/links-admin devolve conteudos).
// Não bloqueia a publicação se falhar: o resultado vai em "painel_links".
async function sincronizarPainelLinks(cfg, dica) {
  try {
    if (dica.conteudo_id) {
      const r = await rest(cfg, 'conteudos?id=eq.' + dica.conteudo_id, { metodo: 'PATCH', corpo: { nome: dica.titulo } });
      if (r.ok && Array.isArray(r.dados) && r.dados.length) return { ok: true, conteudo_id: dica.conteudo_id };
      if (!r.ok) return { ok: false, erro: 'falha_atualizar_conteudo', http: r.status };
      // o conteúdo foi apagado por fora: cria de novo abaixo
    }
    const id = crypto.randomUUID();
    const c = await rest(cfg, 'conteudos', { metodo: 'POST', corpo: { id, nome: dica.titulo, tipo: 'dica', criado_em: new Date().toISOString() } });
    if (!c.ok) return { ok: false, erro: c.codigo === '23514' ? 'tipo_conteudo_nao_aceito' : 'falha_criar_conteudo', http: c.status, codigo: c.codigo };
    const v = await rest(cfg, 'dicas?id=eq.' + dica.id, { metodo: 'PATCH', corpo: { conteudo_id: id } });
    if (!v.ok) return { ok: false, erro: 'falha_vincular_conteudo', http: v.status };
    return { ok: true, conteudo_id: id };
  } catch (e) {
    return { ok: false, erro: 'falha_painel_links' };
  }
}

const comLink = (d) => (d ? { ...d, link: BASE_DICA + d.slug } : d);

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return erro(res, 405, 'metodo_nao_permitido');
  }
  const cfg = configuracao(true);
  if (!cfg) {
    console.error('[dicas-admin] Variáveis de ambiente não configuradas.');
    return erro(res, 500, 'configuracao');
  }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return erro(res, 401, 'chave_invalida');

  try {
    // ------------------------------------------------------------ GET
    if (req.method === 'GET') {
      const id = req.query && typeof req.query.id === 'string' ? req.query.id : '';
      if (id) {
        if (!regras.UUID_REGEX.test(id)) return erro(res, 400, 'id_invalido');
        const r = await rest(cfg, 'dicas?id=eq.' + id + '&select=*&limit=1');
        if (!r.ok) return erro(res, 500, 'falha_consulta');
        if (!r.dados.length) return erro(res, 404, 'nao_encontrada');
        const d = r.dados[0];
        const img = await buscarImagem(cfg, d.og_imagem_id);
        return responder(res, 200, { ok: true, dica: comLink(d), imagem: img ? { id: img.id, nome: img.nome, url: urlImagem(cfg, img.caminho) } : null });
      }
      const r = await rest(cfg, 'dicas?select=' + CAMPOS_LISTA + '&order=atualizado_em.desc&limit=500');
      if (!r.ok) return erro(res, 500, 'falha_consulta');
      return responder(res, 200, { ok: true, dicas: r.dados.map(comLink) });
    }

    // ------------------------------------------------------------ POST
    const b = lerCorpo(req);
    if (!b) return erro(res, 400, 'corpo_invalido');
    const idReq = typeof b.id === 'string' ? b.id : '';
    if (b.id !== undefined && b.id !== null && !regras.UUID_REGEX.test(idReq)) return erro(res, 400, 'id_invalido');

    // ---- previa: só monta o HTML, não grava nada
    if (b.acao === 'previa') {
      const titulo = linhaTitulo(b.titulo);
      if (!titulo) return erro(res, 400, 'titulo_invalido');
      let img = null;
      if (b.og_imagem_id) {
        if (!regras.UUID_REGEX.test(b.og_imagem_id)) return erro(res, 400, 'imagem_invalida');
        img = await buscarImagem(cfg, b.og_imagem_id);
      }
      return responder(res, 200, { ok: true, html: renderizarDica({ titulo, conteudo: b.conteudo, imagemUrl: img ? urlImagem(cfg, img.caminho) : '' }) });
    }

    // ---- salvar (cria ou atualiza o RASCUNHO; a versão pública só muda ao publicar)
    if (b.acao === 'salvar') {
      const titulo = linhaTitulo(b.titulo);
      if (!titulo || titulo.length > 120) return erro(res, 400, 'titulo_invalido');
      const slug = typeof b.slug === 'string' ? b.slug.trim() : '';
      if (!regras.slugValido(slug)) return erro(res, 400, 'slug_invalido');
      const conteudo = regras.normalizar(b.conteudo);
      if (JSON.stringify(conteudo).length > regras.MAX_JSON) return erro(res, 413, 'conteudo_grande');
      let ogId = null;
      if (b.og_imagem_id) {
        if (!regras.UUID_REGEX.test(b.og_imagem_id)) return erro(res, 400, 'imagem_invalida');
        if (!(await buscarImagem(cfg, b.og_imagem_id))) return erro(res, 404, 'imagem_nao_encontrada');
        ogId = b.og_imagem_id;
      }
      const campos = {
        slug, titulo, texto_original: texto(b.texto_original), questoes_originais: texto(b.questoes_originais),
        conteudo, og_imagem_id: ogId, atualizado_em: new Date().toISOString(),
      };
      let r;
      if (idReq) {
        const at = await rest(cfg, 'dicas?id=eq.' + idReq + '&select=id,slug,status,primeira_publicacao_em&limit=1');
        if (!at.ok) return erro(res, 500, 'falha_consulta');
        if (!at.dados.length) return erro(res, 404, 'nao_encontrada');
        if (at.dados[0].primeira_publicacao_em && at.dados[0].slug !== slug) return erro(res, 409, 'slug_travado');
        r = await rest(cfg, 'dicas?id=eq.' + idReq, { metodo: 'PATCH', corpo: { ...campos, alteracoes_pendentes: at.dados[0].status === 'publicada' } });
      } else {
        r = await rest(cfg, 'dicas', { metodo: 'POST', corpo: { id: crypto.randomUUID(), status: 'rascunho', criado_em: campos.atualizado_em, ...campos } });
      }
      if (!r.ok) {
        if (r.status === 409 && r.codigo === '23505') return erro(res, 409, 'slug_em_uso');
        console.error('[dicas-admin] Falha ao salvar. HTTP', r.status, r.codigo);
        return erro(res, 500, 'falha_gravacao');
      }
      return responder(res, idReq ? 200 : 201, { ok: true, dica: comLink(r.dados[0]) });
    }

    // as ações abaixo precisam de uma dica existente
    if (!['publicar', 'despublicar', 'excluir'].includes(b.acao)) return erro(res, 400, 'acao_invalida');
    if (!idReq) return erro(res, 400, 'id_invalido');
    const at = await rest(cfg, 'dicas?id=eq.' + idReq + '&select=*&limit=1');
    if (!at.ok) return erro(res, 500, 'falha_consulta');
    if (!at.dados.length) return erro(res, 404, 'nao_encontrada');
    const d = at.dados[0];

    if (b.acao === 'publicar') {
      const problemas = regras.validar(d.titulo, d.conteudo);
      if (problemas.length) return erro(res, 422, 'conteudo_invalido', { detalhes: problemas });
      if (d.status === 'publicada' && b.confirmar !== true) return erro(res, 409, 'confirmacao_necessaria');
      const img = await buscarImagem(cfg, d.og_imagem_id);
      const agora = new Date().toISOString();
      const r = await rest(cfg, 'dicas?id=eq.' + idReq, { metodo: 'PATCH', corpo: {
        status: 'publicada', pub_titulo: d.titulo, pub_conteudo: regras.normalizar(d.conteudo),
        pub_og_imagem_id: img ? img.id : null, pub_og_caminho: img ? img.caminho : null,
        publicado_em: agora, primeira_publicacao_em: d.primeira_publicacao_em || agora, alteracoes_pendentes: false,
      } });
      if (!r.ok) { console.error('[dicas-admin] Falha ao publicar. HTTP', r.status); return erro(res, 500, 'falha_gravacao'); }
      const nova = r.dados[0];
      const painel = await sincronizarPainelLinks(cfg, nova);
      return responder(res, 200, { ok: true, dica: comLink({ ...nova, conteudo_id: painel.conteudo_id || nova.conteudo_id }), painel_links: painel });
    }

    if (b.acao === 'despublicar') {
      if (d.status !== 'publicada') return erro(res, 409, 'nao_publicada');
      const r = await rest(cfg, 'dicas?id=eq.' + idReq, { metodo: 'PATCH', corpo: { status: 'despublicada' } });
      if (!r.ok) return erro(res, 500, 'falha_gravacao');
      return responder(res, 200, { ok: true, dica: comLink(r.dados[0]) });
    }

    // excluir: a dica some; o registro em "conteudos" e os links/cliques do Analytics ficam preservados.
    if (b.confirmar !== true) return erro(res, 409, 'confirmacao_necessaria');
    const r = await rest(cfg, 'dicas?id=eq.' + idReq, { metodo: 'DELETE' });
    if (!r.ok) return erro(res, 500, 'falha_gravacao');
    return responder(res, 200, { ok: true });
  } catch (err) {
    console.error('[dicas-admin] Erro:', err && err.name ? err.name : 'erro');
    return erro(res, 500, 'falha_interna');
  }
};
