// ── Carrossel (independente, roda sempre) ──────────────────────────
const track = document.querySelector(".slider-track");
const cards = document.querySelectorAll(".card");
let currentIndex = 0;

const mapaMeses = {
  ABR: "Abril",
  MAI: "Maio",
  JUN: "Junho",
  AGO: "Agosto",
  SET: "Setembro",
  OUT: "Outubro",
  NOV: "Novembro",
};
let mesSelecionado = "Abril";

function updateSlider() {
  const cardWidth = cards[0].getBoundingClientRect().width;
  track.style.transform = `translateX(-${currentIndex * (cardWidth + 20)}px)`;
}

document.querySelectorAll(".btn-next").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      updateSlider();
    }
  });
});

document.querySelectorAll(".btn-prev").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateSlider();
    }
  });
});

const btn = document.getElementById("toggleLideranca");
const card = document.getElementById("missionCard");

const card2 = document.getElementById("missionCard2");

const btn_2 = document.getElementById("toggleTino");
const card_2 = document.getElementById("missionCard_2");

const card2_2 = document.getElementById("missionCard2_2");

const btn_3 = document.getElementById("toggleExtra");

const card_3 = document.getElementById("missionCard_3");

function toggleMissionCards(btn, cards, idsEstrelas = []) {
  const estaAberto = btn.classList.contains("open");

  if (estaAberto) {
    cards.forEach((c) => c.classList.remove("show"));
    idsEstrelas.forEach((id) => {
      const estrela = document.getElementById(id);
      if (estrela) estrela.classList.remove("revelada");
    });
    btn.classList.remove("open");
    return;
  }

  cards.forEach((c) => {
    c.querySelectorAll(".bar-fill").forEach((barra) => {
      barra.style.transition = "none";
      barra.style.width = "";
    });
  });

  void cards[0].offsetHeight;

  cards.forEach((c) => {
    c.querySelectorAll(".bar-fill").forEach((barra) => {
      barra.style.transition = "";
    });
    c.classList.add("show");
  });
  btn.classList.add("open");

  setTimeout(() => revelarEstrelas(idsEstrelas), DURACAO_ANIMACAO_BARRA);
}

btn.addEventListener("click", () =>
  toggleMissionCards(
    btn,
    [card, card2],
    ["star-check-in", "star-tma", "star-matinal", "star-checkin_8"],
  ),
);
btn_2.addEventListener("click", () =>
  toggleMissionCards(btn_2, [card_2, card2_2], ["star-analise", "star-olhar"]),
);
btn_3.addEventListener("click", () => toggleMissionCards(btn_3, [card_3], []));

async function carregarProgresso() {
  preencherNomeUsuario();

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const resposta = await fetch(
    `https://back-mais-progresso.onrender.com/progresso/${usuario.aluno_id}?mes=${encodeURIComponent(mesSelecionado)}`,
  );

  const dados = await resposta.json();
  preencherRank(dados);
  preencherMissoes(dados);
  verificarMedalhasExtras(dados);

  // Se algum toggle já estava aberto, reagenda a revelação das estrelas dele
  [
    {
      botao: btn,
      estrelas: ["star-check-in", "star-tma", "star-matinal", "star-checkin_8"],
    },
    { botao: btn_2, estrelas: ["star-analise", "star-olhar"] },
  ].forEach(({ botao, estrelas }) => {
    estrelas.forEach((id) => {
      const estrela = document.getElementById(id);
      if (estrela) estrela.style.display = "block";
    });
    if (botao.classList.contains("open")) {
      setTimeout(() => revelarEstrelas(estrelas), DURACAO_ANIMACAO_BARRA);
    }
  });
}

function configurarFiltroMes() {
  const botoes = document.querySelectorAll("#meses li");

  botoes.forEach((botao) => {
    botao.addEventListener("click", function () {
      if (this.classList.contains("bloqueado")) return;

      botoes.forEach((b) => b.removeAttribute("id"));
      this.id = "this";

      const sigla = this.textContent.trim().toUpperCase();
      mesSelecionado = mapaMeses[sigla] || sigla;
      carregarProgresso();
    });
  });
}

