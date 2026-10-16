// =====================================================================
// API ADMINISTRATIVA da Central de Ofertas (protegida por "x-admin-key", igual às outras APIs)
//
//   GET  /api/ofertas-admin             -> todos os materiais (com pausados), textos e links
//   POST /api/ofertas-admin { acao }    -> criar_material | salvar_material | pausar_material
//                                          salvar_texto | pausar_texto | excluir_texto
//                                          salvar_link  | pausar_link  | excluir_link
//                                          importar_legado
//
// Mesmas variáveis de ambiente do Analytics (somente servidor). Sem dependências.
// Regras que protegem o que já existe:
//  - "pausar" NÃO mexe em materiais.ativo (os links /r/ já espalhados continuam funcionando);
//  - o link marcado como PRINCIPAL é copiado para materiais.destino_url (o que o /r/ usa como destino padrão);
//  - materiais nunca são apagados por aqui; só textos e links (com confirmação).
// =====================================================================

const crypto = require('crypto');
const { responder, chaveValida, configuracao, rest, lerCorpo } = require('./_dicas-lib.js');
const { TIPOS, CLASSES, carregar } = require('./_ofertas-lib.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CHAVE = /^[a-z0-9_]{2,40}$/;

class Invalido extends Error { constructor(codigo, campo) { super(codigo); this.invalido = true; this.campo = campo; } }
const glifos = (v) => [...String(v)].length;
const txt = (v, campo, max, obrigatorio) => {
  const t = typeof v === 'string' ? v.replace(/\r/g, '').trim() : '';
  if (obrigatorio && !t) throw new Invalido('campo_obrigatorio', campo);
  if (t.length > max) throw new Invalido('campo_longo', campo);
  return t;
};
const emoji = (v, campo, padrao) => { const t = typeof v === 'string' ? v.trim() : ''; if (!t) return padrao; if (glifos(t) > 6) throw new Invalido('campo_longo', campo); return t; };
const url = (v, campo, obrigatorio, apenasHttps) => {
  const t = txt(v, campo, 1000, obrigatorio); if (!t) return '';
  let u; try { u = new URL(t); } catch (e) { throw new Invalido('url_invalida', campo); }
  if (!(u.protocol === 'https:' || (!apenasHttps && u.protocol === 'http:')) || /[\s<>"']/.test(t)) throw new Invalido('url_invalida', campo);
  return u.href === t || u.href === t + '/' ? t : t;
};
const inteiro = (v, campo, min, max, padrao) => { if (v === undefined || v === null || v === '') return padrao; const n = Number(v); if (!Number.isInteger(n) || n < min || n > max) throw new Invalido('numero_invalido', campo); return n; };
const uuid = (v, campo) => { if (typeof v !== 'string' || !UUID.test(v)) throw new Invalido('id_invalido', campo); return v; };
const garantir = (r, codigo) => { if (!r.ok) { const e = new Error(codigo || 'falha_gravacao'); e.http = r.status; e.codigo = r.codigo; throw e; } return r; };
const agora = () => new Date().toISOString();
const slugChave = (nome) => nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 34) || 'material';

function lerMaterial(b, existente) {
  return {
    nome: txt(b.nome, 'nome', 100, true),
    tipo: (() => { if (!TIPOS.includes(b.tipo)) throw new Invalido('tipo_invalido', 'tipo'); return b.tipo; })(),
    icone: emoji(b.icone, 'icone', '🎁'),
    classe: (() => { const c = b.classe === undefined || b.classe === '' ? 'go b' : b.classe; if (!CLASSES.includes(c)) throw new Invalido('classe_invalida', 'classe'); return c; })(),
    imagem_url: url(b.imagem_url, 'imagem_url', false, true),
    capa_emoji: emoji(b.capa_emoji, 'capa_emoji', ''),
    icone_whatsapp: b.icone_whatsapp === true,
    ordem: inteiro(b.ordem, 'ordem', 0, 999, existente ? existente.ordem : 0),
    cta: (() => { const c = typeof b.cta === 'string' ? b.cta.trim() : ''; if (c && !CHAVE.test(c)) throw new Invalido('cta_invalido', 'cta'); return c; })(),
  };
}
function lerTexto(b) {
  const paragrafos = (Array.isArray(b.paragrafos) ? b.paragrafos : []).map((p) => (typeof p === 'string' ? p.replace(/\r/g, '').trim() : '')).filter(Boolean);
  if (paragrafos.length > 8) throw new Invalido('muitos_paragrafos', 'paragrafos');
  if (paragrafos.some((p) => p.length > 800)) throw new Invalido('campo_longo', 'paragrafos');
  return { nome: txt(b.nome, 'nome', 80, true), kick: txt(b.kick, 'kick', 120), titulo: txt(b.titulo, 'titulo', 200, true), paragrafos, importante: txt(b.importante, 'importante', 500) };
}
function lerLink(b) {
  return { nome: txt(b.nome, 'nome', 80, true), url: url(b.url, 'url', true, false), preco: txt(b.preco, 'preco', 40), botao: txt(b.botao, 'botao', 60, true) };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return responder(res, 405, { ok: false, erro: 'metodo_nao_permitido' }); }
  const cfg = configuracao(true);
  if (!cfg) { console.error('[ofertas-admin] Variáveis de ambiente não configuradas.'); return responder(res, 500, { ok: false, erro: 'configuracao' }); }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return responder(res, 401, { ok: false, erro: 'chave_invalida' });

  const um = async (tabela, filtro) => { const r = garantir(await rest(cfg, tabela + '?' + filtro + '&select=*&limit=1'), 'falha_consulta'); return r.dados[0] || null; };
  const materialExiste = async (id) => { const r = garantir(await rest(cfg, 'materiais?id=eq.' + id + '&select=id,nome,destino_url&limit=1'), 'falha_consulta'); return r.dados[0] || null; };
  const devolver = async (status, id, extra) => { const todos = await carregar(cfg); return responder(res, status, { ok: true, material: todos.find((m) => m.id === id) || null, ...(extra || {}) }); };

  async function chaveLivre(base) {
    const r = garantir(await rest(cfg, 'ofertas_materiais?select=chave&limit=1000'), 'falha_consulta'); const usadas = new Set(r.dados.map((x) => x.chave));
    let c = base, n = 2; while (usadas.has(c)) c = base.slice(0, 36) + '_' + n++; return c;
  }
  async function garantirOferta(m, campos) {                   // cria a "vitrine" do material se ainda não existir
    const ja = await um('ofertas_materiais', 'material_id=eq.' + m.id); if (ja) return ja;
    const chave = campos && campos.chave ? campos.chave : await chaveLivre(slugChave(m.nome));
    const base = { material_id: m.id, chave, cta: (campos && campos.cta) || chave, icone: '🎁', classe: 'go b', imagem_url: '', capa_emoji: '', icone_whatsapp: false, ordem: 0, pausado: false, criado_em: agora(), atualizado_em: agora(), ...(campos || {}) };
    garantir(await rest(cfg, 'ofertas_materiais', { metodo: 'POST', corpo: base }), 'falha_gravacao'); return base;
  }
  async function sincronizarDestino(materialId) {              // principal -> materiais.destino_url (usado pelo /r/)
    const p = await um('ofertas_links', 'material_id=eq.' + materialId + '&principal=eq.true'); if (!p) return;
    garantir(await rest(cfg, 'materiais?id=eq.' + materialId, { metodo: 'PATCH', corpo: { destino_url: p.url } }));
  }
  async function tornarPrincipal(materialId, linkId) {
    garantir(await rest(cfg, 'ofertas_links?material_id=eq.' + materialId + '&principal=eq.true&id=neq.' + linkId, { metodo: 'PATCH', corpo: { principal: false } }));
    garantir(await rest(cfg, 'ofertas_links?id=eq.' + linkId, { metodo: 'PATCH', corpo: { principal: true } }));
  }
  async function proximaOrdem(tabela, materialId) {
    const r = garantir(await rest(cfg, tabela + '?material_id=eq.' + materialId + '&select=ordem&order=ordem.desc&limit=1'), 'falha_consulta'); return r.dados.length ? (r.dados[0].ordem || 0) + 1 : 1;
  }
  async function criarMaterialCompleto({ nome, tipo, link, botao, extra }) {
    const id = crypto.randomUUID();
    garantir(await rest(cfg, 'materiais', { metodo: 'POST', corpo: { id, nome, tipo, destino_url: link, ativo: true, criado_em: agora() } }), 'falha_criar_material');
    try {
      await garantirOferta({ id, nome }, extra);
      garantir(await rest(cfg, 'ofertas_links', { metodo: 'POST', corpo: { id: crypto.randomUUID(), material_id: id, nome: 'Link principal', url: link, preco: '', botao, principal: true, ativo: true, ordem: 1, criado_em: agora(), atualizado_em: agora() } }));
    } catch (e) { await rest(cfg, 'materiais?id=eq.' + id, { metodo: 'DELETE' }).catch(() => null); throw e; }      // desfaz se algo falhar no meio
    return id;
  }

  try {
    if (req.method === 'GET') return responder(res, 200, { ok: true, materiais: await carregar(cfg), tipos: TIPOS, classes: CLASSES });

    const b = lerCorpo(req); if (!b) return responder(res, 400, { ok: false, erro: 'corpo_invalido' });

    switch (b.acao) {
      // ------------------------------------------------------------ materiais
      case 'criar_material': {
        const d = lerMaterial(b, null); const link = url(b.url, 'url', true, false), botao = txt(b.botao, 'botao', 60, true);
        let chave = typeof b.chave === 'string' ? b.chave.trim() : ''; if (chave && !CHAVE.test(chave)) throw new Invalido('chave_invalida', 'chave');
        if (!chave) chave = await chaveLivre(slugChave(d.nome));
        const id = await criarMaterialCompleto({ nome: d.nome, tipo: d.tipo, link, botao, extra: { chave, cta: d.cta || chave, icone: d.icone, classe: d.classe, imagem_url: d.imagem_url, capa_emoji: d.capa_emoji, icone_whatsapp: d.icone_whatsapp, ordem: d.ordem } });
        return devolver(201, id);
      }
      case 'salvar_material': {
        const id = uuid(b.material_id, 'material_id'), m = await materialExiste(id); if (!m) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        const ex = await um('ofertas_materiais', 'material_id=eq.' + id); const d = lerMaterial(b, ex);
        garantir(await rest(cfg, 'materiais?id=eq.' + id, { metodo: 'PATCH', corpo: { nome: d.nome, tipo: d.tipo } }));
        const campos = { icone: d.icone, classe: d.classe, imagem_url: d.imagem_url, capa_emoji: d.capa_emoji, icone_whatsapp: d.icone_whatsapp, ordem: d.ordem, atualizado_em: agora() };
        if (ex) { if (d.cta) campos.cta = d.cta; garantir(await rest(cfg, 'ofertas_materiais?material_id=eq.' + id, { metodo: 'PATCH', corpo: campos })); }
        else await garantirOferta({ id, nome: d.nome }, { ...campos, ...(d.cta ? { cta: d.cta } : {}) });      // a chave legada nunca muda depois de criada
        return devolver(200, id);
      }
      case 'pausar_material': {
        const id = uuid(b.material_id, 'material_id'), m = await materialExiste(id); if (!m) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        await garantirOferta(m);
        garantir(await rest(cfg, 'ofertas_materiais?material_id=eq.' + id, { metodo: 'PATCH', corpo: { pausado: b.pausado === true, atualizado_em: agora() } }));
        return devolver(200, id);
      }
      // ------------------------------------------------------------ textos
      case 'salvar_texto': {
        const d = lerTexto(b); let id = b.id ? uuid(b.id, 'id') : null, materialId;
        if (id) { const t = await um('ofertas_textos', 'id=eq.' + id); if (!t) return responder(res, 404, { ok: false, erro: 'nao_encontrado' }); materialId = t.material_id; garantir(await rest(cfg, 'ofertas_textos?id=eq.' + id, { metodo: 'PATCH', corpo: { ...d, atualizado_em: agora() } })); }
        else {
          materialId = uuid(b.material_id, 'material_id'); const m = await materialExiste(materialId); if (!m) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
          await garantirOferta(m); id = crypto.randomUUID();
          garantir(await rest(cfg, 'ofertas_textos', { metodo: 'POST', corpo: { id, material_id: materialId, ...d, ativo: true, ordem: await proximaOrdem('ofertas_textos', materialId), criado_em: agora(), atualizado_em: agora() } }));
        }
        return devolver(b.id ? 200 : 201, materialId);
      }
      case 'pausar_texto': {
        const id = uuid(b.id, 'id'), t = await um('ofertas_textos', 'id=eq.' + id); if (!t) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        garantir(await rest(cfg, 'ofertas_textos?id=eq.' + id, { metodo: 'PATCH', corpo: { ativo: b.ativo === true, atualizado_em: agora() } })); return devolver(200, t.material_id);
      }
      case 'excluir_texto': {
        if (b.confirmar !== true) return responder(res, 409, { ok: false, erro: 'confirmacao_necessaria' });
        const id = uuid(b.id, 'id'), t = await um('ofertas_textos', 'id=eq.' + id); if (!t) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        garantir(await rest(cfg, 'ofertas_textos?id=eq.' + id, { metodo: 'DELETE' })); return devolver(200, t.material_id);
      }
      // ------------------------------------------------------------ links
      case 'salvar_link': {
        const d = lerLink(b); let id = b.id ? uuid(b.id, 'id') : null, materialId;
        if (id) { const l = await um('ofertas_links', 'id=eq.' + id); if (!l) return responder(res, 404, { ok: false, erro: 'nao_encontrado' }); materialId = l.material_id; garantir(await rest(cfg, 'ofertas_links?id=eq.' + id, { metodo: 'PATCH', corpo: { ...d, atualizado_em: agora() } })); }
        else {
          materialId = uuid(b.material_id, 'material_id'); const m = await materialExiste(materialId); if (!m) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
          await garantirOferta(m); id = crypto.randomUUID();
          garantir(await rest(cfg, 'ofertas_links', { metodo: 'POST', corpo: { id, material_id: materialId, ...d, principal: false, ativo: true, ordem: await proximaOrdem('ofertas_links', materialId), criado_em: agora(), atualizado_em: agora() } }));
        }
        const temPrincipal = await um('ofertas_links', 'material_id=eq.' + materialId + '&principal=eq.true');
        if (b.principal === true || !temPrincipal) await tornarPrincipal(materialId, id);       // sempre existe um principal
        await sincronizarDestino(materialId);
        return devolver(b.id ? 200 : 201, materialId);
      }
      case 'pausar_link': {
        const id = uuid(b.id, 'id'), l = await um('ofertas_links', 'id=eq.' + id); if (!l) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        garantir(await rest(cfg, 'ofertas_links?id=eq.' + id, { metodo: 'PATCH', corpo: { ativo: b.ativo === true, atualizado_em: agora() } })); return devolver(200, l.material_id);
      }
      case 'excluir_link': {
        if (b.confirmar !== true) return responder(res, 409, { ok: false, erro: 'confirmacao_necessaria' });
        const id = uuid(b.id, 'id'), l = await um('ofertas_links', 'id=eq.' + id); if (!l) return responder(res, 404, { ok: false, erro: 'nao_encontrado' });
        garantir(await rest(cfg, 'ofertas_links?id=eq.' + id, { metodo: 'DELETE' }));
        if (l.principal) {                                    // promove outro link; se não houver, o destino atual do material é mantido
          const prox = await um('ofertas_links', 'material_id=eq.' + l.material_id + '&ativo=eq.true&order=ordem.asc');
          if (prox) { await tornarPrincipal(l.material_id, prox.id); await sincronizarDestino(l.material_id); }
        }
        return devolver(200, l.material_id);
      }
      // ------------------------------------------------------------ importação do config/ofertas.js (uma vez, a pedido)
      case 'importar_legado': {
        const itens = Array.isArray(b.itens) ? b.itens.slice(0, 30) : []; if (!itens.length) throw new Invalido('nada_para_importar', 'itens');
        const todos = await carregar(cfg), norm = (u) => String(u || '').trim().replace(/\/+$/, '').toLowerCase();
        const chavesUsadas = new Set(todos.filter((m) => m.oferta).map((m) => m.oferta.chave));
        const tipoPorChave = { simulado: 'simulado', mapas: 'mapa', personalizado: 'personalizado', grupo: 'grupo', atalhos: 'cartilha' };
        const relatorio = { importados: [], ja_existiam: [], sem_correspondencia: [], criados: [], erros: [] };
        for (let i = 0; i < itens.length; i++) {
          const it = itens[i] || {};
          try {
            const chave = String(it.chave || it.id || '').trim(); if (!CHAVE.test(chave)) throw new Invalido('chave_invalida', 'chave');
            const link = url(it.link, 'link', true, false), botao = txt(it.botao, 'botao', 60, true);
            const t = lerTexto({ nome: 'Texto padrão', kick: it.kick, titulo: it.titulo, paragrafos: it.textos, importante: it.importante });
            const m = lerMaterial({ nome: it.nome || chave, tipo: tipoPorChave[chave] || 'mapa', icone: it.icone, classe: it.classe, imagem_url: it.imagem, capa_emoji: it.capaEmoji, icone_whatsapp: it.iconeWhatsapp === true, ordem: i, cta: it.cta }, null);
            if (chavesUsadas.has(chave)) { relatorio.ja_existiam.push(chave); continue; }
            const achados = todos.filter((x) => !x.oferta && norm(x.destino_url) === norm(link));
            let materialId;
            if (achados.length === 1) {
              materialId = achados[0].id;
              await garantirOferta({ id: materialId, nome: achados[0].nome }, { chave, cta: m.cta || chave, icone: m.icone, classe: m.classe, imagem_url: m.imagem_url, capa_emoji: m.capa_emoji, icone_whatsapp: m.icone_whatsapp, ordem: i });
              garantir(await rest(cfg, 'ofertas_links', { metodo: 'POST', corpo: { id: crypto.randomUUID(), material_id: materialId, nome: 'Link principal', url: link, preco: '', botao, principal: true, ativo: true, ordem: 1, criado_em: agora(), atualizado_em: agora() } }));
              relatorio.importados.push({ chave, material: achados[0].nome });
            } else if (achados.length > 1) { relatorio.sem_correspondencia.push({ chave, motivo: 'mais de um material com este mesmo destino' }); continue; }
            else if (b.criar_novos === true) {
              materialId = await criarMaterialCompleto({ nome: m.nome, tipo: m.tipo, link, botao, extra: { chave, cta: m.cta || chave, icone: m.icone, classe: m.classe, imagem_url: m.imagem_url, capa_emoji: m.capa_emoji, icone_whatsapp: m.icone_whatsapp, ordem: i } });
              relatorio.criados.push({ chave, material: m.nome });
            } else { relatorio.sem_correspondencia.push({ chave, motivo: 'nenhum material do Analytics tem este link como destino' }); continue; }
            garantir(await rest(cfg, 'ofertas_textos', { metodo: 'POST', corpo: { id: crypto.randomUUID(), material_id: materialId, ...t, ativo: true, ordem: 1, criado_em: agora(), atualizado_em: agora() } }));
            chavesUsadas.add(chave);
          } catch (e) { relatorio.erros.push({ chave: it.chave || it.id || '?', erro: e.invalido ? e.message + (e.campo ? ' (' + e.campo + ')' : '') : e.message }); }
        }
        return responder(res, 200, { ok: true, relatorio, materiais: await carregar(cfg) });
      }
      default: return responder(res, 400, { ok: false, erro: 'acao_invalida' });
    }
  } catch (err) {
    if (err && err.invalido) return responder(res, 400, { ok: false, erro: err.message, campo: err.campo });
    if (err && err.codigo === '23505') return responder(res, 409, { ok: false, erro: 'chave_em_uso' });
    console.error('[ofertas-admin] Erro:', err && err.message, err && err.http, err && err.codigo);
    return responder(res, 500, { ok: false, erro: (err && err.message) === 'falha_consulta' ? 'falha_consulta' : 'falha_gravacao' });
  }
};
