// Monta a página "Serviços" a partir de js/dados-servicos.js
(function () {
  const D = window.DADOS || {};
  const portes = D.portes || [];

  const esc = (t) =>
    String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ---- Cartões de serviços ----
  const lista = document.getElementById('servicos-lista');
  if (lista) {
    lista.innerHTML = (D.servicos || [])
      .map((s) => {
        const precos = s.precos || [];
        const temPreco = precos.some((p) => typeof p === 'number');
        const blocoPreco = temPreco
          ? '<ul class="preco-lista">' +
            portes
              .map((p, i) => {
                const v = precos[i];
                return `<li><span>${esc(p)}</span><span class="valor">${typeof v === 'number' ? brl(v) : 'Consulte'}</span></li>`;
              })
              .join('') +
            '</ul>'
          : '<p class="preco-consulte">Valores sob consulta</p>';
        const tempo = s.tempo ? `<p class="tempo"><i class="bi bi-clock" aria-hidden="true"></i> ${esc(s.tempo)}</p>` : '';
        const botao =
          s.acao === 'agendar'
            ? '<a href="tosa.html" class="btn-verde">Agendar online</a>'
            : `<a href="#" class="btn-verde" data-whats="${esc(s.mensagem || 'Olá! Gostaria de saber mais sobre ' + s.nome + '.')}"><i class="bi bi-whatsapp" aria-hidden="true"></i> Falar no WhatsApp</a>`;
        return `
          <article class="preco-card">
            <div class="icone"><i class="bi ${esc(s.icone || 'bi-heart')}" aria-hidden="true"></i></div>
            <h3>${esc(s.nome)}</h3>
            <p class="desc">${esc(s.descricao)}</p>
            ${tempo}
            ${blocoPreco}
            ${botao}
          </article>`;
      })
      .join('');
  }

  // ---- Depoimentos (a seção só aparece se houver algum) ----
  const secDep = document.getElementById('secao-depoimentos');
  const deps = D.depoimentos || [];
  if (secDep && deps.length) {
    document.getElementById('depoimentos').innerHTML = deps
      .map(
        (d) => `
        <figure class="depoimento">
          <i class="bi bi-quote" aria-hidden="true"></i>
          <blockquote>${esc(d.texto)}</blockquote>
          <figcaption><strong>${esc(d.nome)}</strong>${d.pet ? ` &middot; tutor(a) de ${esc(d.pet)}` : ''}</figcaption>
        </figure>`
      )
      .join('');
    secDep.hidden = false;
  }

  // ---- Perguntas frequentes ----
  const faq = document.getElementById('faq');
  if (faq) {
    faq.innerHTML = (D.faq || [])
      .map((f) => `<details><summary>${esc(f.p)}</summary><p>${esc(f.r)}</p></details>`)
      .join('');
  }
})();
