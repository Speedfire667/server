<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>Painel de Controle do Servidor</title>
<style>
  body {
    font-family: Arial, sans-serif;
    background: #1e1e2f;
    color: #f0f0f0;
    text-align: center;
    padding: 40px;
  }
  h1 {
    color: #6ab04c;
  }
  button {
    font-size: 16px;
    margin: 8px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    color: white;
    transition: background 0.3s;
  }
  button:hover {
    background: #444;
  }
  #btn-iniciar { background: #27ae60; }
  #btn-parar { background: #c0392b; }
  #btn-reiniciar { background: #f39c12; }
  #btn-ip { background: #2980b9; }
  #btn-jogadores { background: #9b59b6; }
  #btn-console { background: #34495e; }
  #status, #ip, #players, #console {
    margin-top: 20px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    background: #222233;
    border-radius: 10px;
    padding: 15px;
    text-align: left;
    white-space: pre-wrap;
    overflow-y: auto;
    max-height: 250px;
  }
</style>
</head>
<body>

<h1>Painel de Controle do Servidor</h1>

<!-- Botões -->
<button id="btn-iniciar">Iniciar Servidor</button>
<button id="btn-parar">Parar Servidor</button>
<button id="btn-reiniciar">Reiniciar Servidor</button>
<button id="btn-status">Ver Status</button>
<button id="btn-ip">Ver IP</button>
<button id="btn-jogadores">Ver Jogadores</button>
<button id="btn-console">Ver Console</button>

<!-- Áreas de resultado -->
<div id="status"></div>
<div id="ip"></div>
<div id="players"></div>
<div id="console"></div>

<script>
// URL fixa do backend (corrigido sem barra no final)
const backendURL = "https://server-3-6by0.onrender.com";

// Helper para fetch com tratamento simples de erros
async function fetchJSON(endpoint, options) {
  try {
    const res = await fetch(backendURL + endpoint, options);
    if (!res.ok) throw new Error(`Erro ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    alert('Erro na requisição: ' + err.message);
    throw err;
  }
}

// Botões
document.getElementById('btn-iniciar').onclick = async () => {
  const res = await fetchJSON('/iniciar', { method: 'POST' });
  alert(res.message);
};

document.getElementById('btn-parar').onclick = async () => {
  const res = await fetchJSON('/parar', { method: 'POST' });
  alert(res.message);
};

document.getElementById('btn-reiniciar').onclick = async () => {
  const res = await fetchJSON('/reiniciar', { method: 'POST' });
  alert(res.message);
};

document.getElementById('btn-status').onclick = async () => {
  const res = await fetchJSON('/status');
  document.getElementById('status').textContent = "Status do servidor: " + res.status;
};

document.getElementById('btn-ip').onclick = async () => {
  const res = await fetchJSON('/ip');
  document.getElementById('ip').textContent = "IP do servidor: " + res.ip;
};

document.getElementById('btn-jogadores').onclick = async () => {
  const res = await fetchJSON('/players');
  if (res.jogadores.length === 0) {
    document.getElementById('players').textContent = "Nenhum jogador online.";
  } else {
    document.getElementById('players').textContent = "Jogadores online:\n" + res.jogadores.join('\n');
  }
};

document.getElementById('btn-console').onclick = async () => {
  const res = await fetchJSON('/console');
  document.getElementById('console').textContent = res.logs.length ? res.logs.join('\n') : "Console vazio.";
};
</script>

</body>
</html>
