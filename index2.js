Nenhum IP padrão configurado.';
    const ip = principal.attributes.ip;
    const port = principal.attributes.port;
    return `${ip}:${port}`;
  } catch (err) {
    console.error('❌ Erro ao obter IP do servidor:', err.message);
    return '❌ Erro ao obter IP do servidor!';
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, { headers: clientHeaders });
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

// Simulação: lista de jogadores online
app.get('/jogadores', (req, res) => {
  const jogadores = ['Player1', 'Player2', 'Player3'];
  res.json({ jogadores });
});

// Simulação: console logs
app.get('/console-logs', (req, res) => {
  const logs = [
    '[INFO] Servidor iniciado.',
    '[WARN] Uso de CPU elevado.',
    '[INFO] Jogador Player1 entrou no servidor.'
  ];
  res.json({ logs });
});

// Página básica para testar
app.get('/', (req, res) => {
  res.send('Painel de Controle do Servidor - Backend rodando!');
});

// ========== INICIAR SERVIDOR ==========
app.listen(PORT, () => {
  console.log('🚀 Painel rodando em http://localhost:' + PORT);
  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', (chunk) => data += chunk);
    resp.on('end', () => {
      console.log('🌍 IP público da máquina: ' + data.trim());
    });
  }).on("error", (err) => {
    console.error('❌ Erro ao obter IP público:', err.message);
  });
});
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

// ===== FUNÇÕES =====
async function obterIpDoServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}`, { headers: clientHeaders });
    const allocations = res.data.attributes.relationships.allocations.data;
    const principal = allocations.find(a => a.attributes.is_default);
    if (!principal) return '❌ Nenhum IP padrão configurado.';
    const ip = principal.attributes.ip;
    const port = principal.attributes.port;
    return `${ip}:${port}`;
  } catch (err) {
    console.error('❌ Erro ao obter IP:', err.message);
    return '❌ Erro ao obter IP do servidor!';
  }
}

async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, { headers: clientHeaders });
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

// ===== ROTAS =====
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

app.get('/jogadores', (req, res) => {
  const jogadores = ['Player1', 'Player2', 'Player3'];
  res.json({ jogadores });
});

app.get('/console-logs', (req, res) => {
  const logs = [
    '[INFO] Servidor iniciado.',
    '[WARN] Uso de CPU elevado.',
    '[INFO] Jogador Player1 entrou no servidor.'
  ];
  res.json({ logs });
});

app.get('/', (req, res) => {
  res.send('Painel de Controle - Backend rodando!');
});

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log('🚀 Painel rodando em http://localhost:' + PORT);
  https.get('https://ifconfig.me/ip', (resp) => {
    let data = '';
    resp.on('data', (chunk) => data += chunk);
    resp.on('end', () => {
      console.log('🌍 IP público: ' + data.trim());
    });
  }).on("error", (err) => {
    console.error('❌ Erro ao obter IP público:', err.message);
  });
});
