// js/eventos.js - Lógica Principal, Navegação e Performance
var categoriaAtiva = 'todas';
var textoBuscaAtivo = '';
var modoAtualAuth = 'entrar';

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
    if (subtitulo) subtitulo.textContent = 'Use seu perfil para participar das enquetes da turma.';
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

  if (formAuth) {
    formAuth.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('auth-email').value.trim();
      var senha = document.getElementById('auth-senha').value.trim();
      var contas = JSON.parse(localStorage.getItem('votaai_contas')) || [];

      if (!validarEmail(email)) {
        alert('Por favor, digite um e-mail valido!');
        return;
      }

      if (modoAtualAuth === 'criar') {
        var nome = document.getElementById('auth-nome').value.trim();
        var turma = document.getElementById('auth-turma').value.trim();
        var confirma = document.getElementById('auth-confirma-senha').value.trim();

        if (!nome || !email || !senha || !confirma) {
          alert('Preencha todos os campos!');
          return;
        }

        if (senha !== confirma) {
          alert('As senhas nao coincidem!');
          return;
        }

        var existe = contas.find(function(c) { return c.email === email; });
        if (existe) {
          alert('Este e-mail ja esta cadastrado!');
          return;
        }

        var novaConta = { nome: nome, email: email, turma: turma, senha: senha };
        contas.push(novaConta);
        localStorage.setItem('votaai_contas', JSON.stringify(contas));
        localStorage.setItem('votaai_usuario_logado', JSON.stringify(novaConta));

        exibirDashboard(novaConta);
      } else {
        var contaEncontrada = contas.find(function(c) { return c.email === email && c.senha === senha; });
        if (contaEncontrada) {
          localStorage.setItem('votaai_usuario_logado', JSON.stringify(contaEncontrada));
          exibirDashboard(contaEncontrada);
        } else {
          alert('E-mail ou senha incorretos!');
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
  if (elName) elName.textContent = usuario.nome;
  if (elEmail) elEmail.textContent = usuario.email;

  var iniciais = usuario.nome ? usuario.nome.substring(0, 2).toUpperCase() : 'EU';
  var avatar = document.getElementById('user-avatar');
  var mobAvatar = document.getElementById('mobile-user-initials');
  if (avatar) avatar.textContent = iniciais;
  if (mobAvatar) mobAvatar.textContent = iniciais;

  var inNome = document.getElementById('input-nome');
  var inEmail = document.getElementById('input-email');
  var inTurma = document.getElementById('input-turma');
  if (inNome) inNome.value = usuario.nome;
  if (inEmail) inEmail.value = usuario.email;
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
    e.opcoes.forEach(function(op) {
      totalVotos += op.votos;
      if (votosPorCat[e.categoria] !== undefined) votosPorCat[e.categoria] += op.votos;
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
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">' +
      '<h3>Nenhuma enquete encontrada</h3>' +
      '<p style="font-size:0.85rem; margin-top:6px;">Clique no botão "+ Nova Enquete" acima para criar a primeira enquete da turma!</p>' +
    '</div>';
    return;
  }

  var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado')) || {};
  var chaveVoto = 'votaai_voted_' + (usuarioLogado.email || 'guest');
  var enquetesVotadas = JSON.parse(localStorage.getItem(chaveVoto)) || [];

  lista.forEach(function(enquete) {
    var totalVotos = 0;
    enquete.opcoes.forEach(function(op) { totalVotos += op.votos; });

    var jaVotou = enquetesVotadas.includes(enquete.id);
    var statusTexto = enquete.encerrada ? 'Encerrada' : (jaVotou ? 'Voto Registrado' : enquete.tempoRestante + 's');

    var htmlCard =
      '<div class="card-enquete" data-id="' + enquete.id + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<span style="font-size:0.75rem;background:#e2e8f0;padding:2px 8px;border-radius:4px;color:#334155;">' + enquete.categoria + '</span>' +
          '<span class="tempo-restante" style="font-size:0.8rem;color:#64748b;">' + statusTexto + '</span>' +
        '</div>' +
        '<h3 style="margin:10px 0;font-size:1rem;">' + enquete.pergunta + '</h3>' +
        '<div class="opcoes-container">';

    enquete.opcoes.forEach(function(opcao, index) {
      var pct = totalVotos > 0 ? Math.round((opcao.votos / totalVotos) * 100) : 0;
      var desabilitado = (enquete.encerrada || jaVotou) ? 'disabled' : '';

      htmlCard +=
        '<div style="margin-bottom:8px;">' +
          '<button class="btn-votar" data-opcao="' + index + '" ' + desabilitado + ' style="width:100%;text-align:left;padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">' +
            '<span>' + opcao.texto + '</span>' +
            '<span style="font-size:0.8rem;color:#64748b;">' + pct + '% (' + opcao.votos + 'v)</span>' +
          '</button>' +
          '<div style="background:#e2e8f0;border-radius:4px;height:6px;overflow:hidden;margin-top:4px;">' +
            '<div style="width:' + pct + '%;background:#2563eb;height:100%;"></div>' +
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
      aplicarFiltros();
    });
  });

  var listaEnq = document.getElementById('lista-enquetes');
  if (listaEnq) {
    listaEnq.addEventListener('click', function(e) {
      var btn = e.target.closest('.btn-votar');
      if (!btn || btn.disabled) return;

      var card = btn.closest('.card-enquete');
      var idEnquete = parseInt(card.dataset.id, 10);
      var idxOpcao = parseInt(btn.dataset.opcao, 10);

      var usuarioLogado = JSON.parse(localStorage.getItem('votaai_usuario_logado')) || {};
      var chaveVoto = 'votaai_voted_' + (usuarioLogado.email || 'guest');
      var enquetesVotadas = JSON.parse(localStorage.getItem(chaveVoto)) || [];

      if (enquetesVotadas.includes(idEnquete)) return;

      var enquete = enquetes.find(function(item) { return item.id === idEnquete; });
      if (enquete && !enquete.encerrada) {
        enquete.opcoes[idxOpcao].votos += 1;
        salvarEnquetes();

        enquetesVotadas.push(idEnquete);
        localStorage.setItem(chaveVoto, JSON.stringify(enquetesVotadas));

        aplicarFiltros();
        atualizarTelaResultados();
      }
    });
  }

  var btnAddOpcao = document.getElementById('btn-add-opcao');
  if (btnAddOpcao) {
    btnAddOpcao.addEventListener('click', function() {
      var container = document.getElementById('container-opcoes');
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'opcao-input';
      input.placeholder = 'Nova Opcao';
      input.style.marginBottom = '8px';
      container.appendChild(input);
    });
  }

  var formEnq = document.getElementById('form-enquete');
  if (formEnq) {
    formEnq.addEventListener('submit', function(e) {
      e.preventDefault();
      var pergunta = document.getElementById('pergunta').value.trim();
      var categoria = document.getElementById('categoria').value;
      var duracao = parseInt(document.getElementById('duracao').value, 10);

      var opcoes = [];
      document.querySelectorAll('.opcao-input').forEach(function(inp) {
        if (inp.value.trim() !== '') opcoes.push(inp.value.trim());
      });

      if (pergunta.length < 5 || opcoes.length < 2) {
        alert('Preencha a pergunta e pelo menos 2 alternativas.');
        return;
      }

      var nova = criarNovaEnquete(pergunta, opcoes, categoria, duracao);
      iniciarTimerEnquete(nova);
      aplicarFiltros();
      atualizarTelaResultados();

      this.reset();
      document.getElementById('modal-enquete').style.display = 'none';
    });
  }
}

function iniciarTemporizadores() {
  enquetes.forEach(function(enquete) {
    iniciarTimerEnquete(enquete);
  });
}

function iniciarTimerEnquete(enquete) {
  if (enquete.encerrada) return;
  if (enquete.intervalId) clearInterval(enquete.intervalId);

  enquete.intervalId = setInterval(function() {
    enquete.tempoRestante -= 1;
    var card = document.querySelector('.card-enquete[data-id="' + enquete.id + '"]');

    if (card) {
      var pTempo = card.querySelector('.tempo-restante');
      if (pTempo && !pTempo.textContent.includes('Voto')) {
        pTempo.textContent = enquete.tempoRestante + 's';
      }
    }

    if (enquete.tempoRestante <= 0) {
      clearInterval(enquete.intervalId);
      enquete.encerrada = true;
      salvarEnquetes();
      aplicarFiltros();
      atualizarTelaResultados();
    }
  }, 1000);
}