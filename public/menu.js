// Ativar item do menu lateral
const menuItem = document.querySelectorAll('.item-menu');

function selectLink() {
    menuItem.forEach((item) =>
        item.classList.remove('ativo')
    );
    this.classList.add('ativo');
}

menuItem.forEach((item) =>
    item.addEventListener('click', selectLink)
);

// Expandir e retrair menu lateral
const btnExp = document.querySelector('#btn-exp');
const menuSide = document.querySelector('.menu-lateral');
const mainContent = document.querySelector('main'); // Se quiser que o <main> se mova junto

btnExp.addEventListener('click', () => {
    menuSide.classList.toggle('expandir');

    // Se o main estiver se ajustando no CSS baseado no estado da nav,
    // isso já é suficiente. Mas você pode forçar uma classe se preferir:
    // mainContent.classList.toggle('expandido');
});