const axios = require('axios');
const express = require('express');
const https = require('https');

// ========== CONFIGS ==========
const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_UzFaWrwEUSMR8qYYJmvhND5X7dinnDVtSIuBirqryuo'; // NOVA TOKEN
const SERVER_ID = 'c9593e69'; // Atualizado
const PORT = 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

const app = express();

// ========== FUNÇÕES ==========
async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, {
      headers: clientHeaders,
    });
    const allocations = res.data.attributes.relationships.allocations.data;
    const principal = allocations.find(a => a.attributes.is_default);
    if (!principal) return '❌ Nenhum IP padrão configurado.';
    const ip = principal.attributes.ip;
    const port = principal.attributes.port;
    return `${ip}:${port}`;
  } catch (err) {
    console.error('❌ Erro ao obter IP do servidor:', err.message);
    return '❌ Erro ao obter IP do servidor!';
  }
}

async function obterUsoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    const usage = res.data.attributes.resources;
    return `
CPU: ${(usage.cpu_absolute || 0).toFixed(2)}%
RAM: ${(usage.memory_bytes / 1024 / 1024).toFixed(2)} MB
Disco: ${(usage.disk_bytes / 1024 / 1024).toFixed(2)} MB`;
  } catch (err) {
    console.error('❌ Erro ao obter uso de recursos:', err.message);
    return '❌ Erro ao obter uso de recursos!';
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    return res.data.attributes.current_state;
  } catch (err) {
    console.error('❌ Erro ao verificar status:', err.message);
    return 'Erro';
  }
}

async function iniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'start' }, { headers: clientHeaders });
    return '✅ Servidor iniciado!';
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    return '❌ Erro ao iniciar servidor!';
  }
}

async function pararServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'stop' }, { headers: clientHeaders });
    return '🛑 Servidor parado!';
  } catch (err) {
    console.error('❌ Erro ao parar servidor:', err.message);
    return '❌ Erro ao parar servidor!';
  }
}

async function reiniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'restart' }, { headers: clientHeaders });
    return '🔄 Servidor reiniciado!';
  } catch (err) {
    console.error('❌ Erro ao reiniciar servidor:', err.message);
    return '❌ Erro ao reiniciar servidor!';
  }
}

// ========== ROTAS ==========
app.get('/status', async (req, res) => {
  const status = await statusServidor();
  res.json({ status });
});

app.post('/iniciar', async (req, res) => {
  const result = await iniciarServidor();
  res.json({ message: result });
});

app.post('/parar', async (req, res) => {
  const result = await pararServidor();
  res.json({ message: result });
});

app.post('/reiniciar', async (req, res) => {
  const result = await reiniciarServidor();
  res.json({ message: result });
});

app.get('/ip', async (req, res) => {
  const ip = await obterIpDoServidor();
  res.json({ ip });
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8" />
        <title>Controle do Servidor</title>
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
                margin: 10px;
                padding: 12px 24px;
                font-size: 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                transition: background 0.3s;
                color: white;
            }
            button:hover {
                background: #444;
            }
            #btn-iniciar { background: #27ae60; }
            #btn-parar { background: #c0392b; }
            #btn-reiniciar { background: #f39c12; }
            #btn-ip { background: #2980b9; }
            #status {
                margin-top: 20px;
                font-size: 18px;
            }
        </style>
    </head>
    <body>
        <h1>Painel de Controle do Servidor</h1>
        <button id="btn-iniciar" onclick="iniciarServidor()">Iniciar</button>
        <button id="btn-parar" onclick="pararServidor()">Parar</button>
        <button id="btn-reiniciar" onclick="reiniciarServidor()">Reiniciar</button>
        <button id="btn-ip" onclick="mostrarIp()">Ver IP</button>
        <div id="status">Status: <span id="statusText">Carregando...</span></div>
        <script>
            async function obterStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('statusText').textContent = data.status;
            }
            async function iniciarServidor() {
                const res = await fetch('/iniciar', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                obterStatus();
            }
            async function pararServidor() {
                const res = await fetch('/parar', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                obterStatus();
            }
            async function reiniciarServidor() {
                const res = await fetch('/reiniciar', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                obterStatus();
            }
            async function mostrarIp() {
                const res = await fetch('/ip');
                const data = await res.json();
                alert(\`🌍 IP do servidor: \${data.ip}\`);
            }
            window.onload = obterStatus;
        </script>
    </body>
    </html>
  `);
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log(`🚀 Painel rodando em http://localhost:${PORT}`);

  // Mostrar IP público da máquina no log
  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', (chunk) => data += chunk);
    resp.on('end', () => {
      console.log(`🌍 IP público da máquina: ${data.trim()}`);
    });
  }).on("error", (err) => {
    console.error("❌ Erro ao obter IP público:", err.message);
  });
});
