// Efeitos comuns a todas as páginas: WhatsApp, aparecer ao rolar, galeria ampliada e ano do rodapé.
// Cada parte é independente: se uma falhar, as outras continuam funcionando.
document.documentElement.setAttribute('data-efeitos', 'ok'); // avisa a página que este arquivo carregou

(function () {
  const cfg = window.SITE || {};
  const numero = String(cfg.whatsapp || '').replace(/\D/g, '');
  const linkWhats = (msg) => `https://wa.me/${numero}?text=${encodeURIComponent(msg || cfg.mensagem || '')}`;

  // 1) Aparecer suavemente ao rolar (blocos com a classe "reveal")
  try {
    const itens = document.querySelectorAll('.reveal');
    const mostrar = (el) => el.classList.add('visivel');
    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver(
        (entradas) =>
          entradas.forEach((e) => {
            if (e.isIntersecting) {
              mostrar(e.target);
              obs.unobserve(e.target);
            }
          }),
        { threshold: 0.01, rootMargin: '0px 0px -5% 0px' }
      );
      itens.forEach((el) => obs.observe(el));
    } else {
      itens.forEach(mostrar);
    }
  } catch (e) {
    document.documentElement.classList.remove('js'); // algo falhou: mostra tudo normalmente
  }

  // 2) Links com data-whats="mensagem" abrem o WhatsApp da loja
  try {
    if (numero) {
      document.querySelectorAll('[data-whats]').forEach((a) => {
        a.href = linkWhats(a.dataset.whats);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      });

      // Botão flutuante do WhatsApp
      const botao = document.createElement('a');
      botao.className = 'whats-flutuante';
      botao.href = linkWhats();
      botao.target = '_blank';
      botao.rel = 'noopener noreferrer';
      botao.setAttribute('aria-label', 'Falar com a Dog Ville no WhatsApp');
      botao.innerHTML = '<i class="bi bi-whatsapp" aria-hidden="true"></i>';
      document.body.appendChild(botao);
    }
  } catch (e) {}

  // 3) Galeria: clicar numa foto abre ampliada (Esc ou clique fecha)
  try {
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
  } catch (e) {}

  // 4) Ano atual no rodapé
  try {
    const ano = document.getElementById('ano');
    if (ano) ano.textContent = new Date().getFullYear();
  } catch (e) {}
})();
