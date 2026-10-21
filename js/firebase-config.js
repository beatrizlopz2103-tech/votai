// js/firebase-config.js - Configuração e Inicialização do Firebase (Firestore e Authentication)

// =========================================================================
// CREDENCIAIS DO FIREBASE FORNECIDAS PELO PROFESSOR:
// Substitua os campos abaixo pelos dados do projeto Firebase do seu professor.
// =========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBQrXFZegU2gf7yco3hjJzt9UDXiFvnK4o",
  authDomain: "projeto-votaai.firebaseapp.com",
  projectId: "projeto-votaai",
  storageBucket: "projeto-votaai.firebasestorage.app",
  messagingSenderId: "847787569678",
  appId: "1:847787569678:web:f5254c462316da78e6425f"
};

// Instâncias globais do Firebase
var db = null;
var auth = null;

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
      auth = firebase.auth();
      console.log("Firebase Firestore e Auth inicializados com sucesso!");
    } else {
      console.warn("Firebase: Insira as credenciais do seu professor em js/firebase-config.js para ativar o Auth e Firestore.");
    }
  } else {
    console.warn("SDK do Firebase não encontrado. Verifique a importação dos scripts no index.html.");
  }
} catch (erro) {
  console.error("Erro ao inicializar Firebase:", erro);
}
