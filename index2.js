const axios = require('axios');
const express = require('express');
const https = require('https');

const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_UzFaWrwEUSMR8qYYJmvhND5X7dinnDVtSIuBirqryuo';
const SERVER_ID = 'c9593e69';
const PORT = process.env.PORT || 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

const app = express();

async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, { headers: clientHeaders });
    const principal = res.data.attributes.relationships.allocations.data.find(a => a.attributes.is_default);
    return principal ? `${principal.attributes.ip}:${principal.attributes.port}` : 'Nenhum IP padrão.';
  } catch {
    return 'Erro ao obter IP.';
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
    return 'Servidor iniciado!';
  } catch {
    return 'Erro ao iniciar!';
  }
}

async function pararServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'stop' }, { headers: clientHeaders });
    return 'Servidor parado!';
  } catch {
    return 'Erro ao parar!';
  }
}

async function reiniciarServidor() {
  try {
    await axios.post(`${PANEL_URL}/api/client/servers/${SERVER_ID}/power`, { signal: 'restart' }, { headers: clientHeaders });
    return 'Servidor reiniciado!';
  } catch {
    return 'Erro ao reiniciar!';
  }
}

async function obterJogadores() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, { headers: clientHeaders });
    const players = res.data.attributes.resources.players || [];
    return players;
  } catch {
    return [];
  }
}

app.get('/status', async (req, res) => res.json({ status: await statusServidor() }));
app.get('/ip', async (req, res) => res.json({ ip: await obterIpDoServidor() }));
app.post('/iniciar', async (req, res) => res.json({ message: await iniciarServidor() }));
app.post('/parar', async (req, res) => res.json({ message: await pararServidor() }));
app.post('/reiniciar', async (req, res) => res.json({ message: await reiniciarServidor() }));

app.get('/jogadores', async (req, res) => {
  const players = await obterJogadores();
  res.json({ total: players.length, jogadores: players });
});

app.get('/console', (req, res) => {
  res.json({ console: 'Apenas leitura. Sem envio de comandos.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  https.get('https://ifconfig.me/ip', resp => {
    let data = '';
    resp.on('data', chunk => data += chunk);
    resp.on('end', () => console.log(`IP público: ${data.trim()}`));
  }).on("error", err => console.error("Erro ao obter IP público:", err.message));
});
