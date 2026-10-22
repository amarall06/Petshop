// Funções compartilhadas por todas as páginas: conta do cliente, carrinho e avisos.
// Fica disponível como "DV" (Dog Ville). Deve ser carregado ANTES dos outros scripts.
(function () {
  const CH_TOKEN = 'dogville_cliente_token';
  const CH_NOME = 'dogville_cliente_nome';
  const CH_CARRINHO = 'dogville_carrinho';

  // Guarda no navegador. Se o navegador bloquear (modo privado), usa a memória da página.
  const memoria = {};
  const guardar = {
    ler(k) { try { return localStorage.getItem(k); } catch { return memoria[k] ?? null; } },
    gravar(k, v) { try { localStorage.setItem(k, v); } catch { memoria[k] = v; } },
    apagar(k) { try { localStorage.removeItem(k); } catch { delete memoria[k]; } },
  };

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  // O banco guarda a hora em UTC ("2026-10-21 14:30:00"); aqui vira a hora local
  const dataHora = (s) => {
    const d = new Date(String(s).replace(' ', 'T') + 'Z');
    return isNaN(d) ? String(s) : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  // ---------- Avisos rápidos ----------
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast-dv';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('visivel');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('visivel'), 2800);
  }

  // ---------- Carrinho (fica só no navegador; o servidor confere tudo no pedido) ----------
  const carrinho = {
    ler() {
      try {
        const l = JSON.parse(guardar.ler(CH_CARRINHO) || '[]');
        return Array.isArray(l) ? l.filter((i) => Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0) : [];
      } catch { return []; }
    },
    salvar(lista) {
      guardar.gravar(CH_CARRINHO, JSON.stringify(lista));
      atualizarContadores();
    },
    qtd(id) { const i = carrinho.ler().find((x) => x.id === id); return i ? i.qty : 0; },
    total() { return carrinho.ler().reduce((s, i) => s + i.qty, 0); },
    // devolve { ok, msg }; "max" é o estoque conhecido
    adicionar(id, max) {
      const lista = carrinho.ler();
      const item = lista.find((x) => x.id === id);
      const nova = (item ? item.qty : 0) + 1;
      if (max !== undefined && nova > max) return { ok: false, msg: `Só temos ${max} unidade(s) em estoque.` };
      if (nova > 99) return { ok: false, msg: 'Quantidade máxima por item: 99.' };
      if (item) item.qty = nova; else lista.push({ id, qty: 1 });
      carrinho.salvar(lista);
      return { ok: true };
    },
    definir(id, qty) {
      const lista = carrinho.ler().filter((x) => x.id !== id);
      if (qty > 0) lista.push({ id, qty: Math.min(99, qty) });
      carrinho.salvar(lista);
    },
    remover(id) { carrinho.definir(id, 0); },
    limpar() { carrinho.salvar([]); },
  };

  function atualizarContadores() {
    const n = carrinho.total();
    document.querySelectorAll('[data-carrinho-qtd]').forEach((el) => {
      el.textContent = n > 99 ? '99+' : String(n);
      el.hidden = n === 0;
    });
  }

  // ---------- Conta do cliente ----------
  const conta = {
    token() { return guardar.ler(CH_TOKEN) || ''; },
    nome() { return guardar.ler(CH_NOME) || ''; },
    entrou() { return !!conta.token(); },
    salvar(token, nome) { guardar.gravar(CH_TOKEN, token); guardar.gravar(CH_NOME, nome); atualizarTopo(); },
    sair() { guardar.apagar(CH_TOKEN); guardar.apagar(CH_NOME); atualizarTopo(); },

    // Fala com o servidor. Use { semAuth: true } no login e no cadastro.
    async api(caminho, opcoes = {}) {
      const { semAuth, ...resto } = opcoes;
      const headers = { 'Content-Type': 'application/json' };
      if (!semAuth && conta.token()) headers.Authorization = 'Bearer ' + conta.token();
      const res = await fetch(caminho, { ...resto, headers });
      if (res.status === 401 && !semAuth && conta.token()) {
        conta.sair();
        const e = new Error('Sua sessão expirou. Entre novamente.');
        e.sessaoExpirada = true;
        throw e;
      }
      const dados = res.status === 204 ? null : await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((dados && dados.error) || 'Não foi possível falar com o servidor. Tente de novo.');
      return dados;
    },
  };

  function atualizarTopo() {
    const primeiro = conta.nome().split(' ')[0];
    document.querySelectorAll('[data-conta-nome]').forEach((el) => {
      el.textContent = conta.entrou() && primeiro ? (primeiro.length > 14 ? primeiro.slice(0, 13) + '…' : primeiro) : 'Entrar';
    });
    document.querySelectorAll('[data-conta-link]').forEach((a) => {
      a.href = conta.entrou() ? 'conta.html' : 'entrar.html';
    });
  }

  // Só aceita voltar para uma página do próprio site (evita redirecionar para outro endereço)
  const voltarSeguro = (v) => (/^[A-Za-z0-9_-]+\.html$/.test(v || '') ? v : 'conta.html');

  function whatsLink(msg) {
    const numero = String((window.SITE && window.SITE.whatsapp) || '').replace(/\D/g, '');
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg || '')}`;
  }

  window.DV = { esc, brl, dataHora, toast, carrinho, conta, voltarSeguro, whatsLink };

  function iniciar() { atualizarTopo(); atualizarContadores(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
  window.addEventListener('storage', iniciar); // carrinho/conta mudou em outra aba
})();
