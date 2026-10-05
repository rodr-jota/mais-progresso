// ── Carrossel (independente, roda sempre) ──────────────────────────
const track = document.querySelector(".slider-track");
const cards = document.querySelectorAll(".card");
let currentIndex = 0;

const ANO_ATUAL = 2026;
const DURACAO_ANIMACAO_BARRA = 1650; // 0.55s (delay) + 1.1s (transição), direto do CSS

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
let medalhasAtuais = []; // lista plana de todas as medalhas do mês carregado, com flag `extra`

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

// ── Toggle genérico: abre/fecha um conjunto de mission-cards dentro de um container ──
function configurarToggle(botaoId, containerId) {
  const botao = document.getElementById(botaoId);
  const container = document.getElementById(containerId);

  botao.addEventListener("click", () => {
    const estaAberto = botao.classList.contains("open");
    const cardsAtuais = [...container.querySelectorAll(".mission-card")];

    if (estaAberto) {
      cardsAtuais.forEach((c) => {
        c.classList.remove("show");
        c.querySelectorAll(".bar-star").forEach((estrela) =>
          estrela.classList.remove("revelada"),
        );
      });
      botao.classList.remove("open");
      return;
    }

    cardsAtuais.forEach((c) => {
      c.querySelectorAll(".bar-fill").forEach((barra) => {
        barra.style.transition = "none";
        barra.style.width = "";
      });
    });

    if (cardsAtuais[0]) void cardsAtuais[0].offsetHeight;

    cardsAtuais.forEach((c) => {
      c.querySelectorAll(".bar-fill").forEach((barra) => {
        barra.style.transition = "";
      });
      c.classList.add("show");
    });
    botao.classList.add("open");

    setTimeout(
      () => revelarEstrelasDoContainer(cardsAtuais),
      DURACAO_ANIMACAO_BARRA,
    );
  });
}

function revelarEstrelasDoContainer(cardsAtuais) {
  cardsAtuais.forEach((c) => {
    const medalhaId = Number(c.dataset.medalhaId);
    const medalha = medalhasAtuais.find((m) => m.id === medalhaId);
    if (medalha && medalha.checked) {
      c.querySelectorAll(".bar-star").forEach((estrela) =>
        estrela.classList.add("revelada"),
      );
    }
  });
}

configurarToggle("toggleLideranca", "containerLideranca");
configurarToggle("toggleTino", "containerTino");
configurarToggle("toggleExtra", "containerExtra");

