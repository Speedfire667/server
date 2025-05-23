const axios = require('axios');
const express = require('express');
const https = require('https');

const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_UzFaWrwEUSMR8qYYJmvhND5X7dinnDVtSIuBirqryuo';
const SERVER_ID = 'c9593e69';
const PORT = 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

const app = express();

async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, { headers: clientHeaders });
    const allocations = res.data.attributes.relationships.allocations.data;
    const principal = allocations.find(a => a.attributes.is_default);
    if (!principal) return '❌ Nenhum IP padrão configurado.';
    return `${principal.attributes.ip}:${principal.attributes.port}`;
  } catch {
    return '❌ Erro ao obter IP!';
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, { headers: clientHeaders });
    return res.data.attributes.current_state;
  } catch {
    return 'Erro';
  }
}

async function iniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'start' }, { headers: clientHeaders });
    return '✅ Servidor iniciado!';
  } catch {
    return '❌ Erro ao iniciar servidor!';
  }
}

async function pararServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'stop' }, { headers: clientHeaders });
    return '🛑 Servidor parado!';
  } catch {
    return '❌ Erro ao parar servidor!';
  }
}

async function reiniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'restart' }, { headers: clientHeaders });
    return '🔄 Servidor reiniciado!';
  } catch {
    return '❌ Erro ao reiniciar servidor!';
  }
}

async function obterJogadores() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, { headers: clientHeaders });
    const players = res.data.attributes.resources.players;
    return players || { online: 0, list: [] };
  } catch {
    return { online: 0, list: [] };
  }
}

app.get('/status', async (req, res) => res.json({ status: await statusServidor() }));
app.post('/iniciar', async (req, res) => res.json({ message: await iniciarServidor() }));
app.post('/parar', async (req, res) => res.json({ message: await pararServidor() }));
app.post('/reiniciar', async (req, res) => res.json({ message: await reiniciarServidor() }));
app.get('/ip', async (req, res) => res.json({ ip: await obterIpDoServidor() }));
app.get('/jogadores', async (req, res) => res.json(await obterJogadores()));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Painel de Controle</title>
      <style>
        body { font-family: Arial; background: #1e1e2f; color: #f0f0f0; text-align: center; padding: 40px; }
        button { margin: 10px; padding: 12px 24px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer; color: white; }
        button:hover { background: #444; }
        #btn-iniciar { background: #27ae60; }
        #btn-parar { background: #c0392b; }
        #btn-reiniciar { background: #f39c12; }
        #btn-ip { background: #2980b9; }
        #btn-jogadores { background: #8e44ad; }
        #console { background: #333; padding: 10px; margin-top: 20px; border-radius: 8px; height: 150px; overflow-y: auto; text-align: left; }
      </style>
    </head>
    <body>
      <h1>Painel de Controle do Servidor</h1>
      <button id="btn-iniciar" onclick="executarAcao('/iniciar')">Iniciar</button>
      <button id="btn-parar" onclick="executarAcao('/parar')">Parar</button>
      <button id="btn-reiniciar" onclick="executarAcao('/reiniciar')">Reiniciar</button>
      <button id="btn-ip" onclick="mostrarIp()">Ver IP</button>
      <button id="btn-jogadores" onclick="mostrarJogadores()">Ver Jogadores</button>
      <div id="status">Status: <span id="statusText">Carregando...</span></div>
      <div id="console"><b>Console:</b><div id="consoleContent"></div></div>
      
      <script>
        async function obterStatus() {
          const res = await fetch('/status');
          const data = await res.json();
          document.getElementById('statusText').textContent = data.status;
          logConsole('Status: ' + data.status);
        }

        async function executarAcao(endpoint) {
          const res = await fetch(endpoint, { method: 'POST' });
          const data = await res.json();
          alert(data.message);
          logConsole(data.message);
          obterStatus();
        }

        async function mostrarIp() {
          const res = await fetch('/ip');
          const data = await res.json();
          alert('🌍 IP: ' + data.ip);
          logConsole('IP: ' + data.ip);
        }

        async function mostrarJogadores() {
          const res = await fetch('/jogadores');
          const data = await res.json();
          alert('Jogadores Online: ' + data.online + '\\n' + (data.list || []).join(', '));
          logConsole('Jogadores: ' + (data.list || []).join(', '));
        }

        function logConsole(msg) {
          const c = document.getElementById('consoleContent');
          c.innerHTML += msg + '<br>';
          c.scrollTop = c.scrollHeight;
        }

        window.onload = obterStatus;
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(\`🚀 Painel rodando em http://localhost:\${PORT}\`);
  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => console.log(\`🌍 IP público: \${data.trim()}\`));
  }).on("error", err => console.error("❌ Erro IP público:", err.message));
});
