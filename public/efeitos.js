// Efeitos comuns a todas as páginas: WhatsApp, aparecer ao rolar e galeria ampliada.
(function () {
  const cfg = window.SITE || {};
  const numero = String(cfg.whatsapp || '').replace(/\D/g, '');

  const linkWhats = (msg) => `https://wa.me/${numero}?text=${encodeURIComponent(msg || cfg.mensagem || '')}`;

  // 1) Qualquer link com data-whats="mensagem" abre o WhatsApp da loja
  if (numero) {
    document.querySelectorAll('[data-whats]').forEach((a) => {
      a.href = linkWhats(a.dataset.whats);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });

    // 2) Botão flutuante do WhatsApp em todas as páginas
    const botao = document.createElement('a');
    botao.className = 'whats-flutuante';
    botao.href = linkWhats();
    botao.target = '_blank';
    botao.rel = 'noopener noreferrer';
    botao.setAttribute('aria-label', 'Falar com a Dog Ville no WhatsApp');
    botao.innerHTML = '<i class="bi bi-whatsapp" aria-hidden="true"></i>';
    document.body.appendChild(botao);
  }

  // 3) Blocos com a classe "reveal" aparecem suavemente ao entrar na tela
  const itens = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visivel');
            obs.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    itens.forEach((el) => obs.observe(el));
  } else {
    itens.forEach((el) => el.classList.add('visivel'));
  }

  // 4) Galeria: clicar numa foto abre ampliada (Esc ou clique fecha)
  const fotos = document.querySelectorAll('[data-lightbox]');
  if (fotos.length) {
    const caixa = document.createElement('div');
    caixa.className = 'lightbox';
    caixa.setAttribute('role', 'dialog');
    caixa.setAttribute('aria-modal', 'true');
    caixa.setAttribute('aria-label', 'Foto ampliada');
    caixa.innerHTML = '<button type="button" class="lightbox-fechar" aria-label="Fechar">&times;</button><img alt="">';
    document.body.appendChild(caixa);
    const img = caixa.querySelector('img');

    const fechar = () => caixa.classList.remove('aberto');
    fotos.forEach((a) =>
      a.addEventListener('click', (e) => {
        e.preventDefault();
        img.src = a.getAttribute('href');
        img.alt = a.querySelector('img') ? a.querySelector('img').alt : '';
        caixa.classList.add('aberto');
        caixa.querySelector('button').focus();
      })
    );
    caixa.addEventListener('click', fechar);
    document.addEventListener('keydown', (e) => e.key === 'Escape' && fechar());
  }
})();

// Ano atual no rodapé
(function () {
  const ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
