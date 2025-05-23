const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(express.json());

// Libera CORS manualmente
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // ou coloque o domínio do seu frontend
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ======== CONFIGS ========
const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_UzFaWrwEUSMR8qYYJmvhND5X7dinnDVtSIuBirqryuo';
const SERVER_ID = 'c9593e69';
const PORT = process.env.PORT || 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

// ======== FUNÇÕES ========

async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, {
      headers: clientHeaders,
    });
    const allocations = res.data.attributes.relationships.allocations.data;
    const principal = allocations.find(a => a.attributes.is_default);
    if (!principal) return 'Nenhum IP padrão configurado.';
    const ip = principal.attributes.ip;
    const port = principal.attributes.port;
    return `${ip}:${port}`;
  } catch (err) {
    console.error('Erro ao obter IP do servidor:', err.message);
    return 'Erro ao obter IP do servidor!';
  }
}

async function obterUsoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    const usage = res.data.attributes.resources;
    return {
      cpu: `${(usage.cpu_absolute || 0).toFixed(2)}%`,
      ram: `${(usage.memory_bytes / 1024 / 1024).toFixed(2)} MB`,
      disco: `${(usage.disk_bytes / 1024 / 1024).toFixed(2)} MB`,
    };
  } catch (err) {
    console.error('Erro ao obter uso de recursos:', err.message);
    return { erro: 'Erro ao obter uso de recursos!' };
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    return res.data.attributes.current_state;
  } catch (err) {
    console.error('Erro ao verificar status:', err.message);
    return 'Erro';
  }
}

async function iniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'start' }, { headers: clientHeaders });
    return 'Servidor iniciado!';
  } catch (err) {
    console.error('Erro ao iniciar servidor:', err.message);
    return 'Erro ao iniciar servidor!';
  }
}

async function pararServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'stop' }, { headers: clientHeaders });
    return 'Servidor parado!';
  } catch (err) {
    console.error('Erro ao parar servidor:', err.message);
    return 'Erro ao parar servidor!';
  }
}

async function reiniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'restart' }, { headers: clientHeaders });
    return 'Servidor reiniciado!';
  } catch (err) {
    console.error('Erro ao reiniciar servidor:', err.message);
    return 'Erro ao reiniciar servidor!';
  }
}

// Mock de jogadores e console (já que MagmaNode não expõe diretamente)
let jogadores = ['Jogador1', 'Jogador2'];
let consoleLogs = [];

function adicionarLogConsole(mensagem) {
  const timestamp = new Date().toISOString();
  consoleLogs.push(`[${timestamp}] ${mensagem}`);
  if (consoleLogs.length > 100) consoleLogs.shift();
}

// Simulando logs a cada 10s
setInterval(() => {
  adicionarLogConsole('Log automático do servidor.');
}, 10000);

// ======== ROTAS ========

app.get('/status', async (req, res) => {
  const status = await statusServidor();
  res.json({ status });
});

app.post('/iniciar', async (req, res) => {
  const result = await iniciarServidor();
  adicionarLogConsole('Comando: Iniciar servidor');
  res.json({ message: result });
});

app.post('/parar', async (req, res) => {
  const result = await pararServidor();
  adicionarLogConsole('Comando: Parar servidor');
  res.json({ message: result });
});

app.post('/reiniciar', async (req, res) => {
  const result = await reiniciarServidor();
  adicionarLogConsole('Comando: Reiniciar servidor');
  res.json({ message: result });
});

app.get('/ip', async (req, res) => {
  const ip = await obterIpDoServidor();
  res.json({ ip });
});

app.get('/uso', async (req, res) => {
  const uso = await obterUsoServidor();
  res.json(uso);
});

app.get('/players', (req, res) => {
  res.json({ jogadores });
});

app.get('/console', (req, res) => {
  res.json({ logs: consoleLogs });
});

// ======== INICIAR SERVIDOR ========
app.listen(PORT, () => {
  console.log(`🚀 Painel rodando em http://localhost:${PORT}`);

  // Mostrar IP público da máquina no log
  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => {
      console.log(`🌍 IP público da máquina: ${data.trim()}`);
    });
  }).on('error', (err) => {
    console.error('Erro ao obter IP público:', err.message);
  });
});
