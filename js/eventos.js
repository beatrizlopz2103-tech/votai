// js/eventos.js - Lógica Principal, Interface e Autenticação Firebase

var categoriaAtiva = 'todas';
var textoBuscaAtivo = '';
var modoAtualAuth = 'entrar';
var timersAtivos = {};

function validarEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function tratarErroAuth(erro) {
  if (!erro) return;
  var codigo = erro.code || '';
  var mensagem = 'Ocorreu um erro na autenticação.';

  switch (codigo) {
    case 'auth/email-already-in-use':
      mensagem = 'Este e-mail já está cadastrado no sistema.';
      break;
    case 'auth/invalid-email':
      mensagem = 'O endereço de e-mail informado é inválido.';
      break;
    case 'auth/operation-not-allowed':
      mensagem = 'O provedor de E-mail/Senha não está ativado no Firebase Console.';
      break;
    case 'auth/weak-password':
      mensagem = 'A senha informada é muito fraca. Digite pelo menos 6 caracteres.';
      break;
    case 'auth/user-disabled':
      mensagem = 'Esta conta foi desativada.';
      break;
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      mensagem = 'E-mail ou senha incorretos.';
      break;
    case 'auth/too-many-requests':
      mensagem = 'Muitas tentativas sem sucesso. Aguarde um instante e tente novamente.';
      break;
    case 'auth/network-request-failed':
      mensagem = 'Falha de conexão com a rede. Verifique seu acesso à internet.';
      break;
    default:
      mensagem = erro.message || mensagem;
  }

  alert(mensagem);
}

function mudarAbaAuth(tipo) {
  modoAtualAuth = tipo;
  var btnEntrar = document.getElementById('tab-entrar');
  var btnCriar = document.getElementById('tab-criar');
  var titulo = document.getElementById('auth-titulo');
  var subtitulo = document.getElementById('auth-subtitulo');
  var groupNome = document.getElementById('group-nome');
  var groupTurma = document.getElementById('group-turma');
  var groupConfirma = document.getElementById('group-confirma');
  var btnSubmit = document.getElementById('btn-auth-submit');

  if (tipo === 'entrar') {
    if (btnEntrar) btnEntrar.classList.add('active');
    if (btnCriar) btnCriar.classList.remove('active');
    if (titulo) titulo.textContent = 'Entre na sua conta';
    if (subtitulo) subtitulo.textContent = 'Use seu perfil para participar das enquetes da turma.';
    if (groupNome) groupNome.style.display = 'none';
    if (groupTurma) groupTurma.style.display = 'none';
    if (groupConfirma) groupConfirma.style.display = 'none';
    if (btnSubmit) btnSubmit.textContent = 'Entrar';
  } else {
    if (btnCriar) btnCriar.classList.add('active');
    if (btnEntrar) btnEntrar.classList.remove('active');
    if (titulo) titulo.textContent = 'Crie seu perfil';
    if (subtitulo) subtitulo.textContent = 'Cadastre-se para criar enquetes e sincronizar com a turma.';
    if (groupNome) groupNome.style.display = 'flex';
    if (groupTurma) groupTurma.style.display = 'flex';
    if (groupConfirma) groupConfirma.style.display = 'flex';
    if (btnSubmit) btnSubmit.textContent = 'Criar minha conta';
  }
}

function ocultarDashboard() {
  var dash = document.getElementById('dashboard-app');
  var authScreen = document.getElementById('tela-auth');
  if (dash) dash.style.display = 'none';
  if (authScreen) authScreen.style.display = 'flex';
}

function exibirDashboard(usuario) {
  var authScreen = document.getElementById('tela-auth');
  var dash = document.getElementById('dashboard-app');
  if (authScreen) authScreen.style.display = 'none';
  if (dash) dash.style.display = 'flex';

  var elName = document.getElementById('sidebar-user-name');
  var elEmail = document.getElementById('sidebar-user-email');
  if (elName) elName.textContent = usuario.nome || 'Usuário';
  if (elEmail) elEmail.textContent = usuario.email || '';

  var iniciais = usuario.nome ? usuario.nome.substring(0, 2).toUpperCase() : 'EU';
  var avatar = document.getElementById('user-avatar');
  var mobAvatar = document.getElementById('mobile-user-initials');
  if (avatar) avatar.textContent = iniciais;
  if (mobAvatar) mobAvatar.textContent = iniciais;

  var inNome = document.getElementById('input-nome');
  var inEmail = document.getElementById('input-email');
  var inTurma = document.getElementById('input-turma');
  if (inNome) inNome.value = usuario.nome || '';
  if (inEmail) inEmail.value = usuario.email || '';
  if (inTurma) inTurma.value = usuario.turma || '';

  aplicarFiltros();
  atualizarTelaResultados();
}

