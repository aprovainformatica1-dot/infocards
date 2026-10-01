/* Painel de Desafios DevMapas — só consome /api/desafios-analytics.
   A chave fica apenas em memória (variável abaixo): não vai para URL, localStorage nem HTML. */
let chave = '';
const $ = (id) => document.getElementById(id);
const nInt = new Intl.NumberFormat('pt-BR');
const nTaxa = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const taxa = (cliques, acessos) => (acessos > 0 ? nTaxa.format((cliques / acessos) * 100) + '%' : '—');
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

function mostrarAcesso(msg) {
  chave = '';
  $('painel').hidden = true; $('acesso').hidden = false;
  $('conteudo').hidden = true; $('lista').textContent = '';
  $('chave').value = '';
  const m = $('msgAcesso'); m.textContent = msg || ''; m.className = msg ? 'msg erro' : 'msg';
  $('chave').focus();
}

function numero(valor, rotulo, extra) {
  const d = el('div', 'num' + (extra ? ' ' + extra : ''));
  d.append(el('b', '', nInt.format(valor)), el('span', '', rotulo));
  return d;
}

function desenhar(dados) {
  const t = dados.total || {};
  $('kAcessos').textContent = nInt.format(t.acessos || 0);
  $('kSimulado').textContent = nInt.format(t.cliques_simulado || 0);
  $('kGrupo').textContent = nInt.format(t.cliques_grupo || 0);
  $('atualizado').textContent = dados.atualizado_em ? 'Atualizado em ' + new Date(dados.atualizado_em).toLocaleString('pt-BR') : '';
  $('parcial').hidden = dados.parcial !== true;

  const lista = $('lista'); lista.textContent = '';
  const itens = Array.isArray(dados.desafios) ? dados.desafios : [];   // ordem da API mantida
  $('vazio').hidden = itens.length > 0;
  itens.forEach((d) => {
    const card = el('article', 'des');
    card.append(el('h3', '', String(d.id).toUpperCase()));
    const nums = el('div', 'nums');
    nums.append(numero(d.acessos, '👀 Acessos'), numero(d.cliques_simulado, '📄 Simulado'), numero(d.cliques_grupo, '💚 Grupo', 'g'));
    const taxas = el('div', 'taxas');
    [['Taxa de clique no simulado', d.cliques_simulado], ['Taxa de clique no grupo', d.cliques_grupo]].forEach(([nome, cl]) => {
      const l = el('div'); l.append(el('span', '', nome), el('b', '', taxa(cl, d.acessos))); taxas.append(l);
    });
    card.append(nums, taxas);
    lista.append(card);
  });
  $('conteudo').hidden = false;
}

async function carregar(primeiroAcesso) {
  const estado = $('estado'), btn = $('atualizar'), entrar = $('entrar');
  estado.className = 'msg'; estado.textContent = 'Carregando dados...';
  btn.disabled = true; entrar.disabled = true;
  if (primeiroAcesso) { const m = $('msgAcesso'); m.className = 'msg'; m.textContent = 'Carregando dados...'; }
  try {
    const r = await fetch('/api/desafios-analytics?dias=30', { headers: { 'x-painel-chave': chave }, cache: 'no-store' });
    if (r.status === 401) { mostrarAcesso('Chave inválida.'); return; }
    if (!r.ok) throw new Error('api');
    const dados = await r.json();
    $('acesso').hidden = true; $('painel').hidden = false; $('chave').value = '';
    estado.textContent = '';
    desenhar(dados);
  } catch (e) {
    if (primeiroAcesso) { chave = ''; const m = $('msgAcesso'); m.className = 'msg erro'; m.textContent = 'Não foi possível carregar os dados.'; }
    else { estado.className = 'msg erro'; estado.textContent = 'Não foi possível carregar os dados.'; }
  } finally { btn.disabled = false; entrar.disabled = false; }
}

$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  chave = $('chave').value.trim();
  if (chave) carregar(true);
});
$('atualizar').addEventListener('click', () => carregar(false));
$('sair').addEventListener('click', () => mostrarAcesso(''));