async function aplicarBloqueioMesesAluno() {
  try {
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const resposta = await fetch(
      `https://back-mais-progresso.onrender.com/aluno/meses/${usuario.aluno_id}`,
    );
    const status = await resposta.json();
    const bloqueados = status.meses_bloqueados || [];

    document.querySelectorAll("#meses li").forEach((li) => {
      const sigla = li.textContent.trim().toUpperCase();
      const nomeCompleto = mapaMeses[sigla] || sigla;

      if (bloqueados.includes(nomeCompleto)) {
        li.classList.add("bloqueado");
      } else {
        li.classList.remove("bloqueado");
      }
    });
  } catch (erro) {
    console.error("Erro ao aplicar bloqueio de meses do aluno:", erro);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  configurarFiltroMes();
  aplicarBloqueioMesesAluno();
  carregarProgresso();
});
function preencherRank(dados) {
  const ranks = [
    "bronze",
    "prata",
    "ouro",
    "platina",
    "diamante",
    "mestre",
    "lendario",
  ];

  const rankAtual = dados.aluno.rank_atual.toLowerCase();
  const medalhas = dados.aluno.qtd_medalhas;
  const indiceRank = ranks.indexOf(rankAtual);

  currentIndex = indiceRank;
  updateSlider();

  const LIMITE_ATE_MESTRE = 15; // 3 × 5 ranks antes do Mestre

  ranks.forEach((rank, index) => {
    const card = document.getElementById(rank);
    if (!card) return;

    const barra = card.querySelector(".prc_filled");
    const contador = card.querySelector(".contagem");
    if (!barra || !contador) return;

    // Mestre (índice 5) exige 5 medalhas; os outros exigem 3
    const tamanhoDesteRank = index === 5 ? 5 : 3;

    if (index < indiceRank) {
      barra.style.width = "100%";
      contador.textContent = `${tamanhoDesteRank}/${tamanhoDesteRank}`;
    } else if (index === indiceRank) {
      const medalhasNoRank =
        index === 5 ? medalhas - LIMITE_ATE_MESTRE : medalhas - index * 3;

      const porcentagem = (medalhasNoRank / tamanhoDesteRank) * 100;
      barra.style.width = porcentagem < 11 ? "11%" : `${porcentagem}%`;
      contador.textContent = `${medalhasNoRank}/${tamanhoDesteRank}`;
    } else {
      barra.style.width = "11%";
      contador.textContent = `0/${tamanhoDesteRank}`;
    }
  });
}
const DURACAO_ANIMACAO_BARRA = 1650; // 0.55s (delay) + 1.1s (transição), direto do CSS
let criteriosMissoes = {};

function revelarEstrelas(idsEstrelas) {
  idsEstrelas.forEach((id) => {
    const estrela = document.getElementById(id);
    if (estrela && criteriosMissoes[id]) {
      estrela.classList.add("revelada");
    }
  });
}

function horaParaMinutos(horaTexto) {
  if (!horaTexto) return null;
  const [h, m] = String(horaTexto).split(":").map(Number);
  return h * 60 + (m || 0);
}

function preencherMissoes(dados) {
  document.getElementById("star-check-in").classList.remove("revelada");
  document.getElementById("star-tma").classList.remove("revelada");
  document.getElementById("star-matinal").classList.remove("revelada");
  document.getElementById("star-checkin_8").classList.remove("revelada");
  document.getElementById("star-analise").classList.remove("revelada");
  document.getElementById("star-olhar").classList.remove("revelada");
  if (!dados.resultados || !dados.progresso) {
    // CORREÇÃO TALVEZ DESNECESSÁRIA
    console.log(
      "Dados de progresso/resultado não encontrados. Missões não disponíveis.",
    );

    // Como as missões não podem ser renderizadas, garantimos que as medalhas fiquem cinzas.
    // (Se o card não existir, o código ignora silenciosamente)
    const cards = [
      "missionCard",
      "missionCard2",
      "missionCard_2",
      "missionCard2_2",
      "missionCard_3",
    ];
    cards.forEach((id) => {
      const card = document.getElementById(id);
      if (card) {
        const cinza = card.querySelector(".medal-grey");
        const azul = card.querySelector(".medal-blue");
        if (cinza) cinza.style.opacity = "1";
        if (azul) azul.style.opacity = "0";
      }
    });

    return;
  }

  console.log("CHECKIN:", dados.resultados.checkin);
  console.log("TMA:", dados.resultados.tma);
  console.log("MATINAL:", dados.resultados.interacao_matinal);
  console.log("CHECKIN8:", dados.resultados.checkin_8);
  console.log("TINO1:", dados.progresso.tino1);
  console.log("TINO2:", dados.progresso.tino2);
  // console.log("EXTRA:", dados.progresso.medalhas_extra_ganhas);

  const checkin = parseFloat(dados.resultados.checkin.replace("%", ""));
  const checkinOk = checkin >= 90;
  criteriosMissoes["star-check-in"] = checkinOk;
  document.getElementById("bar-checkin").innerHTML = checkin + "%";

  const tma = parseFloat(dados.resultados.tma);
  const tmaOk = tma >= 3.5;
  criteriosMissoes["star-tma"] = tmaOk;
  document.getElementById("bar-tma").innerHTML =
    `0${Math.floor(tma)}:${String(Math.round((tma - Math.floor(tma)) * 60)).padStart(2, "0")}`;
  const matinal = Number(dados.resultados.interacao_matinal);
  const matinalOk = matinal >= 1;
  criteriosMissoes["star-matinal"] = matinalOk;
  document.getElementById("bar-matinal").innerHTML = `${matinal}/1`;

  const checkin8 = dados.resultados.checkin_8;
  const LIMITE_CHECKIN8 = 8 * 60 + 5;
  const checkin8Ok = horaParaMinutos(checkin8) <= LIMITE_CHECKIN8;
  criteriosMissoes["star-checkin_8"] = checkin8Ok;
  document.getElementById("valor-checkin8").innerHTML = `${checkin8}`;

  // checkin tem escala 0-100 natural; os outros três são critérios sim/não,
  // então a barra preenche 100% quando a estrela daquele critério é conquistada
  document
    .getElementById("fill-checkin")
    .style.setProperty("--target", checkinOk ? "100%" : `${checkin}%`);
  document
    .getElementById("fill-tma")
    .style.setProperty("--target", tmaOk ? "100%" : "11%");
  document
    .getElementById("fill-matinal")
    .style.setProperty("--target", matinalOk ? "100%" : "11%");
  document
    .getElementById("fill-checkin_8")
    .style.setProperty("--target", checkin8Ok ? "100%" : "11%");

  document.getElementById("bar-analise").innerHTML = dados.progresso.tino1
    ? "1/1"
    : "0/1";
  criteriosMissoes["star-analise"] = !!dados.progresso.tino1;
  document
    .getElementById("preench-de-dados1")
    .style.setProperty("--target", dados.progresso.tino1 ? "100%" : "9%");

  document.getElementById("bar-olhar").innerHTML = dados.progresso.tino2
    ? "1/1"
    : "0/1";
  criteriosMissoes["star-olhar"] = !!dados.progresso.tino2;
  document
    .getElementById("preench-da-carteira")
    .style.setProperty("--target", dados.progresso.tino2 ? "100%" : "9%");

  document.getElementById("value-extra").innerHTML = dados.progresso.extra1
    ? "1/1"
    : "0/1";
  document
    .getElementById("preench-extra")
    .style.setProperty("--target", dados.progresso.extra1 ? "100%" : "9%");

  atualizarMissao("missionCard", dados.progresso.lideranca1);
  atualizarMissao("missionCard2", dados.progresso.lideranca2);
  atualizarMissao("missionCard_2", dados.progresso.tino1);
  atualizarMissao("missionCard2_2", dados.progresso.tino2);
  atualizarMissao("missionCard_3", dados.progresso.extra1);
}