// =========================================================================
// FUNÇÃO TEMPORÁRIA DE TESTE (Item 3 do pedido)
// Cadastra e autentica automaticamente o usuário teste@votaai.com / 123456
// =========================================================================
window.cadastrarUsuarioTeste = async function() {
  var emailTeste = "teste@votaai.com";
  var senhaTeste = "123456";
  var nomeTeste = "Usuário Teste";
  var turmaTeste = "3º Ano B";

  console.log("-> [Teste] Iniciando verificação do usuário de teste:", emailTeste);

  if (typeof auth !== 'undefined' && auth) {
    try {
      var userCredential = null;
      try {
        userCredential = await auth.createUserWithEmailAndPassword(emailTeste, senhaTeste);
        console.log("-> [Teste] Usuário criado com sucesso no Firebase Auth! UID:", userCredential.user.uid);
      } catch (errCreate) {
        if (errCreate.code === 'auth/email-already-in-use') {
          console.log("-> [Teste] Usuário já existia no Firebase Auth. Autenticando com senha...");
          userCredential = await auth.signInWithEmailAndPassword(emailTeste, senhaTeste);
          console.log("-> [Teste] Login efetuado com sucesso! UID:", userCredential.user.uid);
        } else {
          throw errCreate;
        }
      }

      var user = userCredential.user;

      // Atualiza displayName no Auth
      if (user && user.updateProfile) {
        await user.updateProfile({ displayName: nomeTeste });
      }

      // Salva dados no Firestore
      if (db && user) {
        try {
          await db.collection('usuarios').doc(user.uid).set({
            uid: user.uid,
            nome: nomeTeste,
            email: emailTeste,
            turma: turmaTeste,
            criadoEm: Date.now()
          }, { merge: true });
          console.log("-> [Teste] Dados do usuário salvos com sucesso no Firestore (coleção 'usuarios')!");
        } catch (dbErr) {
          console.warn("-> [Teste] Aviso ao gravar no Firestore:", dbErr.message);
        }
      }

      alert("Usuário de teste autenticado com sucesso!\n\nE-mail: " + emailTeste + "\nSenha: " + senhaTeste);
      return user;
    } catch (err) {
      console.error("-> [Teste] Erro ao cadastrar/logar usuário de teste:", err);
      alert("Erro ao testar Firebase Auth: " + err.message);
    }
  } else {
    alert("Firebase Auth não está inicializado. Verifique as credenciais em js/firebase-config.js");
  }
};

