// js/enquetes.js - Gerenciamento de Dados e Sincronização em Tempo Real com Firestore

var enquetes = [];
var unsubscribeEnquetes = null;

// Salva em cache local como segurança/backup offline
function salvarEnquetesLocal() {
  localStorage.setItem('votaai_enquetes_cache', JSON.stringify(enquetes));
}

// Inicia a escuta em tempo real (onSnapshot) com o Firebase Firestore
function iniciarSincronizacaoFirestore() {
  if (db) {
    if (unsubscribeEnquetes) {
      unsubscribeEnquetes();
    }

    if (typeof atualizarStatusAPI === 'function') {
      atualizarStatusAPI('sincronizando', 'Sincronizando...');
    }

    unsubscribeEnquetes = db.collection('enquetes').onSnapshot(function(snapshot) {
      var listaAtualizada = [];
      var agora = Date.now();

      snapshot.forEach(function(doc) {
        var dados = doc.data();
        dados.id = doc.id; // Garante o ID do documento do Firestore

        var criadoEm = dados.criadoEm || agora;
        var duracao = Number(dados.duracao) || 120;
        var segundosPassados = Math.floor((agora - criadoEm) / 1000);
        var tempoRestante = Math.max(0, duracao - segundosPassados);
        var encerrada = dados.encerrada || (tempoRestante <= 0);

        dados.tempoRestante = tempoRestante;
        dados.encerrada = encerrada;
        if (!dados.votantes || !Array.isArray(dados.votantes)) {
          dados.votantes = [];
        }
        if (!dados.opcoes || !Array.isArray(dados.opcoes)) {
          dados.opcoes = [];
        }

        listaAtualizada.push(dados);
      });

      // Ordenar pelas enquetes mais recentes primeiro
      listaAtualizada.sort(function(a, b) {
        return (b.criadoEm || 0) - (a.criadoEm || 0);
      });

      enquetes = listaAtualizada;
      salvarEnquetesLocal();

      if (typeof atualizarStatusAPI === 'function') {
        atualizarStatusAPI('conectado', 'Firestore Online');
      }

      // Atualiza a visualização da tela instantaneamente
      if (typeof aplicarFiltros === 'function') {
        aplicarFiltros();
      }
      if (typeof atualizarTelaResultados === 'function') {
        atualizarTelaResultados();
      }
      if (typeof iniciarTemporizadores === 'function') {
        iniciarTemporizadores();
      }
    }, function(erro) {
      console.warn("Aviso na sincronização em tempo real do Firestore:", erro);
      if (typeof atualizarStatusAPI === 'function') {
        if (erro.code === 'permission-denied') {
          atualizarStatusAPI('aviso', 'Regras Bloqueadas');
        } else {
          atualizarStatusAPI('erro', 'Erro Firestore');
        }
      }
      carregarEnquetesFallback();
    });
  } else {
    // Caso o Firestore ainda não esteja ativo
    carregarEnquetesFallback();
  }
}

// Fallback para exibir dados locais caso o Firebase esteja desconectado
function carregarEnquetesFallback() {
  enquetes = JSON.parse(localStorage.getItem('votaai_enquetes_cache')) || 
             JSON.parse(localStorage.getItem('votaai_enquetes')) || [];

  if (typeof aplicarFiltros === 'function') {
    aplicarFiltros();
  }
  if (typeof atualizarTelaResultados === 'function') {
    atualizarTelaResultados();
  }
  if (typeof iniciarTemporizadores === 'function') {
    iniciarTemporizadores();
  }
}

