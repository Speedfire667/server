const express = require('express');
const axios = require('axios');
const https = require('https');

const app = express();
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ===== CONFIGS =====
const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_MAy7qqgihyy7rh2eBGeIZhjOME4tTwyzhLTngSOvkFZ';
const SERVER_ID = 'c9593e69';
const PORT = process.env.PORT || 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

// ===== FUNÇÕES =====

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
    console.error('Erro ao obter IP:', err.message);
    return 'Erro ao obter IP!';
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
    console.error('Erro ao obter uso:', err.message);
    return { erro: 'Erro ao obter uso!' };
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

async function acaoPowerServidor(signal) {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, 
      { signal }, { headers: clientHeaders });
    return `Servidor ${signal} com sucesso!`;
  } catch (err) {
    console.error(`Erro ao ${signal} servidor:`, err.message);
    return `Erro ao ${signal} servidor!`;
  }
}

// Mock jogadores e console
let jogadores = ['Jogador1', 'Jogador2'];
let consoleLogs = [];

function adicionarLogConsole(mensagem) {
  const timestamp = new Date().toISOString();
  consoleLogs.push(`[${timestamp}] ${mensagem}`);
  if (consoleLogs.length > 100) consoleLogs.shift();
}

// Simulação de log a cada 10s
setInterval(() => {
  adicionarLogConsole('Log automático do servidor.');
}, 10000);

// ===== ROTAS =====

app.get('/status', async (req, res) => {
  const status = await statusServidor();
  res.json({ status });
});

app.post('/iniciar', async (req, res) => {
  const result = await acaoPowerServidor('start');
  adicionarLogConsole('Comando: Iniciar servidor');
  res.json({ message: result });
});

app.post('/parar', async (req, res) => {
  const result = await acaoPowerServidor('stop');
  adicionarLogConsole('Comando: Parar servidor');
  res.json({ message: result });
});

app.post('/reiniciar', async (req, res) => {
  const result = await acaoPowerServidor('restart');
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

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 Painel rodando em http://localhost:${PORT}`);

  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => {
      console.log(`🌍 IP público: ${data.trim()}`);
    });
  }).on('error', (err) => {
    console.error('Erro ao obter IP público:', err.message);
  });
});