// ── Carrega os dados do mês selecionado ──────────────────────────
async function carregarProgresso() {
  preencherNomeUsuario();

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const resposta = await fetch(
    `https://back-mais-progresso.onrender.com/progresso/${usuario.aluno_id}?ano=${ANO_ATUAL}&mes=${encodeURIComponent(mesSelecionado)}`,
  );

  const dados = await resposta.json();
  preencherRank(dados);
  preencherMissoes(dados);
  verificarMedalhasExtras(dados);

  // Se algum toggle já estava aberto, reabre os cards e reagenda a revelação das estrelas
  [
    { botaoId: "toggleLideranca", containerId: "containerLideranca" },
    { botaoId: "toggleTino", containerId: "containerTino" },
    { botaoId: "toggleExtra", containerId: "containerExtra" },
  ].forEach(({ botaoId, containerId }) => {
    const botao = document.getElementById(botaoId);
    if (botao.classList.contains("open")) {
      const cardsAtuais = [
        ...document
          .getElementById(containerId)
          .querySelectorAll(".mission-card"),
      ];
      cardsAtuais.forEach((c) => c.classList.add("show"));
      setTimeout(
        () => revelarEstrelasDoContainer(cardsAtuais),
        DURACAO_ANIMACAO_BARRA,
      );
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

// ── Slider de rank ──────────────────────────
function preencherRank(dados) {
  if (!dados.aluno) return;

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

  const LIMITE_ATE_MESTRE = 15;

  ranks.forEach((rank, index) => {
    const card = document.getElementById(rank);
    if (!card) return;

    const barra = card.querySelector(".prc_filled");
    const contador = card.querySelector(".contagem");
    if (!barra || !contador) return;

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

// ── Monta os cards de missão dinamicamente ──────────────────────────
function renderizarMissao(containerId, medalhas) {
  const container = document.getElementById(containerId);

  container.innerHTML = medalhas
    .map((medalha, index) => {
      const ehExtra = Boolean(medalha.extra);
      const estiloBarraOuro = ehExtra ? "; background:#FDA827" : "";

      return `
        <div class="mission-card" data-medalha-id="${medalha.id}">
          <div class="mission-left" style="margin-top: -23px">
            <h2>Missão ${index + 1}</h2>
            <div class="medal-area">
              <img class="medal-grey" src="../frontend/assets/medal1.svg" alt="Medalha cinza"
                   style="width:113px; opacity:${medalha.checked ? 0 : 1}" />
              <img class="medal-blue" src="../frontend/assets/${ehExtra ? "medal3.svg" : "medal2.svg"}" alt="Medalha conquistada"
                   style="width:113px; opacity:${medalha.checked ? 1 : 0}" />
            </div>
          </div>

          <div class="mission-divider"></div>

          <div class="mission-right">
            <div class="metric">
              <div class="metric-title">${medalha.nome}</div>
              <div class="bar">
                <div class="bar-fill" style="--target: ${medalha.checked ? "100%" : "11%"}${estiloBarraOuro}">
                  <span class="bar-value">${medalha.checked ? "Concluída" : "Pendente"}</span>
                  <span class="bar-star">★</span>
                </div>
              </div>
            </div>

            ${
              medalha.descricao_meta
                ? `
            <div class="metric">
              <div class="metric-title"></div>
              <div class="bar">
                <div class="bar-fill" style="--target: 100%${estiloBarraOuro}">
                  <span class="bar-value" style="display:flex; align-items:center; gap:16px;">
                    <img src="../frontend/assets/Group 343.svg" width="31px" style="margin-left:-24px;" alt="" />
                    ${medalha.descricao_meta}
                  </span>
                </div>
              </div>
            </div>`
                : ""
            }
          </div>
        </div>`;
    })
    .join("");
}

function preencherMissoes(dados) {
  const missoes = dados.missoes || [];
  const missaoLideranca = missoes.find((m) => m.titulo === "Liderança");
  const missaoExtra = missoes.find((m) => m.titulo === "Extra");
  const missaoMeio = missoes.find(
    (m) => m.titulo !== "Liderança" && m.titulo !== "Extra",
  );

  medalhasAtuais = missoes.flatMap((m) =>
    m.medalhas.map((med) => ({ ...med, extra: m.titulo === "Extra" })),
  );

  renderizarMissao(
    "containerLideranca",
    (missaoLideranca ? missaoLideranca.medalhas : []).map((m) => ({
      ...m,
      extra: false,
    })),
  );

  const botaoMeio = document.getElementById("toggleTino");
  const containerMeio = document.getElementById("containerTino");
  if (missaoMeio && missaoMeio.medalhas.length > 0) {
    botaoMeio.textContent = missaoMeio.titulo; // nome real da categoria daquele mês
    botaoMeio.style.display = "";
    renderizarMissao(
      "containerTino",
      missaoMeio.medalhas.map((m) => ({ ...m, extra: false })),
    );
  } else {
    botaoMeio.classList.remove("open");
    botaoMeio.style.display = "none";
    containerMeio.innerHTML = "";
  }

  const botaoExtra = document.getElementById("toggleExtra");
  const containerExtra = document.getElementById("containerExtra");
  if (missaoExtra && missaoExtra.medalhas.length > 0) {
    botaoExtra.style.display = "";
    renderizarMissao(
      "containerExtra",
      missaoExtra.medalhas.map((m) => ({ ...m, extra: true })),
    );
  } else {
    botaoExtra.classList.remove("open");
    botaoExtra.style.display = "none";
    containerExtra.innerHTML = "";
  }
}

// ── Resgate da medalha extra ──────────────────────────
const btnResgate = document.getElementById("right");
const popBack = document.getElementById("pop-up-background");
const pop = document.getElementById("pop-up");

btnResgate.addEventListener("click", function () {
  popBack.style.display = "flex";
});

popBack.addEventListener("click", function () {
  popBack.style.display = "none";
});

pop.addEventListener("click", function (event) {
  event.stopPropagation();
});

document.getElementById("nao").addEventListener("click", function () {
  popBack.style.display = "none";
});

document.getElementById("sim").addEventListener("click", async function () {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const medalhaExtra = medalhasAtuais.find(
    (m) => m.extra && m.checked && !m.resgatada,
  );

  if (!medalhaExtra) {
    alert("Nenhuma medalha extra disponível para resgate.");
    popBack.style.display = "none";
    return;
  }

  const resposta = await fetch(
    "https://back-mais-progresso.onrender.com/usar-medalha-extra",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        alunoId: usuario.aluno_id,
        medalhaId: medalhaExtra.id,
      }),
    },
  );

  const dados = await resposta.json();

  if (resposta.ok) {
    alert(
      "Medalha usada com sucesso! Total de medalhas: " + dados.qtd_medalhas,
    );
    popBack.style.display = "none";
    carregarProgresso();
  } else {
    alert("Erro: " + dados.erro);
  }
});

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
    document.querySelector("#titulo h1 strong").textContent = usuario.nome;
  }
}
