const form = document.getElementById("login-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const resposta = await fetch(
      "https://back-mais-progresso.onrender.com/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          senha,
        }),
      },
    );

    const usuario = await resposta.json();

    localStorage.setItem("usuario", JSON.stringify(usuario));

    // Se o backend retornar erro
    if (!resposta.ok) {
      alert(usuario.erro);
      return;
    }

    // Salva usuário logado
    localStorage.setItem("usuario", JSON.stringify(usuario));

    console.log("Login realizado:", usuario);

    // Redirecionamento
    if (usuario.perfil === "coordenador") {
      window.location.href = "rota/dash_cod/dash_cod.html";
    }

    if (usuario.perfil === "aluno") {
      window.location.href = "rota/dash_aluno/dash_aluno.html";
    }
  } catch (erro) {
    console.error("Erro ao conectar com o servidor:", erro);

    alert(
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
    );
  }
});

document.getElementById("forgot").addEventListener("click", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert(
      "Digite seu e-mail no campo de login antes de clicar em 'Esqueci minha senha'.",
    );
    return;
  }

  try {
    const resposta = await fetch(
      "https://back-mais-progresso.onrender.com/esqueci-senha",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      },
    );

    const dados = await resposta.json();

    if (resposta.ok) {
      alert("Enviamos sua senha atual para o e-mail cadastrado.");
    } else {
      alert("Erro: " + (dados.erro || "Não foi possível enviar o e-mail."));
    }
  } catch (erro) {
    console.error("Erro ao solicitar recuperação de senha:", erro);
    alert("Erro ao conectar com o servidor.");
  }
});
