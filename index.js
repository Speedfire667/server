const axios = require('axios');
const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

// ========== CONFIGS ==========
// Defina as variáveis diretamente no código, mas Lembre-se de não comprometer os tokens!
// Utilize variáveis diretamente aqui, mas mantenha esses valores privados em produção.
const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_Db3dp1bv0rVZsutv2aH4mlYg6XXTkwXvZL0XUwEaByL'; // Use com cuidado!
const SERVER_ID = 'dff875d0'; // seu server ID do painel
const DISCORD_TOKEN = 'MTM2MDAzNzY3ODIxMjcxMDQ4MQ.GFjODP.abSdsuYaQu0Bop2lTOYVwdSmkDGNr4w-v6HqVg'; // Use com cuidado!
const ALLOWED_CHANNEL_ID = '1360274781697478798'; // ID do canal permitido para os comandos
const PORT = 3000;

const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

const app = express();

// ========== FUNÇÕES DO SERVIDOR ==========

async function obterIpPublico() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json');
    return res.data.ip;
  } catch (err) {
    console.error('❌ Erro ao obter IP público:', err.message);
    return 'Desconhecido';
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

// ========== ROTAS WEB ==========

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

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Controle do Servidor</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                padding: 20px;
            }
            button {
                padding: 10px 20px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
            }
            #status {
                margin-top: 20px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <h1>Controle do Servidor</h1>
        <button onclick="iniciarServidor()">Iniciar Servidor</button>
        <button onclick="pararServidor()">Parar Servidor</button>
        <button onclick="reiniciarServidor()">Reiniciar Servidor</button>
        <div id="status">Status do Servidor: <span id="statusText">Carregando...</span></div>
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
            window.onload = obterStatus;
        </script>
    </body>
    </html>
  `);
});

// ========== DISCORD BOT ==========

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

bot.on('ready', () => {
  console.log(`🤖 Bot do Discord online como ${bot.user.tag}`);
});

bot.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

  const content = message.content.toLowerCase();

  if (content === '!start') {
    const msg = await iniciarServidor();
    message.reply(msg);
  } else if (content === '!stop') {
    const msg = await pararServidor();
    message.reply(msg);
  } else if (content === '!restart') {
    const msg = await reiniciarServidor();
    message.reply(msg);
  } else if (content === '!status') {
    const status = await statusServidor();
    message.reply(`📊 Status do servidor: **${status}**`);
  }
});

bot.login(DISCORD_TOKEN);

// ========== INICIAR EXPRESS ==========

app.listen(PORT, async () => {
  const ip = await obterIpPublico();
  console.log(`🌐 Interface web: http://localhost:${PORT}`);
  console.log(`📡 IP Público: ${ip}`);
});