// Cria uma nova enquete e a envia diretamente ao Firestore
async function criarNovaEnquete(pergunta, opcoesTextos, categoria, duracao) {
  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
  var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;

  // Apenas usuários logados podem criar enquetes
  if (!userAuth && !usuarioLogado) {
    alert('Você precisa estar conectado à sua conta para criar uma enquete!');
    throw new Error('Usuário não autenticado.');
  }

  var criadorNome = (userAuth && userAuth.displayName) ? userAuth.displayName : 
                    (usuarioLogado && usuarioLogado.nome ? usuarioLogado.nome : 'Usuário');
  var criadorEmail = (userAuth && userAuth.email) ? userAuth.email : 
                     (usuarioLogado && usuarioLogado.email ? usuarioLogado.email : 'usuario@votaai.com');
  var criadorUid = userAuth ? userAuth.uid : (usuarioLogado.uid || null);

  var novasOpcoes = opcoesTextos.map(function(texto) {
    return { texto: texto, votos: 0 };
  });

  var agora = Date.now();
  var duracaoNum = Number(duracao) || 120;

  var novaEnquete = {
    pergunta: pergunta,
    categoria: categoria,
    duracao: duracaoNum,
    criadoEm: agora,
    criadorNome: criadorNome,
    criadorEmail: criadorEmail,
    criadorUid: criadorUid,
    encerrada: false,
    opcoes: novasOpcoes,
    votantes: []
  };

  if (db) {
    try {
      var docRef = await db.collection('enquetes').add(novaEnquete);
      novaEnquete.id = docRef.id;
      // O onSnapshot sincronizará automaticamente a nova enquete para todos os usuários conectados
      return novaEnquete;
    } catch (erro) {
      console.error("Erro ao adicionar enquete no Firestore:", erro);
      if (erro.code === 'permission-denied') {
        alert("Aviso de Permissão do Firestore: Acesso negado pelas Regras de Segurança do Firebase.\n\nPara que todos vejam na nuvem, libere as Regras de Segurança no painel do Firebase.");
      } else {
        alert("Erro ao salvar enquete no Firebase: " + erro.message);
      }

      // Salva localmente como segurança para não perder os dados
      novaEnquete.id = 'local_' + agora;
      novaEnquete.tempoRestante = duracaoNum;
      enquetes.unshift(novaEnquete);
      salvarEnquetesLocal();
      if (typeof aplicarFiltros === 'function') aplicarFiltros();
      if (typeof atualizarTelaResultados === 'function') atualizarTelaResultados();
      if (typeof iniciarTimerEnquete === 'function') iniciarTimerEnquete(novaEnquete);
      return novaEnquete;
    }
  } else {
    // Fallback local se o Firebase não estiver configurado
    novaEnquete.id = 'local_' + agora;
    novaEnquete.tempoRestante = duracaoNum;
    enquetes.unshift(novaEnquete);
    salvarEnquetesLocal();
    localStorage.setItem('votaai_enquetes', JSON.stringify(enquetes));

    if (typeof aplicarFiltros === 'function') aplicarFiltros();
    if (typeof atualizarTelaResultados === 'function') atualizarTelaResultados();
    if (typeof iniciarTimerEnquete === 'function') iniciarTimerEnquete(novaEnquete);
    return novaEnquete;
  }
}

