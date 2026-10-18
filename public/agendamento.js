// Agendamento de banho/tosa: carrega serviços, mostra só horários livres e envia para a API.
const form = document.getElementById('form-agendamento');
const selServico = document.getElementById('service_id');
const inputData = document.getElementById('date');
const selHora = document.getElementById('time');
const btn = document.getElementById('btn-agendar');
const aviso = document.getElementById('aviso-agendamento');

const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function mostrar(tipo, texto) {
  aviso.className = `aviso ${tipo}`;
  aviso.textContent = texto;
}

// Não deixa escolher datas passadas (formato AAAA-MM-DD no fuso do navegador)
inputData.min = new Date().toLocaleDateString('en-CA');

async function carregarServicos() {
  try {
    const res = await fetch('/api/services');
    if (!res.ok) throw new Error();
    const servicos = await res.json();
    selServico.innerHTML =
      '<option value="">Escolha o serviço</option>' +
      servicos.map((s) => `<option value="${s.id}">${s.name} - ${brl(s.price)}</option>`).join('');
  } catch {
    mostrar('erro', 'Não foi possível carregar os serviços. Tente novamente em instantes.');
  }
}

async function carregarHorarios() {
  selHora.innerHTML = '<option value="">Escolha a data primeiro</option>';
  selHora.disabled = true;
  if (!inputData.value) return;

  try {
    const res = await fetch(`/api/appointments/available?date=${encodeURIComponent(inputData.value)}`);
    const dados = await res.json();
    if (!res.ok) throw new Error(dados.error);

    // Se for hoje, esconde horários que já passaram
    const hoje = new Date().toLocaleDateString('en-CA');
    const agora = new Date().toTimeString().slice(0, 5);
    const livres = dados.available.filter((h) => inputData.value !== hoje || h > agora);

    if (!livres.length) {
      selHora.innerHTML = '<option value="">Sem horários neste dia</option>';
      return;
    }
    selHora.innerHTML =
      '<option value="">Escolha o horário</option>' + livres.map((h) => `<option value="${h}">${h}</option>`).join('');
    selHora.disabled = false;
  } catch {
    mostrar('erro', 'Não foi possível consultar os horários. Tente novamente.');
  }
}

inputData.addEventListener('change', carregarHorarios);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  aviso.className = 'aviso';
  btn.disabled = true;

  const dados = Object.fromEntries(new FormData(form).entries());
  dados.service_id = Number(dados.service_id);

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const resposta = await res.json();
    if (!res.ok) throw new Error(resposta.error || 'Erro ao agendar.');

    mostrar('ok', 'Agendamento realizado! Esperamos você e o seu pet no horário escolhido.');
    form.reset();
    selHora.innerHTML = '<option value="">Escolha a data primeiro</option>';
    selHora.disabled = true;
  } catch (err) {
    mostrar('erro', err.message);
    carregarHorarios(); // atualiza a lista caso o horário tenha sido ocupado por outra pessoa
  } finally {
    btn.disabled = false;
  }
});

carregarServicos();
