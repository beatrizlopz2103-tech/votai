// js/app.js - Inicialização do Aplicativo VotaAí
document.addEventListener('DOMContentLoaded', function() {
  carregarStatusAPI();
  configurarEventos();
  iniciarSincronizacaoFirestore();
});

