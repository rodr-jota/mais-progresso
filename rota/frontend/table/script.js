function ativarColagem() {
  const rows = [...document.querySelectorAll("tbody tr")];

  rows.forEach((row, rowIndex) => {
    const textInputs = [...row.querySelectorAll("td:not(.df) input")];

    textInputs.forEach((input, colIndex) => {
      input.addEventListener("paste", (e) => {
        e.preventDefault();

        const clipboard = e.clipboardData || window.clipboardData;

        const text = clipboard.getData("text");

        const values = text
          .replace(/\r/g, "")
          .split("\n")
          .map((v) => v.trim())
          .filter((v) => v !== "");

        values.forEach((value, i) => {
          const targetRow = rows[rowIndex + i];

          if (!targetRow) return;

          const targetInputs = [
            ...targetRow.querySelectorAll("td:not(.df) input"),
          ];

          const targetInput = targetInputs[colIndex];

          if (targetInput) {
            targetInput.value = value;
          }
        });
      });
    });
  });
}

function obterUsuarioAtual() {
  try {
    const valor = localStorage.getItem("usuario");
    if (!valor) return null;

    const usuario = JSON.parse(valor);
    return usuario && typeof usuario === "object" ? usuario : null;
  } catch (erro) {
    console.error("Erro ao ler usuário do localStorage:", erro);
    return null;
  }
}

function obterChaveRascunho(alunoId, indexInput) {
  const chaveBase = `rascunho_${coordenadorIdAtual || "sem-coordenador"}_${mesAtual || "sem-mes"}`;
  return `${chaveBase}_${alunoId}_${indexInput}`;
}

// ── Função para salvar automaticamente os inputs no localStorage ──
function salvarRascunhoLocal() {
  const linhas = document.querySelectorAll("#tabela-alunos tr");

  linhas.forEach((linha, indexLinha) => {
    const alunoId = linha.dataset.id;
    if (!alunoId) return;

    const inputs = linha.querySelectorAll("input");
    inputs.forEach((input, indexInput) => {
      const chave = obterChaveRascunho(alunoId, indexInput);

      // Salva o valor no localStorage sempre que o usuário digitar
      input.addEventListener("input", () => {
        if (input.type === "checkbox") {
          localStorage.setItem(chave, input.checked ? "true" : "false");
        } else {
          localStorage.setItem(chave, input.value);
        }
      });
    });
  });
}
// ── Função para recuperar os dados do localStorage ao carregar a página ──
function recuperarRascunhoLocal() {
  const linhas = document.querySelectorAll("#tabela-alunos tr");

  linhas.forEach((linha) => {
    const alunoId = linha.dataset.id;
    if (!alunoId) return;

    const inputs = linha.querySelectorAll("input");
    inputs.forEach((input, indexInput) => {
      const chave = obterChaveRascunho(alunoId, indexInput);
      const valorSalvo = localStorage.getItem(chave);

      if (valorSalvo !== null) {
        if (input.type === "checkbox") {
          input.checked = valorSalvo === "true";
        } else {
          input.value = valorSalvo;
        }
      }
    });
  });
}

let mesAtual = null;
let coordenadorIdAtual = null;
let mesFechado = false;

function getApiBaseUrl() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "https://back-mais-progresso.onrender.com";
  }
  return "https://back-mais-progresso.onrender.com";
}

document.addEventListener("DOMContentLoaded", async () => {
  await carregarMesAtual();
  carregarAlunos();
});

async function carregarMesAtual() {
  const urlParams = new URLSearchParams(window.location.search);
  const usuario = obterUsuarioAtual();
  const coordenadorIdDaUrl = urlParams.get("coordenadorId");

  const coordenadorId = usuario?.id || coordenadorIdDaUrl;
  if (!coordenadorId) {
    const tituloMes = document.getElementById("mes");
    if (tituloMes) {
      tituloMes.textContent = "Usuário não identificado";
    }
    return;
  }

  coordenadorIdAtual = Number(coordenadorId);

  const mesDaUrl = urlParams.get("mes");

  if (mesDaUrl) {
    mesAtual = mesDaUrl;
  } else {
    const resposta = await fetch(
      `https://back-mais-progresso.onrender.com/coordenador/meses/${coordenadorIdAtual}`,
    );
    const status = await resposta.json();
    mesAtual = status.mes_lancavel;
  }

  const tituloMes = document.getElementById("mes");
  if (tituloMes) {
    tituloMes.textContent = mesAtual || "Todos os meses já lançados";
  }

  if (!mesAtual) {
    const btnSalvar = document.getElementById("btn-save");
    if (btnSalvar) btnSalvar.disabled = true;
  }

  await verificarStatusMes();
}