function configurarAuth() {
  var formAuth = document.getElementById('form-auth');

  // Recupera sessão local prévia para evitar piscar tela de login ao atualizar a página
  var sessaoSalva = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
  if (sessaoSalva) {
    exibirDashboard(sessaoSalva);
  }

  // Monitora alterações de login/logout via Firebase onAuthStateChanged
  if (typeof auth !== 'undefined' && auth) {
    // Garante que a persistência seja local e mantida
    if (auth.setPersistence && firebase.auth.Auth.Persistence) {
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function(err) {
        console.warn("Persistência local:", err);
      });
    }

    auth.onAuthStateChanged(async function(user) {
      if (user) {
        var nome = user.displayName || user.email.split('@')[0];
        var turma = '';

        // Tenta buscar dados complementares no Firestore
        if (db) {
          try {
            var docSnap = await db.collection('usuarios').doc(user.uid).get();
            if (docSnap.exists) {
              var dados = docSnap.data();
              if (dados.nome) nome = dados.nome;
              if (dados.turma) turma = dados.turma;
            }
          } catch (e) {
            console.warn("Aviso ao carregar dados do usuário no Firestore:", e.message);
          }
        }

        var usuarioAtual = {
          uid: user.uid,
          nome: nome,
          email: user.email,
          turma: turma
        };

        // Mantém o estado no localStorage
        localStorage.setItem('votaai_usuario_logado', JSON.stringify(usuarioAtual));
        exibirDashboard(usuarioAtual);
      } else {
        localStorage.removeItem('votaai_usuario_logado');
        ocultarDashboard();
      }
    });
  }

  // Botão/Link para preencher com dados de teste
  var linkTeste = document.getElementById('link-usuario-teste');
  if (linkTeste) {
    linkTeste.addEventListener('click', function(e) {
      e.preventDefault();
      var inEmail = document.getElementById('auth-email');
      var inSenha = document.getElementById('auth-senha');
      if (inEmail) inEmail.value = 'teste@votaai.com';
      if (inSenha) inSenha.value = '123456';
      
      // Executa o teste diretamente
      window.cadastrarUsuarioTeste();
    });
  }

  // Formulário de Cadastro e Login integrado ao Firebase Auth
  if (formAuth) {
    formAuth.addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('auth-email').value.trim().toLowerCase();
      var senha = document.getElementById('auth-senha').value.trim();
      var btnSubmit = document.getElementById('btn-auth-submit');

      if (!validarEmail(email)) {
        alert('Por favor, digite um e-mail válido!');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processando...';
      }

      try {
        if (modoAtualAuth === 'criar') {
          // CADASTRO NOVO COM createUserWithEmailAndPassword
          var nome = document.getElementById('auth-nome').value.trim();
          var turma = document.getElementById('auth-turma').value.trim();
          var confirma = document.getElementById('auth-confirma-senha').value.trim();

          if (!nome || !email || !senha || !confirma) {
            alert('Preencha todos os campos!');
            return;
          }

          if (senha !== confirma) {
            alert('As senhas não coincidem!');
            return;
          }

          if (senha.length < 6) {
            alert('A senha deve conter no mínimo 6 caracteres para o Firebase.');
            return;
          }

          if (typeof auth !== 'undefined' && auth) {
            var userCredential = await auth.createUserWithEmailAndPassword(email, senha);
            var user = userCredential.user;

            if (user && user.updateProfile) {
              await user.updateProfile({ displayName: nome });
            }

            if (db && user) {
              try {
                await db.collection('usuarios').doc(user.uid).set({
                  uid: user.uid,
                  nome: nome,
                  email: email,
                  turma: turma,
                  criadoEm: Date.now()
                });
              } catch (dbErr) {
                console.warn("Aviso ao salvar no Firestore:", dbErr.message);
              }
            }

            // O onAuthStateChanged detectará a nova sessão e abrirá o dashboard
          } else {
            var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];
            if (contas.find(function(c) { return c.email === email; })) {
              alert('Este e-mail já está cadastrado!');
              return;
            }

            var novaConta = { nome: nome, email: email, turma: turma, senha: senha };
            contas.push(novaConta);
            localStorage.setItem('votaai_contas', JSON.stringify(contas));
            localStorage.setItem('votaai_usuario_logado', JSON.stringify(novaConta));
            exibirDashboard(novaConta);
          }
        } else {
          // LOGIN COM signInWithEmailAndPassword
          if (typeof auth !== 'undefined' && auth) {
            await auth.signInWithEmailAndPassword(email, senha);
            // O onAuthStateChanged detectará a sessão autenticada e abrirá o dashboard
          } else {
            var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];
            var contaEncontrada = contas.find(function(c) { return c.email === email && c.senha === senha; });
            if (contaEncontrada) {
              localStorage.setItem('votaai_usuario_logado', JSON.stringify(contaEncontrada));
              exibirDashboard(contaEncontrada);
            } else {
              alert('E-mail ou senha incorretos!');
            }
          }
        }
      } catch (error) {
        console.error("Erro na autenticação:", error);
        tratarErroAuth(error);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = (modoAtualAuth === 'criar' ? 'Criar minha conta' : 'Entrar');
        }
      }
    });
  }

  // Logout via Firebase Auth
  async function fazerLogout() {
    if (typeof auth !== 'undefined' && auth) {
      try {
        await auth.signOut();
      } catch (err) {
        console.error("Erro ao sair da conta:", err);
      }
    }
    localStorage.removeItem('votaai_usuario_logado');
    ocultarDashboard();
  }

  var btnLogout = document.getElementById('btn-logout');
  if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

  var btnLogoutMob = document.getElementById('btn-logout-mobile');
  if (btnLogoutMob) {
    btnLogoutMob.addEventListener('click', function(e) {
      e.preventDefault();
      fazerLogout();
    });
  }
}