// Registra o voto de um usuário na opção escolhida (apenas usuários logados)
async function registrarVoto(idEnquete, idxOpcao) {
  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
  var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;

  // Apenas usuários logados podem votar
  if (!userAuth && !usuarioLogado) {
    alert('Você precisa entrar na sua conta para votar nesta enquete!');
    return false;
  }

  var userIdentifier = (userAuth && userAuth.email) ? userAuth.email.trim().toLowerCase() : 
                       (usuarioLogado && usuarioLogado.email ? usuarioLogado.email.trim().toLowerCase() : '');

  if (!userIdentifier) {
    alert('Identificação de usuário necessária para votar.');
    return false;
  }

  var chaveVoto = 'votaai_voted_' + userIdentifier;
  var enquetesVotadas = JSON.parse(localStorage.getItem(chaveVoto)) || [];

  if (enquetesVotadas.includes(String(idEnquete))) {
    alert('Você já registrou seu voto nesta enquete!');
    return false;
  }

  var enquete = enquetes.find(function(item) { return String(item.id) === String(idEnquete); });
  if (enquete) {
    if (enquete.encerrada) {
      alert('Esta enquete já foi encerrada!');
      return false;
    }
    if (enquete.votantes && enquete.votantes.includes(userIdentifier)) {
      alert('Você já votou nesta enquete!');
      return false;
    }
  }

  if (db && !String(idEnquete).startsWith('local_')) {
    try {
      var docRef = db.collection('enquetes').doc(String(idEnquete));

      // Uso de transação atômica no Firestore para segurança contra concorrência
      await db.runTransaction(async function(transaction) {
        var doc = await transaction.get(docRef);
        if (!doc.exists) {
          throw new Error("Enquete não encontrada no Firestore.");
        }

        var data = doc.data();
        var votantes = data.votantes || [];

        if (votantes.includes(userIdentifier)) {
          throw new Error("Você já votou nesta enquete!");
        }

        var opcoes = data.opcoes || [];
        if (!opcoes[idxOpcao]) {
          throw new Error("Opção de voto inválida.");
        }

        opcoes[idxOpcao].votos = (opcoes[idxOpcao].votos || 0) + 1;
        votantes.push(userIdentifier);

        transaction.update(docRef, {
          opcoes: opcoes,
          votantes: votantes
        });
      });

      // Salva no registro local do usuário para validação imediata na interface
      if (!enquetesVotadas.includes(String(idEnquete))) {
        enquetesVotadas.push(String(idEnquete));
        localStorage.setItem(chaveVoto, JSON.stringify(enquetesVotadas));
      }

      return true;
    } catch (erro) {
      console.error("Erro ao registrar voto no Firestore:", erro);
      if (erro.code === 'permission-denied') {
        alert("Aviso de Regras do Firestore: Permissão negada ao salvar voto no servidor.\n(Voto computado localmente nesta sessão).");
      } else {
        alert(erro.message || "Erro ao registrar voto.");
      }

      // Fallback local se falhar por permissão
      if (enquete && !enquete.encerrada) {
        enquete.opcoes[idxOpcao].votos = (enquete.opcoes[idxOpcao].votos || 0) + 1;
        if (!enquete.votantes) enquete.votantes = [];
        enquete.votantes.push(userIdentifier);
        salvarEnquetesLocal();
        enquetesVotadas.push(String(idEnquete));
        localStorage.setItem(chaveVoto, JSON.stringify(enquetesVotadas));
        if (typeof aplicarFiltros === 'function') aplicarFiltros();
        if (typeof atualizarTelaResultados === 'function') atualizarTelaResultados();
      }
      return false;
    }
  } else {
    // Fallback local se o Firebase não estiver ativo ou for enquete local
    if (enquete && !enquete.encerrada) {
      enquete.opcoes[idxOpcao].votos = (enquete.opcoes[idxOpcao].votos || 0) + 1;
      if (!enquete.votantes) enquete.votantes = [];
      enquete.votantes.push(userIdentifier);
      salvarEnquetesLocal();

      enquetesVotadas.push(String(idEnquete));
      localStorage.setItem(chaveVoto, JSON.stringify(enquetesVotadas));

      if (typeof aplicarFiltros === 'function') aplicarFiltros();
      if (typeof atualizarTelaResultados === 'function') atualizarTelaResultados();
      return true;
    }
    return false;
  }
}

// Marca a enquete como encerrada no Firestore quando o tempo expira
async function encerrarEnqueteNoFirestore(idEnquete) {
  if (db && idEnquete && !String(idEnquete).startsWith('local_')) {
    try {
      await db.collection('enquetes').doc(String(idEnquete)).update({
        encerrada: true
      });
    } catch (err) {
      console.warn("Aviso ao encerrar enquete no Firestore:", err);
    }
  }
}

// Filtra as enquetes por categoria e busca
function filtrarEnquetes(termoBusca, categoria) {
  var termo = termoBusca ? termoBusca.toLowerCase() : '';
  return enquetes.filter(function(enq) {
    var matchCategoria = (!categoria || categoria === 'todas' || enq.categoria === categoria);
    var matchBusca = (enq.pergunta || '').toLowerCase().includes(termo);
    return matchCategoria && matchBusca;
  });
}