async function verificarStatusMes() {
  if (!coordenadorIdAtual || !mesAtual) return;

  try {
    const resposta = await fetch(
      `https://back-mais-progresso.onrender.com/coordenador/status-mes/${coordenadorIdAtual}?mes=${encodeURIComponent(mesAtual)}`,
    );

    if (!resposta.ok) return;

    const dados = await resposta.json();
    mesFechado = Boolean(dados.realizado);

    const btnSalvar = document.getElementById("btn-save");
    if (btnSalvar) {
      btnSalvar.style.display = mesFechado ? "none" : "block";
    }
  } catch (erro) {
    console.error("Erro ao verificar status do mês:", erro);
  }
}

async function carregarDadosDoMes() {
  if (!coordenadorIdAtual || !mesAtual) return;

  try {
    const resposta = await fetch(
      `https://back-mais-progresso.onrender.com/coordenador/resultados/${coordenadorIdAtual}?mes=${encodeURIComponent(mesAtual)}`,
    );
    if (!resposta.ok) return;

    const dados = await resposta.json();
    const linhas = document.querySelectorAll("#tabela-alunos tr");

    linhas.forEach((linha) => {
      const alunoId = Number(linha.dataset.id);
      const registro = dados.find((item) => Number(item.aluno_id) === alunoId);

      if (!registro) return;

      const inputs = linha.querySelectorAll("input");

      if (inputs[0]) inputs[0].value = registro.checkin ?? "";
      if (inputs[1]) inputs[1].value = registro.tma ?? "";
      if (inputs[2]) inputs[2].value = registro.interacao_matinal ?? "";
      if (inputs[3]) inputs[3].value = registro.checkin_8 ?? "";
      if (inputs[4]) inputs[4].checked = Boolean(registro.analise_dados);
      if (inputs[5]) inputs[5].checked = Boolean(registro.olhar_estrategico);
      if (inputs[6]) inputs[6].checked = Boolean(registro.analise_carteira);
    });
  } catch (erro) {
    console.error("Erro ao carregar dados do mês:", erro);
  }
}

async function carregarAlunos() {
  if (!coordenadorIdAtual) {
    const tituloMes = document.getElementById("mes");
    if (tituloMes) {
      tituloMes.textContent = "Usuário não identificado";
    }
    return;
  }

  const resposta = await fetch(
    `https://back-mais-progresso.onrender.com/coordenador/alunos/${coordenadorIdAtual}`,
  );

  const alunos = await resposta.json();

  const tbody = document.getElementById("tabela-alunos");

  tbody.innerHTML = "";

  alunos.forEach((aluno) => {
    tbody.innerHTML += `
      <tr data-id="${aluno.id}">
        <td class="aluno">${aluno.nome}</td>

        <td><input></td>
        <td><input></td>
        <td><input></td>
        <td><input></td>

        <td class="df">
          <input class="checkzin" type="checkbox">
        </td>

        <td class="df">
          <input class="checkzin" type="checkbox">
        </td>

        <td class="df">
          <input class="checkzin extra" type="checkbox">
        </td>
      </tr>
    `;
  });

  // IMPORTANTE
  ativarColagem();

  salvarRascunhoLocal();
  await carregarDadosDoMes();
  recuperarRascunhoLocal();
}

const btnSalvar = document.getElementById("btn-save");
btnSalvar.addEventListener("click", async () => {
  try {
    if (!mesAtual) {
      alert("Todos os meses já foram lançados.");
      return;
    }

    const dados = [];
    const linhas = document.querySelectorAll("tbody tr");

    linhas.forEach((linha) => {
      const alunoId = linha.dataset.id;
      const inputs = linha.querySelectorAll("input");

      if (inputs.length > 0) {
        dados.push({
          aluno_id: alunoId,
          checkin: inputs[0].value,
          tma: inputs[1].value.replace(",", "."),
          interacao_matinal: inputs[2].value,
          checkin_8: inputs[3].value,
          analise_dados: inputs[4].checked,
          olhar_estrategico: inputs[5].checked,
          analise_carteira: inputs[6].checked,
        });
      }
    });

    const resposta = await fetch(
      `https://back-mais-progresso.onrender.com/resultados`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordenadorId: coordenadorIdAtual,
          mes: mesAtual,
          dados,
        }),
      },
    );

    const resultado = await resposta.json();

    if (resposta.ok) {
      alert("Dados salvos com sucesso!");
      window.location.href = `/rota/dash_cod/dash_cod.html?mes=${encodeURIComponent(mesAtual)}`;
    } else {
      alert("Erro ao salvar: " + (resultado.erro || "Erro desconhecido"));
    }
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
    alert("Erro ao conectar com o servidor.");
  }
});
