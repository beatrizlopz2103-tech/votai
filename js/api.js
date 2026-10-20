// js/api.js - Conexão e Monitoramento de Status com o Firebase Firestore

function atualizarStatusAPI(status, texto) {
  var badge = document.getElementById('api-status');
  if (!badge) return;

  if (status === 'conectado') {
    badge.textContent = texto || 'Firestore Conectado';
    badge.style.color = '#38bdf8';
  } else if (status === 'sincronizando') {
    badge.textContent = texto || 'Sincronizando...';
    badge.style.color = '#60a5fa';
  } else if (status === 'aviso') {
    badge.textContent = texto || 'Configurar Firebase';
    badge.style.color = '#facc15';
  } else if (status === 'erro') {
    badge.textContent = texto || 'Modo Offline (Erro)';
    badge.style.color = '#f87171';
  } else {
    badge.textContent = texto || 'Modo Local';
    badge.style.color = '#94a3b8';
  }
}

async function carregarStatusAPI() {
  var badge = document.getElementById('api-status');
  if (!badge) return;

  if (typeof db !== 'undefined' && db) {
    atualizarStatusAPI('sincronizando', 'Conectando Firestore...');
  } else if (typeof firebaseConfig !== 'undefined' && 
            (firebaseConfig.projectId === 'SEU_PROJECT_ID_AQUI' || firebaseConfig.projectId.includes('SEU_'))) {
    atualizarStatusAPI('aviso', 'Configurar Firebase');
  } else {
    atualizarStatusAPI('modo_local', 'Modo Local (Offline)');
  }
}

}