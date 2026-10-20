// js/eventos.js - Lógica Principal, Interface e Interatividade

var categoriaAtiva = 'todas';
var textoBuscaAtivo = '';
var modoAtualAuth = 'entrar';
var timersAtivos = {};

function validarEmail(email) {
  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
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

function configurarAuth() {
  var formAuth = document.getElementById('form-auth');
  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));

  if (usuarioLogado) {
    exibirDashboard(usuarioLogado);
  }

  // Botão para entrar como visitante sem necessidade de cadastro
  var btnVisitante = document.getElementById('btn-auth-visitante');
  if (btnVisitante) {
    btnVisitante.addEventListener('click', function() {
      var guestId = localStorage.getItem('votaai_guest_id');
      if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('votaai_guest_id', guestId);
      }

      var contaVisitante = {
        nome: 'Visitante',
        email: guestId + '@votaai.local',
        turma: 'Visitante'
      };

      localStorage.setItem('votaai_usuario_logado', JSON.stringify(contaVisitante));
      exibirDashboard(contaVisitante);
    });
  }

  if (formAuth) {
    formAuth.addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('auth-email').value.trim().toLowerCase();
      var senha = document.getElementById('auth-senha').value.trim();
      var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];
      var btnSubmit = document.getElementById('btn-auth-submit');

      if (!validarEmail(email)) {
        alert('Por favor, digite um e-mail válido!');
        return;
      }

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Aguarde...';
      }

      try {
        if (modoAtualAuth === 'criar') {
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

          // Se Firestore estiver disponível, verifica se o usuário já existe na nuvem
          if (db) {
            try {
              var userDoc = await db.collection('usuarios').doc(email).get();
              if (userDoc.exists) {
                alert('Este e-mail já está cadastrado no sistema!');
                return;
              }

              // Salva novo usuário no Firestore
              await db.collection('usuarios').doc(email).set({
                nome: nome,
                email: email,
                turma: turma,
                senha: senha,
                criadoEm: Date.now()
              });
            } catch (errDb) {
              console.warn("Aviso ao salvar usuário no Firestore:", errDb);
            }
          } else {
            var existe = contas.find(function(c) { return c.email === email; });
            if (existe) {
              alert('Este e-mail já está cadastrado!');
              return;
            }
          }

          var novaConta = { nome: nome, email: email, turma: turma, senha: senha };
          contas.push(novaConta);
          localStorage.setItem('votaai_contas', JSON.stringify(contas));
          localStorage.setItem('votaai_usuario_logado', JSON.stringify(novaConta));

          exibirDashboard(novaConta);
        } else {
          // Modo Entrar
          var usuarioAutenticado = null;

          // Tenta autenticar via Firestore primeiro
          if (db) {
            try {
              var userDoc = await db.collection('usuarios').doc(email).get();
              if (userDoc.exists) {
                var dadosUser = userDoc.data();
                if (dadosUser.senha === senha) {
                  usuarioAutenticado = dadosUser;
                }
              }
            } catch (errDb) {
              console.warn("Aviso ao buscar usuário no Firestore:", errDb);
            }
          }

          // Se não encontrou no Firestore ou Firestore offline, busca nas contas locais
          if (!usuarioAutenticado) {
            var contaLocal = contas.find(function(c) { return c.email === email && c.senha === senha; });
            if (contaLocal) {
              usuarioAutenticado = contaLocal;
            }
          }

          if (usuarioAutenticado) {
            localStorage.setItem('votaai_usuario_logado', JSON.stringify(usuarioAutenticado));
            exibirDashboard(usuarioAutenticado);
          } else {
            alert('E-mail ou senha incorretos!');
          }
        }
      } finally {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = (modoAtualAuth === 'criar' ? 'Criar minha conta' : 'Entrar');
        }
      }
    });
  }

  function fazerLogout() {
    localStorage.removeItem('votaai_usuario_logado');
    var dash = document.getElementById('dashboard-app');
    var auth = document.getElementById('tela-auth');
    if (dash) dash.style.display = 'none';
    if (auth) auth.style.display = 'flex';
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

function exibirDashboard(usuario) {
  var auth = document.getElementById('tela-auth');
  var dash = document.getElementById('dashboard-app');
  if (auth) auth.style.display = 'none';
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
      var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado'));
      if (usuarioLogado) {
        usuarioLogado.nome = document.getElementById('input-nome').value;
        usuarioLogado.turma = document.getElementById('input-turma').value;

        localStorage.setItem('votaai_usuario_logado', JSON.stringify(usuarioLogado));

        var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];
        var idx = contas.findIndex(function(c) { return c.email === usuarioLogado.email; });
        if (idx !== -1) {
          contas[idx] = usuarioLogado;
          localStorage.setItem('votaai_contas', JSON.stringify(contas));
        }

        // Atualiza perfil no Firestore se disponível
        if (db && usuarioLogado.email) {
          db.collection('usuarios').doc(usuarioLogado.email).set({
            nome: usuarioLogado.nome,
            turma: usuarioLogado.turma
          }, { merge: true }).catch(function(err) {
            console.warn("Aviso ao salvar perfil no Firestore:", err);
          });
        }

        exibirDashboard(usuarioLogado);
        alert('Perfil atualizado com sucesso!');
      }
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

  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado')) || {};
  var userEmail = (usuarioLogado.email || '').trim().toLowerCase();
  if (!userEmail) {
    userEmail = localStorage.getItem('votaai_guest_id') || '';
  }
  var chaveVoto = 'votaai_voted_' + userEmail;
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
      var desabilitado = (enquete.encerrada || jaVotou) ? 'disabled' : '';

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

  // Voto em tempo real
  var listaEnq = document.getElementById('lista-enquetes');
  if (listaEnq) {
    listaEnq.addEventListener('click', async function(e) {
      var btn = e.target.closest('.btn-votar');
      if (!btn || btn.disabled) return;

      var card = btn.closest('.card-enquete');
      if (!card) return;

      var idEnquete = card.dataset.id;
      var idxOpcao = parseInt(btn.dataset.opcao, 10);

      // Previne duplo clique imediato
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

  // Criação de enquete e envio em tempo real
  var formEnq = document.getElementById('form-enquete');
  if (formEnq) {
    formEnq.addEventListener('submit', async function(e) {
      e.preventDefault();
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

}