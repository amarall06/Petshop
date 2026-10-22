// Loja: carrega os produtos da API e permite filtrar por categoria e pela caixa "Pesquisar" do menu.
const grid = document.getElementById('produtos');
const filtros = document.getElementById('filtros');
const aviso = document.getElementById('aviso-loja');

let todos = [];
let categoria = '';
let busca = '';

const NOMES_CATEGORIA = {
  racao: 'Rações',
  higiene: 'Higiene',
  acessorios: 'Acessórios',
  saude: 'Saúde',
  brinquedos: 'Brinquedos',
};

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Escapa texto vindo do banco antes de colocar no HTML (evita injeção de código)
const esc = (t) =>
  String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const nomeCategoria = (c) => NOMES_CATEGORIA[c] || c.charAt(0).toUpperCase() + c.slice(1);

function desenharFiltros() {
  const cats = [...new Set(todos.map((p) => p.category))].sort();
  filtros.innerHTML =
    `<button class="${categoria === '' ? 'ativo' : ''}" data-cat="">Todos</button>` +
    cats
      .map((c) => `<button class="${categoria === c ? 'ativo' : ''}" data-cat="${esc(c)}">${esc(nomeCategoria(c))}</button>`)
      .join('');
}

function desenharProdutos() {
  const termo = busca.trim().toLowerCase();
  const lista = todos.filter(
    (p) =>
      (!categoria || p.category === categoria) &&
      (!termo || p.name.toLowerCase().includes(termo) || (p.description || '').toLowerCase().includes(termo))
  );

  if (!lista.length) {
    grid.innerHTML = '';
    aviso.className = 'aviso erro';
    aviso.textContent = 'Nenhum produto encontrado.';
    return;
  }
  aviso.className = 'aviso';

  grid.innerHTML = lista
    .map((p) => {
      const foto = p.image_url
        ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`
        : '<i class="bi bi-image" style="font-size:40px;color:#bbb"></i>';
      const estoque =
        p.stock === 0
          ? '<span class="estoque acabando">Indisponível no momento</span>'
          : p.stock <= 5
          ? `<span class="estoque acabando">Últimas ${p.stock} unidades</span>`
          : '<span class="estoque">Em estoque</span>';
      return `
        <article class="produto-card">
          <div class="foto">${foto}</div>
          <div class="info">
            <h3>${esc(p.name)}</h3>
            <p class="desc">${esc(p.description)}</p>
            <span class="preco">${brl(p.price)}</span>
            ${estoque}
            <button type="button" class="btn-verde btn-add" data-add="${p.id}" ${p.stock === 0 ? 'disabled' : ''}>${p.stock === 0 ? 'Indisponível' : 'Adicionar ao carrinho'}</button>
          </div>
        </article>`;
    })
    .join('');
}

grid.addEventListener('click', (e) => {
  const botao = e.target.closest('[data-add]');
  if (!botao) return;
  const p = todos.find((x) => x.id === Number(botao.dataset.add));
  if (!p) return;
  const r = DV.carrinho.adicionar(p.id, p.stock);
  DV.toast(r.ok ? `"${p.name}" foi para o carrinho.` : r.msg);
});

filtros.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-cat]');
  if (!btn) return;
  categoria = btn.dataset.cat;
  desenharFiltros();
  desenharProdutos();
});

// Campo de busca da página
const campoBusca = document.getElementById('busca-loja');
if (campoBusca) {
  campoBusca.addEventListener('input', () => {
    busca = campoBusca.value;
    desenharProdutos();
  });
}

async function carregar() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error();
    todos = await res.json();
    desenharFiltros();
    desenharProdutos();
  } catch {
    aviso.className = 'aviso erro';
    aviso.textContent = 'Não foi possível carregar os produtos agora. Tente novamente em instantes.';
  }
}

carregar();
