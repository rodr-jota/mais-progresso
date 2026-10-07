let catalogoMedalhas = []; // lista plana de {id, nome, id_missao, titulo_missao}
const ANO_ATUAL = 2026;

let mesAtual = null;
let coordenadorIdAtual = null;
let mesFechado = false;

async function carregarCatalogoDoMes() {
  const resposta = await fetch(
    `https://back-mais-progresso.onrender.com/missao/${ANO_ATUAL}/${encodeURIComponent(mesAtual)}`,
  );
  if (!resposta.ok) {
    catalogoMedalhas = [];
    return;
  }
  const missoes = await resposta.json();
  catalogoMedalhas = missoes.flatMap((missao) =>
    missao.medalhas.map((m) => ({ ...m, titulo_missao: missao.titulo })),
  );

  // Atualiza os rótulos decorativos acima da tabela (Liderança / categoria do meio / Extra)
  const missaoMeio = missoes.find(
    (m) => m.titulo !== "Liderança" && m.titulo !== "Extra",
  );
  const missaoExtra = missoes.find((m) => m.titulo === "Extra");

  const tituloTino = document.getElementById("tino");
  if (missaoMeio) {
    tituloTino.textContent = missaoMeio.titulo;
    tituloTino.style.display = "";
  } else {
    tituloTino.style.display = "none";
  }

  const tituloExtra = document.getElementById("extra");
  tituloExtra.style.display = missaoExtra ? "" : "none";

  // Monta o cabeçalho da tabela dinamicamente
  const cabecalho = document.getElementById("cabecalho-tabela");
  cabecalho.innerHTML = "<th>Aluno</th>";
  catalogoMedalhas.forEach((medalha) => {
    const classeExtra =
      medalha.titulo_missao === "Extra" ? ' class="extra"' : "";
    cabecalho.innerHTML += `<th${classeExtra}>${medalha.nome}</th>`;
  });
}

async function carregarAlunos() {
  if (!coordenadorIdAtual) return;

  await carregarCatalogoDoMes();

  const resposta = await fetch(
    `https://back-mais-progresso.onrender.com/coordenador/alunos/${coordenadorIdAtual}`,
  );
  const alunos = await resposta.json();
  const tbody = document.getElementById("tabela-alunos");
  tbody.innerHTML = "";

  alunos.forEach((aluno) => {
    const checkboxes = catalogoMedalhas
      .map((medalha) => {
        const classeExtra = medalha.titulo_missao === "Extra" ? " extra" : "";
        return `<td class="df"><input class="checkzin${classeExtra}" type="checkbox" data-medalha-id="${medalha.id}"></td>`;
      })
      .join("");

    tbody.innerHTML += `
      <tr data-id="${aluno.id}">
        <td class="aluno">${aluno.nome}</td>
        ${checkboxes}
      </tr>
    `;
  });

  ativarColagem();
  salvarRascunhoLocal();
  await carregarDadosDoMes();
  recuperarRascunhoLocal();
}

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

function obterChaveRascunho(alunoId, medalhaId) {
  const chaveBase = `rascunho_${coordenadorIdAtual || "sem-coordenador"}_${mesAtual || "sem-mes"}`;
  return `${chaveBase}_${alunoId}_${medalhaId}`;
}

function salvarRascunhoLocal() {
  document.querySelectorAll("#tabela-alunos tr").forEach((linha) => {
    const alunoId = linha.dataset.id;
    if (!alunoId) return;

    linha.querySelectorAll("input[data-medalha-id]").forEach((input) => {
      const chave = obterChaveRascunho(alunoId, input.dataset.medalhaId);
      input.addEventListener("input", () => {
        localStorage.setItem(chave, input.checked ? "true" : "false");
      });
    });
  });
}

function recuperarRascunhoLocal() {
  document.querySelectorAll("#tabela-alunos tr").forEach((linha) => {
    const alunoId = linha.dataset.id;
    if (!alunoId) return;

    linha.querySelectorAll("input[data-medalha-id]").forEach((input) => {
      const chave = obterChaveRascunho(alunoId, input.dataset.medalhaId);
      const valorSalvo = localStorage.getItem(chave);
      if (valorSalvo !== null) input.checked = valorSalvo === "true";
    });
  });
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
      btnSalvar.style.display = "block";
      btnSalvar.textContent = mesFechado ? "Salvar alterações" : "Salvar";
    }
  } catch (erro) {
    console.error("Erro ao verificar status do mês:", erro);
  }
}

async function carregarDadosDoMes() {
  if (!coordenadorIdAtual || !mesAtual) return;

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

    registro.medalhas.forEach(({ medalha_id, checked }) => {
      const checkbox = linha.querySelector(
        `input[data-medalha-id="${medalha_id}"]`,
      );
      if (checkbox) checkbox.checked = Boolean(checked);
    });
  });
}

const btnSalvar = document.getElementById("btn-save");
btnSalvar.addEventListener("click", async () => {
  try {
    if (!mesAtual) {
      alert("Todos os meses já foram lançados.");
      return;
    }

    const dados = [];
    document.querySelectorAll("#tabela-alunos tr").forEach((linha) => {
      const alunoId = linha.dataset.id;
      const medalhas = [
        ...linha.querySelectorAll("input[data-medalha-id]"),
      ].map((input) => ({
        medalha_id: Number(input.dataset.medalhaId),
        checked: input.checked,
      }));
      dados.push({ aluno_id: alunoId, medalhas });
    });

    const resposta = await fetch(
      "https://back-mais-progresso.onrender.com/resultados",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coordenadorId: coordenadorIdAtual,
          ano: ANO_ATUAL,
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
      alert(
        "Erro ao salvar: " +
          (resultado.erro || "Erro desconhecido") +
          "\n" +
          (resultado.detalhe || ""),
      );
    }
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
    alert("Erro ao conectar com o servidor.");
  }
});
