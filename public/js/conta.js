// Página "Minha conta": dados do cliente e histórico de pedidos
(function () {
  const $ = (s) => document.querySelector(s);
  const { esc, brl } = DV;

  if (!DV.conta.entrou()) { location.replace('entrar.html?voltar=conta.html'); return; }

  const ROTULO = { novo: 'Aguardando confirmação', confirmado: 'Confirmado', entregue: 'Entregue', cancelado: 'Cancelado' };

  function aviso(tipo, texto) {
    const el = $('#aviso-conta');
    el.className = texto ? `aviso ${tipo}` : 'aviso';
    el.textContent = texto || '';
  }

  function desenharPedidos(lista) {
    $('#lista-pedidos').innerHTML = lista.length
      ? lista
          .map((p) => {
            const itens = p.items
              .map((i) => `<li><span>${i.qty}x ${esc(i.name)}</span><span>${brl(i.price * i.qty)}</span></li>`)
              .join('');
            const zap = DV.whatsLink(`Olá! Gostaria de falar sobre o meu pedido nº ${p.id} (site Dog Ville).`);
            return `<article class="pedido-card">
              <div class="pedido-topo">
                <strong>Pedido nº ${p.id}</strong>
                <span class="selo-status ${esc(p.status)}">${esc(ROTULO[p.status] || p.status)}</span>
              </div>
              <small class="text-muted">${esc(DV.dataHora(p.created_at))}</small>
              <ul>${itens}</ul>
              ${p.notes ? `<p class="dica">Obs.: ${esc(p.notes)}</p>` : ''}
              <div class="pedido-topo"><strong>Total: ${brl(p.total)}</strong>
                <a class="link-whats" href="${esc(zap)}" target="_blank" rel="noopener noreferrer">Falar sobre este pedido</a></div>
            </article>`;
          })
          .join('')
      : '<p class="vazio-bloco" style="padding:20px 0">Você ainda não fez nenhum pedido. <br><a class="btn-verde" href="Loja.html">Ver a loja</a></p>';
  }

  async function carregar() {
    try {
      const [eu, pedidos] = await Promise.all([DV.conta.api('/api/customers/me'), DV.conta.api('/api/orders/mine')]);
      DV.conta.salvar(DV.conta.token(), eu.name);
      $('#conta-titulo').textContent = `Olá, ${eu.name.split(' ')[0]}!`;
      $('#cf-nome').value = eu.name;
      $('#cf-email').value = eu.email;
      $('#cf-fone').value = eu.phone;
      desenharPedidos(pedidos);
    } catch (e) {
      if (e.sessaoExpirada) return location.replace('entrar.html?voltar=conta.html');
      aviso('erro', e.message);
    }
  }

  $('#form-conta').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    aviso('', '');
    try {
      const r = await DV.conta.api('/api/customers/me', {
        method: 'PUT',
        body: JSON.stringify({ name: $('#cf-nome').value, phone: $('#cf-fone').value }),
      });
      DV.conta.salvar(DV.conta.token(), r.name);
      $('#conta-titulo').textContent = `Olá, ${r.name.split(' ')[0]}!`;
      aviso('ok', 'Dados atualizados.');
    } catch (e) {
      if (e.sessaoExpirada) return location.replace('entrar.html?voltar=conta.html');
      aviso('erro', e.message);
    }
  });

  $('#btn-sair').addEventListener('click', () => {
    DV.conta.sair();
    location.replace('index.html');
  });

  carregar();
})();
