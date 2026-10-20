// js/api.js - Conexão Assíncrona de Teste
async function carregarStatusAPI() {
  var badge = document.getElementById('api-status');
  try {
    var resposta = await fetch('https://jsonplaceholder.typicode.com/users/1');
    if (resposta.ok) {
      if (badge) {
        badge.textContent = 'API Conectada';
        badge.style.color = '#38bdf8';
      }
    }
  } catch (erro) {
    if (badge) {
      badge.textContent = 'Modo Offline (Local)';
      badge.style.color = '#facc15';
    }
  }
}