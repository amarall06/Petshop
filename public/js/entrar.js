// Página "Entrar / Criar conta"
(function () {
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const voltar = DV.voltarSeguro(params.get('voltar'));

  if (DV.conta.entrou()) { location.replace(voltar); return; } // já está conectado

  const abas = { entrar: $('#aba-entrar'), cadastro: $('#aba-cadastro') };
  const forms = { entrar: $('#form-entrar'), cadastro: $('#form-cadastro') };
  const aviso = $('#aviso-auth');

  function mostrar(qual) {
    Object.keys(abas).forEach((k) => {
      abas[k].setAttribute('aria-selected', String(k === qual));
      forms[k].hidden = k !== qual;
    });
    aviso.className = 'aviso';
  }
  abas.entrar.addEventListener('click', () => mostrar('entrar'));
  abas.cadastro.addEventListener('click', () => mostrar('cadastro'));
  mostrar(params.get('aba') === 'cadastro' ? 'cadastro' : 'entrar');

  function erro(msg) { aviso.className = 'aviso erro'; aviso.textContent = msg; }

  async function enviar(form, caminho, corpo, textoBotao) {
    const botao = form.querySelector('button[type="submit"]');
    const original = botao.textContent;
    botao.disabled = true;
    botao.textContent = textoBotao;
    aviso.className = 'aviso';
    try {
      const r = await DV.conta.api(caminho, { method: 'POST', body: JSON.stringify(corpo), semAuth: true });
      DV.conta.salvar(r.token, r.name);
      location.replace(voltar);
    } catch (e) {
      erro(e.message);
      botao.disabled = false;
      botao.textContent = original;
    }
  }

  forms.entrar.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#le-email').value.trim();
    const senha = $('#le-senha').value;
    if (!email || !senha) return erro('Preencha o e-mail e a senha.');
    enviar(forms.entrar, '/api/customers/login', { email, password: senha }, 'Entrando...');
  });

  forms.cadastro.addEventListener('submit', (e) => {
    e.preventDefault();
    const corpo = {
      name: $('#lc-nome').value.trim(),
      email: $('#lc-email').value.trim(),
      phone: $('#lc-fone').value.trim(),
      password: $('#lc-senha').value,
    };
    if (corpo.name.length < 2) return erro('Informe seu nome.');
    if (!/^\S+@\S+\.\S+$/.test(corpo.email)) return erro('Informe um e-mail válido.');
    if (!/^[\d\s()+-]{8,20}$/.test(corpo.phone)) return erro('Informe o telefone com DDD. Ex.: (71) 99999-9999');
    if (corpo.password.length < 8) return erro('A senha precisa ter pelo menos 8 caracteres.');
    if (corpo.password !== $('#lc-senha2').value) return erro('As senhas não são iguais.');
    if (!$('#lc-aceite').checked) return erro('Marque a caixa para concordar com o uso dos seus dados.');
    enviar(forms.cadastro, '/api/customers/register', corpo, 'Criando conta...');
  });
})();
