// Diagnóstico do login. Coloque este arquivo na MESMA pasta do server.js e rode:
//   node testar-env.js
// Ele não mostra a senha, só o tamanho dela.

const fs = require('fs');
const path = require('path');

const pasta = fs.existsSync(path.join(__dirname, 'server.js')) ? __dirname : path.join(__dirname, '..');
console.log('\n=== DIAGNÓSTICO DO PAINEL ===');
console.log('Pasta analisada:', pasta);

// 1) Que arquivos ".env" existem nesta pasta?
const parecidos = fs.readdirSync(pasta).filter((f) => f.toLowerCase().startsWith('.env'));
console.log('Arquivos que começam com ".env" aqui:', parecidos.length ? parecidos.join('   |   ') : 'NENHUM');

// 2) O .env existe com o nome certo e o que ele contém?
const caminhoEnv = path.join(pasta, '.env');
if (!fs.existsSync(caminhoEnv)) {
  console.log('\n=> PROBLEMA: não existe um arquivo chamado exatamente ".env" nesta pasta.');
  console.log('   Se acima aparece ".env.txt" ou ".env.example", renomeie para ".env" (sem nada depois).');
} else {
  require('dotenv').config({ path: caminhoEnv });
  const usuario = process.env.ADMIN_USER;
  const senha = process.env.ADMIN_PASSWORD;
  console.log('\n.env encontrado e lido.');
  console.log('ADMIN_USER     = [' + (usuario === undefined ? 'não definido, vale "admin"' : usuario) + ']   (os colchetes mostram espaços sobrando)');
  console.log('ADMIN_PASSWORD =', senha === undefined ? 'não definida, vale "admin123"' : 'tem ' + senha.length + ' caracteres');
  console.log('JWT_SECRET     =', process.env.JWT_SECRET ? 'definido' : 'NÃO definido');

  const linha = fs.readFileSync(caminhoEnv, 'utf8').split(/\r?\n/).find((l) => l.trim().startsWith('ADMIN_PASSWORD'));
  if (linha && linha.includes('#') && !/["']/.test(linha)) {
    console.log('\n=> PROBLEMA: a senha tem o símbolo "#" sem aspas. O que vem depois dele é cortado.');
    console.log('   Troque por: ADMIN_PASSWORD="sua#senha"   (ou use uma senha sem #).');
  }
  if (!linha) console.log('\n=> Não existe a linha ADMIN_PASSWORD no .env, então a senha em uso é "admin123".');
}

// 3) O server.js desta pasta é a versão nova?
try {
  const servidor = fs.readFileSync(path.join(pasta, 'server.js'), 'utf8');
  console.log('\nserver.js desta pasta é a versão NOVA (com diagnóstico):', servidor.includes('envLido') ? 'SIM' : 'NÃO -> substitua pelo server.js novo');
} catch {
  console.log('\n=> Não achei o server.js nesta pasta. Este arquivo precisa ficar ao lado dele.');
}
console.log('=============================\n');
