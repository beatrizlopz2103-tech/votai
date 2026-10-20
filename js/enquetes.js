// js/enquetes.js - Gerenciamento de Dados e Enquetes (Início Limpo)
var enquetes = JSON.parse(localStorage.getItem('votaai_enquetes')) || [];

function salvarEnquetes() {
  localStorage.setItem('votaai_enquetes', JSON.stringify(enquetes));
}

function criarNovaEnquete(pergunta, opcoesTextos, categoria, duracao) {
  var novasOpcoes = opcoesTextos.map(function(texto) {
    return { texto: texto, votos: 0 };
  });

  var novaEnquete = {
    id: Date.now(),
    pergunta: pergunta,
    categoria: categoria,
    duracao: duracao,
    tempoRestante: duracao,
    encerrada: false,
    opcoes: novasOpcoes
  };

  enquetes.unshift(novaEnquete);
  salvarEnquetes();
  return novaEnquete;
}

function filtrarEnquetes(termoBusca, categoria) {
  var termo = termoBusca ? termoBusca.toLowerCase() : '';
  return enquetes.filter(function(enq) {
    var matchCategoria = (categoria === 'todas' || enq.categoria === categoria);
    var matchBusca = enq.pergunta.toLowerCase().includes(termo);
    return matchCategoria && matchBusca;
  });
}