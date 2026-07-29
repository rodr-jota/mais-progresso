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
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          senha
        })
      }
    );

    const usuario = await resposta.json();

    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

    // Se o backend retornar erro
    if (!resposta.ok) {
      alert(usuario.erro);
      return;
    }

    // Salva usuário logado
    localStorage.setItem(
      "usuario",
      JSON.stringify(usuario)
    );

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
      "Não foi possível conectar ao servidor. Verifique se o backend está rodando."
    );
  }
});