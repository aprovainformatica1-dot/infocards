// =====================================================================
// API da biblioteca de imagens das Dicas (protegida por "x-admin-key")
//
//   GET  /api/dicas-imagens?q=texto&pagina=1   -> miniaturas, busca por nome, paginação
//   POST { acao:'buscar_hash', hash_origem }   -> imagem já cadastrada com o mesmo arquivo?
//   POST { acao:'enviar', nome, hash_origem, dados }  -> grava no Storage (sem duplicar)
//   POST { acao:'excluir', id }                -> só se nenhuma dica usa a imagem
//
// Arquivos ficam no Supabase Storage (bucket público "dicas-imagens"), com nome = hash do conteúdo.
// Sem dependências. A service_role só existe no servidor.
// =====================================================================

const crypto = require('crypto');
const { regras, BUCKET, responder, chaveValida, configuracao, fetchComTimeout, rest, urlImagem, lerCorpo } = require('./_dicas-lib.js');

const POR_PAGINA = 12;
const MAX_BYTES = 2.5 * 1024 * 1024;       // o navegador já reduz a imagem antes de enviar
const HASH_REGEX = /^[0-9a-f]{64}$/;
const erro = (res, status, codigo, extra) => responder(res, status, { ok: false, erro: codigo, ...(extra || {}) });

