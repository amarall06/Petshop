// Menu do topo. No celular só aparece o botão de 3 traços, que abre e fecha o menu.
(function () {
  const botao = document.getElementById('btn-menu');
  const menu = document.getElementById('menu-topo');
  if (!botao || !menu) return;

  function abrir(sim) {
    menu.classList.toggle('aberto', sim);
    botao.setAttribute('aria-expanded', String(sim));
    botao.setAttribute('aria-label', sim ? 'Fechar menu' : 'Abrir menu');
  }

  botao.addEventListener('click', () => abrir(!menu.classList.contains('aberto')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) abrir(false); });   // escolheu uma opção: fecha
  document.addEventListener('click', (e) => {                                            // clicou fora: fecha
    if (menu.classList.contains('aberto') && !e.target.closest('.topbar')) abrir(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') abrir(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 900) abrir(false); });
})();
