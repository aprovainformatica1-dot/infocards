// =====================================================================
// API ADMINISTRATIVA da Central de Ofertas (protegida por "x-admin-key", igual às outras APIs)
//
//   GET  /api/ofertas-admin                   -> lista de ofertas (inclui pausadas)
//   POST /api/ofertas-admin { acao: 'salvar',  oferta }  -> cria ou atualiza uma oferta inteira (texto, versões e links)
//   POST /api/ofertas-admin { acao: 'pausar',  id, pausado }
//   POST /api/ofertas-admin { acao: 'previa',  oferta }  -> HTML da prévia, montado com a implementação REAL do card
//
// A Central é independente: NÃO lê nem escreve em materiais, links, cliques ou qualquer tabela do rastreamento.
// A capa é enviada pela API de imagens já existente (/api/dicas-imagens) e aqui só guardamos o id da imagem.
// =====================================================================

const crypto = require('crypto');
const { regras, responder, chaveValida, configuracao, rest, lerCorpo, renderizarDica } = require('./_dicas-lib.js');
const { ESTILOS, comWhatsApp, carregar } = require('./_ofertas-lib.js');

const UUID = regras.UUID_REGEX;
class Invalido extends Error { constructor(codigo, campo) { super(codigo); this.invalido = true; this.campo = campo; } }
const txt = (v, campo, max, obrigatorio) => {
  const t = typeof v === 'string' ? v.replace(/\r/g, '').trim() : '';
  if (obrigatorio && !t) throw new Invalido('campo_obrigatorio', campo);
  if (t.length > max) throw new Invalido('campo_longo', campo);
  return t;
};
const url = (v, campo) => {
  const t = txt(v, campo, 1000, true); let u;
  try { u = new URL(t); } catch (e) { throw new Invalido('url_invalida', campo); }
  if ((u.protocol !== 'https:' && u.protocol !== 'http:') || /[\s<>"']/.test(t)) throw new Invalido('url_invalida', campo);
  return t;
};
const idOpcional = (v, campo) => { if (!v) return null; if (typeof v !== 'string' || !UUID.test(v)) throw new Invalido('id_invalido', campo); return v; };
const garantir = (r, codigo) => { if (!r.ok) { const e = new Error(codigo || 'falha_gravacao'); e.http = r.status; e.codigo = r.codigo; throw e; } return r; };
const agora = () => new Date().toISOString();
const paragrafos = (t) => t.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

function lerOferta(b) {
  const o = b && typeof b.oferta === 'object' && b.oferta ? b.oferta : null; if (!o) throw new Invalido('corpo_invalido');
  if (!ESTILOS.includes(o.estilo)) throw new Invalido('estilo_invalido', 'estilo');
  const versao = (x, comNome) => ({
    id: idOpcional(x.id, 'versão'), nome: comNome ? txt(x.nome, 'nome da versão', 80, true) : 'Principal',
    titulo: txt(x.titulo, comNome ? 'título da versão' : 'título', 200, true), texto: txt(x.texto, comNome ? 'texto da versão' : 'texto', 1500), botao: txt(x.botao, comNome ? 'botão da versão' : 'botão', 60, true),
  });
  const alternativas = (Array.isArray(o.alternativas) ? o.alternativas : []).map((x) => versao(x || {}, true));
  if (alternativas.length > 5) throw new Invalido('muitas_versoes', 'versões de texto');
  const links = (Array.isArray(o.links) ? o.links : []).map((l) => ({ id: idOpcional(l && l.id, 'link'), nome: txt(l && l.nome, 'identificação do link', 80, true), url: url(l && l.url, 'URL do link'), preco: txt(l && l.preco, 'preço', 40) }));
  if (!links.length) throw new Invalido('falta_link', 'links');
  if (links.length > 10) throw new Invalido('muitos_links', 'links');
  return { id: idOpcional(o.id, 'id'), nome: txt(o.nome, 'nome interno', 100, true), estilo: o.estilo, capaId: idOpcional(o.capa_imagem_id, 'capa'), manterCapa: o.manter_capa_atual === true, principal: versao(o.principal || {}, false), alternativas, links };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return responder(res, 405, { ok: false, erro: 'metodo_nao_permitido' }); }
  const cfg = configuracao(true);
  if (!cfg) { console.error('[ofertas-admin] Variáveis de ambiente não configuradas.'); return responder(res, 500, { ok: false, erro: 'configuracao' }); }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return responder(res, 401, { ok: false, erro: 'chave_invalida' });

  const devolver = async (status, id) => { const todas = await carregar(cfg); return responder(res, status, { ok: true, oferta: todas.find((o) => o.id === id) || null }); };

  try {
    if (req.method === 'GET') return responder(res, 200, { ok: true, ofertas: await carregar(cfg), estilos: ESTILOS });
    const b = lerCorpo(req); if (!b) return responder(res, 400, { ok: false, erro: 'corpo_invalido' });

    // ------------------------------------------------------------ pausar / reativar
    if (b.acao === 'pausar') {
      const id = idOpcional(b.id, 'id'); if (!id) throw new Invalido('id_invalido', 'id');
      const r = garantir(await rest(cfg, 'ofertas_materiais?material_id=eq.' + id, { metodo: 'PATCH', corpo: { pausado: b.pausado === true, atualizado_em: agora() } }));
      if (!r.dados.length) return responder(res, 404, { ok: false, erro: 'nao_encontrada' });
      return devolver(200, id);
    }

    // ------------------------------------------------------------ prévia (implementação real: a página da dica)
    if (b.acao === 'previa') {
      const o = b.oferta || {}; const estilo = ESTILOS.includes(o.estilo) ? o.estilo : 'go a';
      const capa = typeof o.capa_url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(o.capa_url) ? o.capa_url : '';
      let alvo = 'https://devmapas.vercel.app/'; try { alvo = url(o.link, 'link'); } catch (e) { /* mantém o padrão */ }
      const ids = { m: crypto.randomUUID(), t: crypto.randomUUID(), l: crypto.randomUUID() };
      const material = {
        id: ids.m, chave: 'previa', nome: 'Prévia', tipo: '', cta: 'previa', icone: '🎁', classe: estilo, imagem: capa, capaEmoji: '', iconeWhatsapp: comWhatsApp(estilo), ordem: 0,
        textos: [{ id: ids.t, nome: 'Principal', kick: '', titulo: txt(o.titulo, 'título', 200), paragrafos: paragrafos(txt(o.texto, 'texto', 1500)), importante: '', botao: txt(o.botao, 'botão', 60) }],
        links: [{ id: ids.l, nome: 'previa', url: alvo, preco: '', botao: '', principal: true }],
      };
      // A página é a REAL (renderizarDica, o mesmo código e CSS da dica publicada). Só o carregamento das ofertas
      // é trocado pelo rascunho, para você ver o card antes de salvar.
      let html = renderizarDica({ titulo: 'Prévia da oferta', conteudo: { itens: [], q: [], o: [], of: [{ m: ids.m, t: ids.t, l: ids.l }] }, imagemUrl: '' });
      const tag = '<script src="/config/ofertas-api.js"></' + 'script>\n';
      if (!html.includes(tag)) return responder(res, 501, { ok: false, erro: 'previa_indisponivel' });
      html = html.replace(tag, tag + '<script>DevMapasOfertas.carregar = function () { return Promise.resolve([' + JSON.stringify(material).replace(/</g, '\\u003c') + ']); };</' + 'script>\n');
      html = html.replace('</body>', '<script>setTimeout(function () { var a = document.getElementById("area-ofertas"); if (a) a.scrollIntoView({ block: "center" }); }, 450);</' + 'script>\n</body>');
      return responder(res, 200, { ok: true, html });
    }

    // ------------------------------------------------------------ salvar (cria ou atualiza a oferta inteira)
    if (b.acao === 'salvar') {
      const d = lerOferta(b);
      if (d.capaId) { const im = garantir(await rest(cfg, 'dica_imagens?id=eq.' + d.capaId + '&select=id&limit=1'), 'falha_consulta'); if (!im.dados.length) throw new Invalido('imagem_nao_encontrada', 'capa'); }

      let id = d.id; const novo = !id;
      if (novo) {
        id = crypto.randomUUID(); const chave = 'o_' + crypto.randomBytes(4).toString('hex');
        garantir(await rest(cfg, 'ofertas_materiais', { metodo: 'POST', corpo: { material_id: id, chave, cta: chave, nome: d.nome, classe: d.estilo, capa_imagem_id: d.capaId, imagem_url: '', icone: '🎁', capa_emoji: '', icone_whatsapp: comWhatsApp(d.estilo), ordem: 0, pausado: false, criado_em: agora(), atualizado_em: agora() } }));
      } else {
        const ex = garantir(await rest(cfg, 'ofertas_materiais?material_id=eq.' + id + '&select=material_id&limit=1'), 'falha_consulta'); if (!ex.dados.length) return responder(res, 404, { ok: false, erro: 'nao_encontrada' });
        const campos = { nome: d.nome, classe: d.estilo, icone_whatsapp: comWhatsApp(d.estilo), atualizado_em: agora() };
        if (!d.manterCapa) { campos.capa_imagem_id = d.capaId; if (!d.capaId) campos.imagem_url = ''; }   // trocar/remover capa; "manter" não mexe (preserva capas antigas por URL)
        garantir(await rest(cfg, 'ofertas_materiais?material_id=eq.' + id, { metodo: 'PATCH', corpo: campos }));
      }

      // textos: o primeiro (ordem 0) é o principal; os outros são versões alternativas. Linhas que sumiram do formulário são removidas.
      const atuais = garantir(await rest(cfg, 'ofertas_textos?material_id=eq.' + id + '&select=id,nome&order=ordem.asc,criado_em.asc'), 'falha_consulta').dados;
      const idsAtuais = new Set(atuais.map((t) => t.id));
      const principalId = d.principal.id && idsAtuais.has(d.principal.id) ? d.principal.id : (atuais[0] && !d.principal.id ? atuais[0].id : null);
      const lista = [{ ...d.principal, id: principalId, nome: (atuais.find((t) => t.id === principalId) || {}).nome || 'Principal' }]
        .concat(d.alternativas.map((a) => ({ ...a, id: a.id && idsAtuais.has(a.id) && a.id !== principalId ? a.id : null })));
      const mantidos = new Set();
      for (let i = 0; i < lista.length; i++) {
        const t = lista[i], corpo = { nome: t.nome, titulo: t.titulo, paragrafos: paragrafos(t.texto), botao: t.botao, ativo: true, ordem: i, atualizado_em: agora() };
        if (t.id) { garantir(await rest(cfg, 'ofertas_textos?id=eq.' + t.id, { metodo: 'PATCH', corpo })); mantidos.add(t.id); }
        else { const nid = crypto.randomUUID(); garantir(await rest(cfg, 'ofertas_textos', { metodo: 'POST', corpo: { id: nid, material_id: id, kick: '', importante: '', criado_em: agora(), ...corpo } })); mantidos.add(nid); }
      }
      for (const t of atuais) if (!mantidos.has(t.id)) garantir(await rest(cfg, 'ofertas_textos?id=eq.' + t.id, { metodo: 'DELETE' }));

      // links: o primeiro da lista é o "principal" (o que o seletor sugere); os que sumiram do formulário são removidos.
      const ls = garantir(await rest(cfg, 'ofertas_links?material_id=eq.' + id + '&select=id'), 'falha_consulta').dados; const lsIds = new Set(ls.map((l) => l.id));
      garantir(await rest(cfg, 'ofertas_links?material_id=eq.' + id + '&principal=eq.true', { metodo: 'PATCH', corpo: { principal: false } }));   // libera o índice "um principal por oferta"
      const lMantidos = new Set();
      for (let i = 0; i < d.links.length; i++) {
        const l = d.links[i], corpo = { nome: l.nome, url: l.url, preco: l.preco, botao: '', ativo: true, principal: i === 0, ordem: i, atualizado_em: agora() };
        if (l.id && lsIds.has(l.id)) { garantir(await rest(cfg, 'ofertas_links?id=eq.' + l.id, { metodo: 'PATCH', corpo })); lMantidos.add(l.id); }
        else { const nid = crypto.randomUUID(); garantir(await rest(cfg, 'ofertas_links', { metodo: 'POST', corpo: { id: nid, material_id: id, criado_em: agora(), ...corpo } })); lMantidos.add(nid); }
      }
      for (const l of ls) if (!lMantidos.has(l.id)) garantir(await rest(cfg, 'ofertas_links?id=eq.' + l.id, { metodo: 'DELETE' }));
      return devolver(novo ? 201 : 200, id);
    }
    return responder(res, 400, { ok: false, erro: 'acao_invalida' });
  } catch (err) {
    if (err && err.invalido) return responder(res, 400, { ok: false, erro: err.message, campo: err.campo });
    console.error('[ofertas-admin] Erro:', err && err.message, err && err.http, err && err.codigo);
    return responder(res, 500, { ok: false, erro: err && err.message === 'falha_consulta' ? 'falha_consulta' : 'falha_gravacao' });
  }
};
