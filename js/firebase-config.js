// js/firebase-config.js - Configuração e Inicialização do Firebase Firestore

// =========================================================================
// CREDENCIAIS DO FIREBASE FORNECIDAS PELO PROFESSOR:
// Substitua os campos abaixo pelos dados do projeto Firebase do seu professor.
// =========================================================================
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID_AQUI",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Instância global do Firestore
var db = null;

try {
  if (typeof firebase !== 'undefined') {
    // Verifica se as credenciais foram preenchidas (não são o placeholder padrão)
    var chavesConfiguradas = firebaseConfig.projectId && 
                             firebaseConfig.projectId !== "SEU_PROJECT_ID_AQUI" &&
                             !firebaseConfig.projectId.includes("SEU_");

    if (chavesConfiguradas) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      console.log("Firebase Firestore inicializado com sucesso!");
    } else {
      console.warn("Firebase: Insira as credenciais do seu professor em js/firebase-config.js para ativar a sincronização em tempo real na nuvem.");
    }
  } else {
    console.warn("SDK do Firebase não encontrado. Verifique a importação dos scripts no index.html.");
  }
} catch (erro) {
  console.error("Erro ao inicializar Firebase Firestore:", erro);
}

