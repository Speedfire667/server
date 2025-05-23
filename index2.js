const express = require('express');
const axios = require('axios');
const path = require('path');

const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_UzFaWrwEUSMR8qYYJmvhND5X7dinnDVtSIuBirqryuo'; // sua token
const SERVER_ID = 'c9593e69'; // seu server id
const PORT = process.env.PORT || 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

const app = express();
app.use(express.json());

// Servir o arquivo HTML da raiz (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Funções API (idem antes)

async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, {
      headers: clientHeaders,
    });
    const allocations = res.data.attributes.relationships.allocations.data;
    const principal = allocations.find(a => a.attributes.is_default);
    if (!principal) return null;
    return `${principal.attributes.ip}:${principal.attributes.port}`;
  } catch (err) {
    console.error('Erro ao obter IP do servidor:', err.message);
    return null;
  }
}

async function obterUsoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    const usage = res.data.attributes.resources;
    return {
      cpu: (usage.cpu_absolute || 0).toFixed(2),
      ram: (usage.memory_bytes / 1024 / 1024).toFixed(2),
      disk: (usage.disk_bytes / 1024 / 1024).toFixed(2),
    };
  } catch (err) {
    console.error('Erro ao obter uso:', err.message);
    return null;
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    return res.data.attributes.current_state;
  } catch (err) {
    console.error('Erro ao obter status:', err.message);
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

async function obterJogadores() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/players`, {
      headers: clientHeaders,
    });
    if (!res.data || !res.data.data) return [];
    return res.data.data.map(p => p.attributes.username);
  } catch (err) {
    console.error('Erro ao obter jogadores:', err.message);
    return [];
  }
}

// Console logs simulado
let consoleLogs = ['Console iniciado...'];
function addLog(msg) {
  consoleLogs.push(msg);
  if (consoleLogs.length > 50) consoleLogs.shift();
}

setInterval(() => {
  const now = new Date().toLocaleTimeString();
  addLog(`[${now}] Log simulado do servidor Bedrock.`);
}, 10000);

// Rotas API

app.get('/status', async (req, res) => {
  const status = await statusServidor();
  res.json({ status });
});

app.post('/iniciar', async (req, res) => {
  const msg = await iniciarServidor();
  addLog(`[${new Date().toLocaleTimeString()}] Comando iniciar enviado.`);
  res.json({ message: msg });
});

app.post('/parar', async (req, res) => {
  const msg = await pararServidor();
  addLog(`[${new Date().toLocaleTimeString()}] Comando parar enviado.`);
  res.json({ message: msg });
});

app.post('/reiniciar', async (req, res) => {
  const msg = await reiniciarServidor();
  addLog(`[${new Date().toLocaleTimeString()}] Comando reiniciar enviado.`);
  res.json({ message: msg });
});

app.get('/ip', async (req, res) => {
  const ip = await obterIpDoServidor();
  res.json({ ip: ip || 'IP não disponível' });
});

app.get('/uso', async (req, res) => {
  const uso = await obterUsoServidor();
  res.json({ uso });
});

app.get('/jogadores', async (req, res) => {
  const jogadores = await obterJogadores();
  res.json({ jogadores });
});

app.get('/console', (req, res) => {
  res.json({ logs: consoleLogs });
});

app.listen(PORT, () => {
  console.log(`Painel rodando em http://localhost:${PORT}`);
});
