// Painel administrativo da Dog Ville.
// Fala com a API do servidor (/api/...). O "token" do login fica só nesta aba do navegador.
(() => {
  const $ = (s) => document.querySelector(s);
  const CHAVE = 'dogville_admin_token';
  let token = sessionStorage.getItem(CHAVE) || '';

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const dataBR = (d) => d.split('-').reverse().join('/');
  const hojeISO = () => new Date().toLocaleDateString('en-CA');
  const somarDias = (iso, n) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toLocaleDateString('en-CA');
  };

  // ---------- Avisos ----------
  let timerAviso;
  function aviso(msg, tipo = 'success') {
    const el = $('#aviso');
    el.className = `alert alert-${tipo}`;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => (el.style.display = 'none'), 3500);
  }

  // ---------- Chamadas à API ----------
  async function api(caminho, opcoes = {}) {
    const res = await fetch(caminho, {
      ...opcoes,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status === 401 && token) {
      sair();
      throw new Error('Sua sessão expirou. Entre novamente.');
    }
    if (res.status === 204) return null;
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || 'Erro ao falar com o servidor.');
    return dados;
  }

  const tentar = (fn) => async (...a) => {
    try {
      await fn(...a);
    } catch (e) {
      aviso(e.message, 'danger');
    }
  };

  // ---------- Login / sair ----------
  function mostrarTela() {
    $('#tela-login').style.display = token ? 'none' : 'block';
    $('#tela-admin').style.display = token ? 'block' : 'none';
  }

  function sair() {
    token = '';
    sessionStorage.removeItem(CHAVE);
    mostrarTela();
  }

  $('#form-login').addEventListener(
    'submit',
    tentar(async (e) => {
      e.preventDefault();
      const r = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: $('#usuario').value, password: $('#senha').value }),
      });
      token = r.token;
      sessionStorage.setItem(CHAVE, token);
      $('#senha').value = '';
      mostrarTela();
      abrirAba('agenda');
    })
  );
  $('#btn-sair').addEventListener('click', sair);

  // ---------- Abas ----------
  function abrirAba(nome) {
    document.querySelectorAll('.abas button').forEach((b) => b.classList.toggle('ativa', b.dataset.aba === nome));
    ['agenda', 'produtos', 'servicos', 'mensagens'].forEach((a) => {
      $(`#aba-${a}`).style.display = a === nome ? 'block' : 'none';
    });
    const carregar = { agenda: carregarAgenda, produtos: carregarProdutos, servicos: carregarServicos, mensagens: carregarMensagens }[nome];
    tentar(carregar)();
  }
  document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => abrirAba(b.dataset.aba)));

  // =====================================================
  // AGENDA
  // =====================================================
  const ST = {
    agendado: ['badge-info', 'Agendado'],
    concluido: ['badge-success', 'Concluído'],
    cancelado: ['badge-secondary', 'Cancelado'],
  };

  function linkZap(tel) {
    let d = String(tel).replace(/\D/g, '');
    if (d.length <= 11) d = '55' + d;
    return `https://wa.me/${d}`;
  }

  async function carregarAgenda() {
    const params = new URLSearchParams();
    if ($('#ag-data').value) params.set('date', $('#ag-data').value);
    if ($('#ag-status').value) params.set('status', $('#ag-status').value);
    const lista = await api('/api/appointments?' + params);

    $('#ag-resumo').textContent = lista.length
      ? `${lista.length} agendamento(s)${$('#ag-data').value ? ' em ' + dataBR($('#ag-data').value) : ' no total'}`
      : '';

    $('#ag-corpo').innerHTML = lista.length
      ? lista
          .map((a) => {
            const [cls, rotulo] = ST[a.status] || ['badge-light', a.status];
            const acoes =
              a.status === 'agendado'
                ? `<button class="btn btn-sm btn-success" data-st="concluido" data-id="${a.id}" title="Marcar como concluído">Concluir</button>
                   <button class="btn btn-sm btn-outline-danger" data-st="cancelado" data-id="${a.id}" title="Cancelar">Cancelar</button>`
                : `<button class="btn btn-sm btn-outline-secondary" data-st="agendado" data-id="${a.id}">Reabrir</button>`;
            return `<tr>
              <td>${dataBR(a.date)}</td><td><strong>${esc(a.time)}</strong></td>
              <td>${esc(a.owner_name)}</td>
              <td><a href="${linkZap(a.phone)}" target="_blank" rel="noopener noreferrer">${esc(a.phone)}</a></td>
              <td>${esc(a.pet_name)} <small class="text-muted">(${esc(a.pet_type)})</small></td>
              <td>${esc(a.service_name)}</td>
              <td>${esc(a.notes)}</td>
              <td><span class="badge ${cls}">${esc(rotulo)}</span></td>
              <td class="text-nowrap">${acoes}</td></tr>`;
          })
          .join('')
      : '<tr><td colspan="9" class="vazio">Nenhum agendamento encontrado.</td></tr>';
  }

  $('#ag-corpo').addEventListener(
    'click',
    tentar(async (e) => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      if (b.dataset.st === 'cancelado' && !confirm('Cancelar este agendamento?')) return;
      await api(`/api/appointments/${b.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: b.dataset.st }) });
      aviso('Agendamento atualizado.');
      await carregarAgenda();
    })
  );

  $('#ag-data').value = hojeISO();
  $('#ag-data').addEventListener('change', tentar(carregarAgenda));
  $('#ag-status').addEventListener('change', tentar(carregarAgenda));
  $('#ag-hoje').addEventListener('click', () => { $('#ag-data').value = hojeISO(); tentar(carregarAgenda)(); });
  $('#ag-ontem').addEventListener('click', () => { $('#ag-data').value = somarDias($('#ag-data').value || hojeISO(), -1); tentar(carregarAgenda)(); });
  $('#ag-amanha').addEventListener('click', () => { $('#ag-data').value = somarDias($('#ag-data').value || hojeISO(), 1); tentar(carregarAgenda)(); });
  $('#ag-todos').addEventListener('click', () => { $('#ag-data').value = ''; tentar(carregarAgenda)(); });

  // =====================================================
  // PRODUTOS
  // =====================================================
  let produtos = [];

  async function carregarProdutos() {
    produtos = await api('/api/products');
    $('#pr-corpo').innerHTML = produtos.length
      ? produtos
          .map(
            (p) => `<tr>
              <td>${esc(p.name)}</td><td>${esc(p.category)}</td><td>${brl(p.price)}</td>
              <td>${p.stock === 0 ? '<span class="badge badge-danger">0</span>' : p.stock}</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary" data-editar="${p.id}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-excluir="${p.id}">Excluir</button>
              </td></tr>`
          )
          .join('')
      : '<tr><td colspan="5" class="vazio">Nenhum produto cadastrado.</td></tr>';
  }

  function limparFormProduto() {
    $('#form-produto').reset();
    $('#pr-id').value = '';
    $('#pr-titulo-form').textContent = 'Novo produto';
    $('#pr-cancelar').style.display = 'none';
  }

  $('#pr-cancelar').addEventListener('click', limparFormProduto);

  $('#form-produto').addEventListener(
    'submit',
    tentar(async (e) => {
      e.preventDefault();
      const corpo = {
        name: $('#pr-nome').value,
        category: $('#pr-categoria').value.trim().toLowerCase(),
        price: Number($('#pr-preco').value),
        stock: Number($('#pr-estoque').value),
        description: $('#pr-descricao').value,
        image_url: $('#pr-imagem').value.trim(),
      };
      const id = $('#pr-id').value;
      await api(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: JSON.stringify(corpo) });
      aviso(id ? 'Produto atualizado.' : 'Produto cadastrado.');
      limparFormProduto();
      await carregarProdutos();
    })
  );

  $('#pr-corpo').addEventListener(
    'click',
    tentar(async (e) => {
      const ed = e.target.closest('[data-editar]');
      const ex = e.target.closest('[data-excluir]');
      if (ed) {
        const p = produtos.find((x) => x.id === Number(ed.dataset.editar));
        $('#pr-id').value = p.id;
        $('#pr-nome').value = p.name;
        $('#pr-categoria').value = p.category;
        $('#pr-preco').value = p.price;
        $('#pr-estoque').value = p.stock;
        $('#pr-imagem').value = p.image_url;
        $('#pr-descricao').value = p.description;
        $('#pr-titulo-form').textContent = 'Editando: ' + p.name;
        $('#pr-cancelar').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (ex) {
        const p = produtos.find((x) => x.id === Number(ex.dataset.excluir));
        if (!confirm(`Excluir "${p.name}"? Isso não pode ser desfeito.`)) return;
        await api(`/api/products/${p.id}`, { method: 'DELETE' });
        aviso('Produto excluído.');
        await carregarProdutos();
      }
    })
  );

  // =====================================================
  // SERVIÇOS (os que aparecem no formulário de agendamento)
  // =====================================================
  let servicos = [];

  async function carregarServicos() {
    servicos = await api('/api/services');
    $('#sv-corpo').innerHTML = servicos.length
      ? servicos
          .map(
            (s) => `<tr>
              <td>${esc(s.name)}</td><td>${brl(s.price)}</td><td>${s.duration_min} min</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary" data-editar="${s.id}">Editar</button>
                <button class="btn btn-sm btn-outline-danger" data-excluir="${s.id}">Excluir</button>
              </td></tr>`
          )
          .join('')
      : '<tr><td colspan="4" class="vazio">Nenhum serviço cadastrado.</td></tr>';
  }

  function limparFormServico() {
    $('#form-servico').reset();
    $('#sv-id').value = '';
    $('#sv-duracao').value = 60;
    $('#sv-titulo-form').textContent = 'Novo serviço';
    $('#sv-cancelar').style.display = 'none';
  }

  $('#sv-cancelar').addEventListener('click', limparFormServico);

  $('#form-servico').addEventListener(
    'submit',
    tentar(async (e) => {
      e.preventDefault();
      const corpo = { name: $('#sv-nome').value, price: Number($('#sv-preco').value), duration_min: Number($('#sv-duracao').value) };
      const id = $('#sv-id').value;
      await api(id ? `/api/services/${id}` : '/api/services', { method: id ? 'PUT' : 'POST', body: JSON.stringify(corpo) });
      aviso(id ? 'Serviço atualizado.' : 'Serviço cadastrado.');
      limparFormServico();
      await carregarServicos();
    })
  );

  $('#sv-corpo').addEventListener(
    'click',
    tentar(async (e) => {
      const ed = e.target.closest('[data-editar]');
      const ex = e.target.closest('[data-excluir]');
      if (ed) {
        const s = servicos.find((x) => x.id === Number(ed.dataset.editar));
        $('#sv-id').value = s.id;
        $('#sv-nome').value = s.name;
        $('#sv-preco').value = s.price;
        $('#sv-duracao').value = s.duration_min;
        $('#sv-titulo-form').textContent = 'Editando: ' + s.name;
        $('#sv-cancelar').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (ex) {
        const s = servicos.find((x) => x.id === Number(ex.dataset.excluir));
        if (!confirm(`Excluir o serviço "${s.name}"?`)) return;
        await api(`/api/services/${s.id}`, { method: 'DELETE' }); // o servidor recusa se já houver agendamentos
        aviso('Serviço excluído.');
        await carregarServicos();
      }
    })
  );

  // =====================================================
  // MENSAGENS DE CONTATO
  // =====================================================
  async function carregarMensagens() {
    const lista = await api('/api/contact');
    $('#ms-lista').innerHTML = lista.length
      ? lista
          .map(
            (m) => `<div class="cartao msg-contato">
              <strong>${esc(m.name)}</strong> &middot; <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>
              <small class="text-muted d-block mb-2">${esc(m.created_at)}</small>
              <div style="white-space:pre-wrap">${esc(m.message)}</div></div>`
          )
          .join('')
      : '<div class="cartao vazio">Nenhuma mensagem recebida.</div>';
  }

  // ---------- Início ----------
  mostrarTela();
  if (token) abrirAba('agenda');
})();
