// Página do carrinho: confere estoque e preços atuais, e registra o pedido
(function () {
  const $ = (s) => document.querySelector(s);
  const { esc, brl } = DV;
  let produtos = new Map();

  function aviso(tipo, texto) {
    const el = $('#aviso-carrinho');
    el.className = texto ? `aviso ${tipo}` : 'aviso';
    el.textContent = texto || '';
  }

  // Tira do carrinho o que saiu de venda e ajusta quantidades acima do estoque
  function ajustar() {
    const avisos = [];
    let mudou = false;
    const lista = DV.carrinho.ler().filter((i) => {
      const p = produtos.get(i.id);
      if (!p || p.stock === 0) {
        avisos.push(p ? `"${p.name}" ficou sem estoque e saiu do carrinho.` : 'Um produto não está mais à venda e saiu do carrinho.');
        mudou = true;
        return false;
      }
      if (i.qty > p.stock) {
        avisos.push(`Ajustamos "${p.name}" para ${p.stock} unidade(s), que é o estoque.`);
        i.qty = p.stock;
        mudou = true;
      }
      return true;
    });
    if (mudou) DV.carrinho.salvar(lista);
    return { lista, avisos };
  }

  function render(mensagens) {
    const { lista, avisos } = ajustar();
    $('#carrinho-vazio').hidden = lista.length > 0;
    $('#carrinho-conteudo').hidden = lista.length === 0;
    const todos = [...(mensagens || []), ...avisos];
    if (todos.length) aviso('erro', todos.join(' '));

    $('#itens').innerHTML = lista
      .map((i) => {
        const p = produtos.get(i.id);
        const foto = p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : '';
        return `<article class="item-carrinho" data-id="${p.id}">
          <div class="miniatura">${foto}</div>
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="unit">${brl(p.price)} cada</div>
            <div class="qtd-controle">
              <button type="button" data-menos aria-label="Diminuir a quantidade de ${esc(p.name)}" ${i.qty <= 1 ? 'disabled' : ''}>&minus;</button>
              <span aria-live="polite">${i.qty}</span>
              <button type="button" data-mais aria-label="Aumentar a quantidade de ${esc(p.name)}" ${i.qty >= p.stock ? 'disabled' : ''}>+</button>
            </div>
          </div>
          <div class="direita">
            <div class="subtotal">${brl(p.price * i.qty)}</div>
            <button type="button" class="btn-remover" data-remover>Remover</button>
          </div>
        </article>`;
      })
      .join('');

    const total = lista.reduce((s, i) => s + Math.round(produtos.get(i.id).price * 100) * i.qty, 0) / 100;
    $('#res-itens').textContent = String(lista.reduce((s, i) => s + i.qty, 0));
    $('#res-total').textContent = brl(total);

    const logado = DV.conta.entrou();
    $('#bloco-login').hidden = logado;
    $('#btn-finalizar').textContent = logado ? 'Finalizar pedido' : 'Entrar para finalizar';
  }

  $('#itens').addEventListener('click', (e) => {
    const linha = e.target.closest('.item-carrinho');
    if (!linha) return;
    const id = Number(linha.dataset.id);
    const atual = DV.carrinho.qtd(id);
    if (e.target.closest('[data-mais]')) {
      const r = DV.carrinho.adicionar(id, produtos.get(id).stock);
      if (!r.ok) DV.toast(r.msg);
    } else if (e.target.closest('[data-menos]')) {
      DV.carrinho.definir(id, atual - 1);
    } else if (e.target.closest('[data-remover]')) {
      DV.carrinho.remover(id);
    } else return;
    aviso('', '');
    render();
  });

  function mensagemWhats(p) {
    const linhas = p.items.map((i) => `${i.qty}x ${i.name} - ${brl(i.price * i.qty)}`).join('\n');
    return (
      `Olá! Fiz o pedido nº ${p.id} pelo site da Dog Ville.\n\n${linhas}\n\nTotal: ${brl(p.total)}` +
      (p.notes ? `\nObs.: ${p.notes}` : '') +
      `\n\nNome: ${DV.conta.nome()}`
    );
  }

  function mostrarSucesso(p) {
    $('#carrinho-conteudo').hidden = true;
    $('#carrinho-vazio').hidden = true;
    $('#pedido-ok').hidden = false;
    $('#ok-numero').textContent = String(p.id);
    $('#ok-total').textContent = brl(p.total);
    $('#ok-whats').href = DV.whatsLink(mensagemWhats(p));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('#btn-finalizar').addEventListener('click', async () => {
    if (!DV.conta.entrou()) { location.href = 'entrar.html?voltar=carrinho.html'; return; }
    const botao = $('#btn-finalizar');
    botao.disabled = true;
    botao.textContent = 'Enviando...';
    aviso('', '');
    try {
      const itens = DV.carrinho.ler().map((i) => ({ product_id: i.id, qty: i.qty }));
      const pedido = await DV.conta.api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ items: itens, notes: $('#obs').value }),
      });
      DV.carrinho.limpar();
      mostrarSucesso(pedido);
    } catch (e) {
      if (e.sessaoExpirada) return (location.href = 'entrar.html?voltar=carrinho.html');
      await carregar([e.message]); // atualiza estoques e mostra o motivo
    } finally {
      botao.disabled = false;
      render_botao();
    }
  });

  function render_botao() {
    $('#btn-finalizar').textContent = DV.conta.entrou() ? 'Finalizar pedido' : 'Entrar para finalizar';
  }

  async function carregar(mensagens) {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error();
      produtos = new Map((await res.json()).map((p) => [p.id, p]));
      render(mensagens);
    } catch {
      aviso('erro', 'Não foi possível carregar o carrinho agora. Tente novamente em instantes.');
    }
  }

  window.addEventListener('storage', () => carregar());
  carregar();
})();