function configurarNavegacao() {
  var linksSidebar = document.querySelectorAll('.sidebar-link, .mobile-nav-link');

  linksSidebar.forEach(function(link) {
    if (link.id === 'btn-logout-mobile') return;

    link.addEventListener('click', function(e) {
      e.preventDefault();
      var targetView = this.getAttribute('data-view');
      if (!targetView) return;

      document.querySelectorAll('.view-page').forEach(function(page) {
        page.style.display = 'none';
      });

      var paginaAlvo = document.getElementById(targetView);
      if (paginaAlvo) {
        paginaAlvo.style.display = 'block';
      }

      document.querySelectorAll('.sidebar-link, .mobile-nav-link').forEach(function(item) {
        item.classList.remove('active');
      });
      this.classList.add('active');

      if (targetView === 'view-resultados') {
        atualizarTelaResultados();
      }
    });
  });
}

function atualizarTelaResultados() {
  var totalEnquetes = enquetes.length;
  var totalVotos = 0;
  var totalEncerradas = 0;
  var votosPorCat = { 'Geral': 0, 'Tecnologia': 0, 'Educação': 0 };

  enquetes.forEach(function(e) {
    if (e.encerrada) totalEncerradas++;
    (e.opcoes || []).forEach(function(op) {
      var qtd = Number(op.votos) || 0;
      totalVotos += qtd;
      if (votosPorCat[e.categoria] !== undefined) {
        votosPorCat[e.categoria] += qtd;
      }
    });
  });

  var elTotEnq = document.getElementById('stat-total-enquetes');
  var elTotVot = document.getElementById('stat-total-votos');
  var elTotEnc = document.getElementById('stat-total-encerradas');
  if (elTotEnq) elTotEnq.textContent = totalEnquetes;
  if (elTotVot) elTotVot.textContent = totalVotos;
  if (elTotEnc) elTotEnc.textContent = totalEncerradas;

  for (var cat in votosPorCat) {
    var idCat = cat.toLowerCase();
    var barra = document.getElementById('barra-cat-' + idCat);
    var numVotos = document.getElementById('votos-cat-' + idCat);
    if (barra) {
      var pct = totalVotos > 0 ? Math.round((votosPorCat[cat] / totalVotos) * 100) : 0;
      barra.style.width = pct + '%';
    }
    if (numVotos) numVotos.textContent = votosPorCat[cat];
  }
}

function configurarPerfilEConfiguracoes() {
  var formCfg = document.getElementById('form-config');
  if (formCfg) {
    formCfg.addEventListener('submit', function(e) {
      e.preventDefault();
      var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado')) || {};
      var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;

      var inNome = document.getElementById('input-nome').value.trim();
      var inTurma = document.getElementById('input-turma').value.trim();

      usuarioLogado.nome = inNome;
      usuarioLogado.turma = inTurma;
      localStorage.setItem('votaai_usuario_logado', JSON.stringify(usuarioLogado));

      var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];
      var idx = contas.findIndex(function(c) { return c.email === usuarioLogado.email; });
      if (idx !== -1) {
        contas[idx] = usuarioLogado;
        localStorage.setItem('votaai_contas', JSON.stringify(contas));
      }

      if (userAuth) {
        if (userAuth.updateProfile) {
          userAuth.updateProfile({ displayName: inNome }).catch(console.warn);
        }
        if (db) {
          db.collection('usuarios').doc(userAuth.uid).set({
            nome: inNome,
            turma: inTurma,
            email: userAuth.email
          }, { merge: true }).catch(console.warn);
        }
      }

      exibirDashboard(usuarioLogado);
      alert('Perfil atualizado com sucesso!');
    });
  }

  var temaSalvo = localStorage.getItem('votaai_tema') || 'light';
  if (temaSalvo === 'dark') document.body.classList.add('dark-mode');

  var btnClaro = document.getElementById('btn-tema-claro');
  var btnEscuro = document.getElementById('btn-tema-escuro');

  if (btnClaro) {
    btnClaro.addEventListener('click', function() {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('votaai_tema', 'light');
    });
  }

  if (btnEscuro) {
    btnEscuro.addEventListener('click', function() {
      document.body.classList.add('dark-mode');
      localStorage.setItem('votaai_tema', 'dark');
    });
  }
}