// Tipo real do arquivo pelos primeiros bytes (não confia no que o navegador diz).
function tipoReal(buf) {
  if (buf.length > 12 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (buf.length > 12 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mime: 'image/png', ext: 'png' };
  if (buf.length > 12 && buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

const limparNome = (v) => regras.s(String(v || '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ')).slice(0, 80);
const publica = (cfg, i) => ({ id: i.id, nome: i.nome, url: urlImagem(cfg, i.caminho), largura: i.largura, altura: i.altura, tamanho: i.tamanho, criado_em: i.criado_em });
const CAMPOS = 'id,nome,caminho,largura,altura,tamanho,criado_em';

async function porHash(cfg, coluna, hash) {
  const r = await rest(cfg, 'dica_imagens?' + coluna + '=eq.' + hash + '&select=' + CAMPOS + '&limit=1');
  if (!r.ok) throw new Error('consulta');
  return r.dados.length ? r.dados[0] : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return erro(res, 405, 'metodo_nao_permitido');
  }
  const cfg = configuracao(true);
  if (!cfg) { console.error('[dicas-imagens] Variáveis de ambiente não configuradas.'); return erro(res, 500, 'configuracao'); }
  if (!chaveValida(req.headers && req.headers['x-admin-key'], cfg.adminKey)) return erro(res, 401, 'chave_invalida');

  try {
    // ------------------------------------------------------------ GET: lista paginada
    if (req.method === 'GET') {
      const q = limparNome(req.query && req.query.q).replace(/[*%,()\\:.]/g, ' ').trim();
      let pagina = parseInt(req.query && req.query.pagina, 10);
      if (!(pagina >= 1)) pagina = 1;
      const filtro = q ? '&nome=ilike.' + encodeURIComponent('*' + q + '*') : '';
      const r = await rest(cfg, 'dica_imagens?select=' + CAMPOS + filtro + '&order=criado_em.desc&limit=' + POR_PAGINA + '&offset=' + ((pagina - 1) * POR_PAGINA), { extra: { Prefer: 'count=exact' } });
      if (!r.ok) return erro(res, 500, 'falha_consulta');
      const total = r.total === null ? r.dados.length : r.total;
      return responder(res, 200, { ok: true, imagens: r.dados.map((i) => publica(cfg, i)), total, pagina, por_pagina: POR_PAGINA, paginas: Math.max(1, Math.ceil(total / POR_PAGINA)) });
    }

    const b = lerCorpo(req);
    if (!b) return erro(res, 400, 'corpo_invalido');

    // ------------------------------------------------------------ POST buscar_hash
    if (b.acao === 'buscar_hash') {
      if (typeof b.hash_origem !== 'string' || !HASH_REGEX.test(b.hash_origem)) return erro(res, 400, 'hash_invalido');
      const i = await porHash(cfg, 'hash_origem', b.hash_origem);
      return responder(res, 200, { ok: true, imagem: i ? publica(cfg, i) : null });
    }

    // ------------------------------------------------------------ POST enviar
    if (b.acao === 'enviar') {
      if (typeof b.dados !== 'string' || !b.dados) return erro(res, 400, 'dados_invalidos');
      if (typeof b.hash_origem !== 'string' || !HASH_REGEX.test(b.hash_origem)) return erro(res, 400, 'hash_invalido');
      const buf = Buffer.from(b.dados, 'base64');
      if (!buf.length || buf.length > MAX_BYTES) return erro(res, 413, 'imagem_grande');
      const tipo = tipoReal(buf);
      if (!tipo) return erro(res, 415, 'tipo_nao_aceito');

      const hash = crypto.createHash('sha256').update(buf).digest('hex');
      const ja = (await porHash(cfg, 'hash', hash)) || (await porHash(cfg, 'hash_origem', b.hash_origem));
      if (ja) return responder(res, 200, { ok: true, duplicada: true, imagem: publica(cfg, ja) });

      const caminho = hash + '.' + tipo.ext;
      const up = await fetchComTimeout(cfg.supabaseUrl + '/storage/v1/object/' + BUCKET + '/' + caminho, {
        method: 'POST',
        headers: { ...cfg.headers, 'Content-Type': tipo.mime, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
        body: buf,
      }, 20000);
      if (!up.ok && up.status !== 409 && up.status !== 400) { console.error('[dicas-imagens] Falha no Storage. HTTP', up.status); return erro(res, 502, 'falha_storage'); }
      if (!up.ok) {
        // 400/409 = o arquivo já existe no bucket (ex.: envio anterior interrompido antes de gravar o registro): reaproveita.
        const txt = await up.text().catch(() => '');
        if (!/exist|duplicate/i.test(txt)) { console.error('[dicas-imagens] Storage recusou. HTTP', up.status); return erro(res, 502, 'falha_storage'); }
      }

      const largura = Number.isInteger(b.largura) && b.largura > 0 && b.largura < 20000 ? b.largura : null;
      const altura = Number.isInteger(b.altura) && b.altura > 0 && b.altura < 20000 ? b.altura : null;
      const nome = limparNome(b.nome) || 'imagem-' + hash.slice(0, 8);
      const reg = await rest(cfg, 'dica_imagens', { metodo: 'POST', corpo: {
        id: crypto.randomUUID(), nome, caminho, hash, hash_origem: b.hash_origem, mime: tipo.mime,
        largura, altura, tamanho: buf.length, criado_em: new Date().toISOString(),
      } });
      if (!reg.ok) {
        if (reg.status === 409 && reg.codigo === '23505') {            // corrida: alguém acabou de gravar a mesma imagem
          const outra = (await porHash(cfg, 'hash', hash)) || (await porHash(cfg, 'hash_origem', b.hash_origem));
          if (outra) return responder(res, 200, { ok: true, duplicada: true, imagem: publica(cfg, outra) });
        }
        console.error('[dicas-imagens] Falha ao gravar o registro. HTTP', reg.status, reg.codigo);
        return erro(res, 500, 'falha_gravacao');
      }
      return responder(res, 201, { ok: true, duplicada: false, imagem: publica(cfg, reg.dados[0]) });
    }

    // ------------------------------------------------------------ POST excluir (nunca apaga imagem em uso)
    if (b.acao === 'excluir') {
      if (typeof b.id !== 'string' || !regras.UUID_REGEX.test(b.id)) return erro(res, 400, 'id_invalido');
      const im = await rest(cfg, 'dica_imagens?id=eq.' + b.id + '&select=id,caminho&limit=1');
      if (!im.ok) return erro(res, 500, 'falha_consulta');
      if (!im.dados.length) return erro(res, 404, 'nao_encontrada');
      const uso = await rest(cfg, 'dicas?or=(og_imagem_id.eq.' + b.id + ',pub_og_imagem_id.eq.' + b.id + ')&select=titulo&limit=5');
      if (!uso.ok) return erro(res, 500, 'falha_consulta');
      if (uso.dados.length) return erro(res, 409, 'imagem_em_uso', { dicas: uso.dados.map((d) => d.titulo) });
      const del = await rest(cfg, 'dica_imagens?id=eq.' + b.id, { metodo: 'DELETE' });
      if (!del.ok) {
        // a chave estrangeira (ON DELETE RESTRICT) também protege: se alguém usou a imagem agora, recusa.
        if (del.codigo === '23503') return erro(res, 409, 'imagem_em_uso');
        return erro(res, 500, 'falha_gravacao');
      }
      const rm = await fetchComTimeout(cfg.supabaseUrl + '/storage/v1/object/' + BUCKET + '/' + im.dados[0].caminho, { method: 'DELETE', headers: cfg.headers }, 8000).catch(() => null);
      return responder(res, 200, { ok: true, arquivo_removido: !!(rm && rm.ok) });
    }

    return erro(res, 400, 'acao_invalida');
  } catch (err) {
    console.error('[dicas-imagens] Erro:', err && err.name ? err.name : 'erro');
    return erro(res, 500, 'falha_interna');
  }
};
