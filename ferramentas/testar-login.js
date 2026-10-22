// Testa o login direto no servidor, usando o usuário e a senha do seu .env.
// 1) Deixe o servidor rodando (npm run dev) em uma janela do terminal.
// 2) Abra OUTRA janela na mesma pasta e rode:   node testar-login.js
// A senha não aparece na tela.

const fs = require('fs');
const path = require('path');

// Procura o .env na pasta onde você rodou o comando, na do script e na pasta de cima
const candidatos = [process.cwd(), __dirname, path.join(__dirname, '..'), path.join(process.cwd(), '..')];
const pastaEnv = candidatos.find((p) => fs.existsSync(path.join(p, '.env')));
if (pastaEnv) require('dotenv').config({ path: path.join(pastaEnv, '.env') });

const porta = process.env.PORT || 3000;
const usuario = process.env.ADMIN_USER || 'admin';
const senha = process.env.ADMIN_PASSWORD || 'admin123';

console.log('\n=== TESTE DE LOGIN ===');
if (pastaEnv) {
  console.log('Usando o .env de:', path.join(pastaEnv, '.env'));
} else {
  console.log('ATENÇÃO: não achei o arquivo .env. Este teste vai usar o login PADRÃO (admin / admin123)');
  console.log('e por isso NÃO reflete a sua senha. Rode na pasta do projeto, onde está o .env.');
}
console.log(`Tentando entrar em http://localhost:${porta} com usuário "${usuario}" e senha de ${senha.length} caracteres...\n`);

fetch(`http://localhost:${porta}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: usuario, password: senha }),
})
  .then(async (res) => {
    const dados = await res.json().catch(() => ({}));
    if (res.ok) {
      console.log('RESULTADO: o servidor ACEITOU o login do seu .env.');
      console.log('=> O servidor está certo. Se o navegador ainda recusa, o que está sendo digitado na tela é diferente do .env');
      console.log('   (maiúsculas/minúsculas, preenchimento automático do navegador, teclado). Digite usuário e senha com calma e sem copiar.');
    } else if (res.status === 401 && !pastaEnv) {
      console.log('RESULTADO: o servidor recusou o login padrão (admin / admin123).');
      console.log('=> Isso é NORMAL se você definiu outra senha no .env. Rode este teste na pasta do projeto, onde está o .env.');
    } else if (res.status === 401) {
      console.log('RESULTADO: o servidor RECUSOU o login do seu .env.');
      console.log('=> Quase certamente há um servidor ANTIGO rodando, com outra senha.');
      console.log('   Solução: feche as janelas do terminal e rode no Prompt de Comando:   taskkill /F /IM node.exe');
      console.log('   Depois inicie de novo com:   npm run dev');
    } else if (res.status === 429) {
      console.log('RESULTADO: login bloqueado por excesso de tentativas erradas.');
      console.log('=> Pare o servidor (Ctrl+C) e inicie de novo para liberar na hora.');
    } else {
      console.log(`RESULTADO: resposta inesperada (${res.status}):`, dados.error || '');
    }
    console.log('======================\n');
  })
  .catch(() => {
    console.log('RESULTADO: não consegui falar com o servidor.');
    console.log('=> Ele não está rodando (ou está em outra porta). Inicie com:   npm run dev');
    console.log('======================\n');
  });