function renderizarEnquetes(lista) {
  var container = document.getElementById('lista-enquetes');
  if (!container) return;
  container.innerHTML = '';

  if (lista.length === 0) {
    container.innerHTML = 
      '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">' +
        '<h3>Nenhuma enquete encontrada</h3>' +
        '<p style="font-size:0.85rem; margin-top:6px;">Clique no botão "+ Nova Enquete" acima para criar a primeira enquete da turma!</p>' +
      '</div>';
    return;
  }

  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
  var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;
  var userEmail = (userAuth && userAuth.email) ? userAuth.email.trim().toLowerCase() : 
                  (usuarioLogado && usuarioLogado.email ? usuarioLogado.email.trim().toLowerCase() : '');

  var estaLogado = Boolean(userAuth || usuarioLogado);
  var chaveVoto = 'votaai_voted_' + (userEmail || 'none');
  var enquetesVotadas = JSON.parse(localStorage.getItem(chaveVoto)) || [];

  lista.forEach(function(enquete) {
    var totalVotos = 0;
    (enquete.opcoes || []).forEach(function(op) { 
      totalVotos += (Number(op.votos) || 0); 
    });

    var votantes = enquete.votantes || [];
    var jaVotou = (userEmail && votantes.includes(userEmail)) || 
                  enquetesVotadas.includes(String(enquete.id));

    var statusTexto = enquete.encerrada 
      ? 'Encerrada' 
      : (jaVotou ? 'Voto Registrado' : (enquete.tempoRestante !== undefined ? enquete.tempoRestante + 's' : 'Ativa'));

    var autorTexto = enquete.criadorNome ? '<span style="font-size:0.75rem;color:var(--text-muted);">por ' + enquete.criadorNome + '</span>' : '';

    var htmlCard =
      '<div class="card-enquete" data-id="' + enquete.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:0.75rem;background:#e2e8f0;padding:2px 8px;border-radius:4px;color:#334155;font-weight:600;">' + enquete.categoria + '</span>' +
            autorTexto +
          '</div>' +
          '<span class="tempo-restante" style="font-size:0.8rem;color:var(--text-muted);font-weight:600;">' + statusTexto + '</span>' +
        '</div>' +
        '<h3 style="margin:12px 0 10px 0;font-size:1.05rem;line-height:1.4;">' + enquete.pergunta + '</h3>' +
        '<div class="opcoes-container">';

    (enquete.opcoes || []).forEach(function(opcao, index) {
      var votosOpcao = Number(opcao.votos) || 0;
      var pct = totalVotos > 0 ? Math.round((votosOpcao / totalVotos) * 100) : 0;
      var desabilitado = (!estaLogado || enquete.encerrada || jaVotou) ? 'disabled' : '';

      htmlCard +=
        '<div style="margin-bottom:8px;">' +
          '<button class="btn-votar" data-opcao="' + index + '" ' + desabilitado + ' style="width:100%;text-align:left;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-card);color:var(--text-main);cursor:' + (desabilitado ? 'default' : 'pointer') + ';display:flex;justify-content:space-between;align-items:center;">' +
            '<span>' + opcao.texto + '</span>' +
            '<span style="font-size:0.8rem;color:var(--text-muted);">' + pct + '% (' + votosOpcao + 'v)</span>' +
          '</button>' +
          '<div style="background:var(--border-color);border-radius:4px;height:6px;overflow:hidden;margin-top:4px;">' +
            '<div style="width:' + pct + '%;background:var(--primary);height:100%;transition:width 0.3s ease;"></div>' +
          '</div>' +
        '</div>';
    });

    htmlCard += '</div></div>';
    container.innerHTML += htmlCard;
  });
}

function aplicarFiltros() {
  var resultado = filtrarEnquetes(textoBuscaAtivo, categoriaAtiva);
  renderizarEnquetes(resultado);
}

