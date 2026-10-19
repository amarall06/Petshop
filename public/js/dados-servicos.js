// =====================================================================
//  EDITE AQUI: valores, perguntas frequentes e depoimentos da página
//  "Serviços". Não precisa mexer em mais nenhum arquivo.
// =====================================================================
//
//  PREÇOS: troque null pelo valor, só o número (ex.: 60 ou 59.9).
//          Onde ficar null aparece "Consulte". Se TODOS os preços de um
//          serviço forem null, aparece "Valores sob consulta".
//          A ordem dos preços segue a ordem de "portes" logo abaixo.
//
window.DADOS = {
  portes: ['Pequeno', 'Médio', 'Grande'],

  servicos: [
    {
      nome: 'Banho',
      icone: 'bi-droplet',
      descricao: 'Banho para deixar o seu pet limpo e cheiroso.',
      tempo: '', // ex.: 'Em média 1 hora'
      precos: [null, null, null],
      acao: 'agendar', // 'agendar' = leva para a página de agendamento
    },
    {
      nome: 'Tosa',
      icone: 'bi-scissors',
      descricao: 'Corte de pelo para o seu pet.',
      tempo: '',
      precos: [null, null, null],
      acao: 'agendar',
    },
    {
      nome: 'Banho e Tosa',
      icone: 'bi-stars',
      descricao: 'Banho e tosa no mesmo horário.',
      tempo: '',
      precos: [null, null, null],
      acao: 'agendar',
    },
    {
      nome: 'Hotel Pet',
      icone: 'bi-house-heart',
      descricao: 'Hospedagem para o seu pet.',
      tempo: '',
      precos: [null, null, null],
      acao: 'whatsapp', // 'whatsapp' = abre a conversa com a loja
      mensagem: 'Olá! Gostaria de consultar vagas e valores do Hotel Pet.',
    },
    {
      nome: 'Adestramento',
      icone: 'bi-mortarboard',
      descricao: 'Adestramento canino.',
      tempo: '',
      precos: [null, null, null],
      acao: 'whatsapp',
      mensagem: 'Olá! Gostaria de saber mais sobre o adestramento.',
    },
    {
      nome: 'Creche',
      icone: 'bi-balloon-heart',
      descricao: 'Creche para o seu pet.',
      tempo: '',
      precos: [null, null, null],
      acao: 'whatsapp',
      mensagem: 'Olá! Gostaria de saber mais sobre a creche.',
    },
  ],

  // PERGUNTAS FREQUENTES: p = pergunta, r = resposta. Acrescente as suas
  // (vacinas, horários, o que levar, política de cancelamento etc.).
  faq: [
    {
      p: 'Como agendo o banho e tosa?',
      r: 'Pelo próprio site, na página Banho/Tosa: escolha o serviço, a data e um horário livre. Também dá para combinar pelo WhatsApp.',
    },
    {
      p: 'Posso remarcar ou cancelar um horário?',
      r: 'Sim. Fale com a gente pelo WhatsApp que ajudamos a remarcar ou cancelar.',
    },
    {
      p: 'Como consulto vagas no Hotel Pet?',
      r: 'Pelo WhatsApp: use o botão "Consultar vagas" na página do Hotel e informe as datas desejadas.',
    },
    {
      p: 'Quais são as formas de pagamento?',
      r: 'As formas de pagamento aceitas aparecem no rodapé do site.',
    },
    {
      p: 'Onde fica a loja?',
      r: 'O mapa com a localização está na página inicial.',
    },
  ],

  // DEPOIMENTOS: só use depoimentos reais, com autorização do cliente.
  // Enquanto a lista estiver vazia, a seção nem aparece no site.
  // Exemplo (tire as barras // para usar):
  depoimentos: [
    // { texto: 'Meu cachorro voltou lindo e cheiroso!', nome: 'Maria S.', pet: 'Thor' },
  ],
};