function atualizarMissao(cardId, concluida) {
  const card = document.getElementById(cardId);
  const medalhaAzul = card.querySelector(".medal-blue");
  const medalhaCinza = card.querySelector(".medal-grey");

  if (concluida) {
    medalhaAzul.style.opacity = "1";
    medalhaCinza.style.opacity = "0";
  } else {
    medalhaAzul.style.opacity = "0";
    medalhaCinza.style.opacity = "1";
  }
}

const btnResgate = document.getElementById("right");
const popBack = document.getElementById("pop-up-background");
const pop = document.getElementById("pop-up");
btnResgate.addEventListener("click", function aparecerResgate() {
  popBack.style.display = "flex";
});

popBack.addEventListener("click", function surmirResgate() {
  popBack.style.display = "none";
});

pop.addEventListener("click", function (event) {
  event.stopPropagation(); // Impede que o clique "suba" para o background
});

const popNao = document.getElementById("nao");
popNao.addEventListener("click", function () {
  popBack.style.display = "none";
});

document.getElementById("sim").addEventListener("click", async function () {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const resposta = await fetch(
    "https://back-mais-progresso.onrender.com/usar-medalha-extra",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aluno_id: usuario.aluno_id }),
    },
  );

  const dados = await resposta.json();

  if (resposta.ok) {
    alert("Medalha usada com sucesso! Saldo restante: " + dados.saldo_restante);

    // 🔽 Fecha o pop-up e recarrega os dados sem dar refresh na página inteira
    popBack.style.display = "none";
    carregarProgresso(); // Chama a função de carregar dados novamente
  } else {
    alert("Erro: " + dados.erro);
  }
});

// ── Função para calcular e exibir o saldo de medalhas extras ──
function verificarMedalhasExtras(dados) {
  const saldo = Number(dados.saldo_medalha_extra || 0);

  const clainDiv = document.getElementById("clain");
  const textoStrong = clainDiv.querySelector("#text strong");

  if (saldo <= 0) {
    clainDiv.style.display = "none";
  } else {
    clainDiv.style.display = "flex";
    textoStrong.innerHTML = `${saldo} medalha${saldo > 1 ? "s" : ""} extra`;
  }
}

function preencherNomeUsuario() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  if (usuario && usuario.nome) {
    // Procura o <strong> dentro do <h1> do seu título e troca o texto
    document.querySelector("#titulo h1 strong").textContent = usuario.nome;
  }
}