function configurarEventos() {
  configurarAuth();
  configurarNavegacao();
  configurarPerfilEConfiguracoes();

  var busca = document.getElementById('campo-busca');
  if (busca) {
    busca.addEventListener('input', function(e) {
      textoBuscaAtivo = e.target.value;
      aplicarFiltros();
    });
  }

  document.querySelectorAll('.cat-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      categoriaAtiva = this.getAttribute('data-cat');

      document.querySelectorAll('.cat-link').forEach(function(l) {
        l.classList.remove('active');
      });
      this.classList.add('active');

      aplicarFiltros();
    });
  });

  // Voto em tempo real (apenas usuários logados)
  var listaEnq = document.getElementById('lista-enquetes');
  if (listaEnq) {
    listaEnq.addEventListener('click', async function(e) {
      var btn = e.target.closest('.btn-votar');
      if (!btn || btn.disabled) return;

      var card = btn.closest('.card-enquete');
      if (!card) return;

      var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
      var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;

      if (!userAuth && !usuarioLogado) {
        alert('Você precisa estar logado na sua conta para votar!');
        ocultarDashboard();
        return;
      }

      var idEnquete = card.dataset.id;
      var idxOpcao = parseInt(btn.dataset.opcao, 10);

      btn.disabled = true;

      try {
        var sucesso = await registrarVoto(idEnquete, idxOpcao);
        if (!sucesso) {
          btn.disabled = false;
        }
      } catch (err) {
        console.error("Erro ao votar:", err);
        btn.disabled = false;
      }
    });
  }

  // Adicionar campo de nova opção no modal
  var btnAddOpcao = document.getElementById('btn-add-opcao');
  if (btnAddOpcao) {
    btnAddOpcao.addEventListener('click', function() {
      var container = document.getElementById('container-opcoes');
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'opcao-input';
      input.placeholder = 'Nova Opção';
      input.style.marginBottom = '8px';
      container.appendChild(input);
    });
  }

  // Criação de enquete (apenas usuários logados)
  var formEnq = document.getElementById('form-enquete');
  if (formEnq) {
    formEnq.addEventListener('submit', async function(e) {
      e.preventDefault();

      var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
      var userAuth = (typeof auth !== 'undefined' && auth && auth.currentUser) ? auth.currentUser : null;

      if (!userAuth && !usuarioLogado) {
        alert('Você precisa estar logado na sua conta para criar uma enquete!');
        document.getElementById('modal-enquete').style.display = 'none';
        ocultarDashboard();
        return;
      }

      var btnSubmit = formEnq.querySelector('button[type="submit"]');
      var pergunta = document.getElementById('pergunta').value.trim();
      var categoria = document.getElementById('categoria').value;
      var duracao = parseInt(document.getElementById('duracao').value, 10);

      var opcoes = [];
      document.querySelectorAll('.opcao-input').forEach(function(inp) {
        if (inp.value.trim() !== '') opcoes.push(inp.value.trim());
      });

      if (pergunta.length < 5 || opcoes.length < 2) {
        alert('Preencha a pergunta (mínimo 5 caracteres) e pelo menos 2 alternativas.');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Enviando...';
      }

      try {
        await criarNovaEnquete(pergunta, opcoes, categoria, duracao);

        this.reset();
        var containerOpcoes = document.getElementById('container-opcoes');
        if (containerOpcoes) {
          containerOpcoes.innerHTML = 
            '<input type="text" class="opcao-input" placeholder="Opção 1" required style="margin-bottom:8px;">' +
            '<input type="text" class="opcao-input" placeholder="Opção 2" required style="margin-bottom:8px;">';
        }
        document.getElementById('modal-enquete').style.display = 'none';
      } catch (err) {
        console.error("Erro ao submeter nova enquete:", err);
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Criar Enquete';
        }
      }
    });
  }
}

function limparTodosTimers() {
  for (var id in timersAtivos) {
    if (timersAtivos[id]) clearInterval(timersAtivos[id]);
  }
  timersAtivos = {};
}

function iniciarTemporizadores() {
  limparTodosTimers();
  enquetes.forEach(function(enquete) {
    iniciarTimerEnquete(enquete);
  });
}

function iniciarTimerEnquete(enquete) {
  if (enquete.encerrada) return;
  var id = String(enquete.id);
  if (timersAtivos[id]) clearInterval(timersAtivos[id]);

  timersAtivos[id] = setInterval(function() {
    enquete.tempoRestante -= 1;
    var card = document.querySelector('.card-enquete[data-id="' + id + '"]');

    if (card) {
      var pTempo = card.querySelector('.tempo-restante');
      if (pTempo && !pTempo.textContent.includes('Voto') && !pTempo.textContent.includes('Encerrada')) {
        pTempo.textContent = enquete.tempoRestante + 's';
      }
    }

    if (enquete.tempoRestante <= 0) {
      clearInterval(timersAtivos[id]);
      delete timersAtivos[id];
      enquete.encerrada = true;

      encerrarEnqueteNoFirestore(id);
      aplicarFiltros();
      atualizarTelaResultados();
    }
  }, 1000);
}
