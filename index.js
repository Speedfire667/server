const axios = require('axios');
const express = require('express');

// Configurações
const PANEL_URL = 'https://backend.magmanode.com';
const CLIENT_TOKEN = 'ptlc_5w9nYa83K9LNjBvpo7NvrjKTKKRmEfh8EIaqjbvYxzh';
const SERVER_ID = 'dff875d0'; // ID do servidor específico

// Cabeçalhos
const clientHeaders = {
  Authorization: `Bearer ${CLIENT_TOKEN}`,
  Accept: 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json',
};

// Criar servidor Express
const app = express();
const port = 3000;

// Função para obter o IP público da máquina
async function obterIpPublico() {
  try {
    const res = await axios.get('https://api.ipify.org?format=json');
    return res.data.ip;
  } catch (err) {
    console.error('❌ Erro ao obter IP público:', err.response?.data || err.message);
    return 'Desconhecido';
  }
}

// 1️⃣ Status do servidor
async function statusServidor() {
  try {
    const res = await axios.get(`${PANEL_URL}/api/client/servers/${SERVER_ID}/resources`, {
      headers: clientHeaders,
    });
    return res.data.attributes.current_state;
  } catch (err) {
    console.error('❌ Erro ao verificar status do servidor:', err.response?.data || err.message);
    return null;
  }
}

// 2️⃣ Iniciar servidor
async function iniciarServidor() {
  try {
    await axios.post(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/power`,
      { signal: 'start' },
      { headers: clientHeaders }
    );
    return '✅ Servidor iniciado!';
  } catch (err) {
    console.error('❌ Erro ao iniciar servidor:', err.response?.data || err.message);
    return '❌ Erro ao iniciar servidor!';
  }
}

// 3️⃣ Parar servidor
async function pararServidor() {
  try {
    await axios.post(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/power`,
      { signal: 'stop' },
      { headers: clientHeaders }
    );
    return '🛑 Servidor parado!';
  } catch (err) {
    console.error('❌ Erro ao parar servidor:', err.response?.data || err.message);
    return '❌ Erro ao parar servidor!';
  }
}

// 4️⃣ Reiniciar servidor
async function reiniciarServidor() {
  try {
    await axios.post(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/power`,
      { signal: 'restart' },
      { headers: clientHeaders }
    );
    return '🔄 Servidor reiniciado!';
  } catch (err) {
    console.error('❌ Erro ao reiniciar servidor:', err.response?.data || err.message);
    return '❌ Erro ao reiniciar servidor!';
  }
}

// 5️⃣ Rota para obter o status do servidor
app.get('/status', async (req, res) => {
  const status = await statusServidor();
  res.json({ status });
});

// 6️⃣ Rota para iniciar o servidor
app.post('/iniciar', async (req, res) => {
  const result = await iniciarServidor();
  res.json({ message: result });
});

// 7️⃣ Rota para parar o servidor
app.post('/parar', async (req, res) => {
  const result = await pararServidor();
  res.json({ message: result });
});

// 8️⃣ Rota para reiniciar o servidor
app.post('/reiniciar', async (req, res) => {
  const result = await reiniciarServidor();
  res.json({ message: result });
});

// Servir a página HTML diretamente dentro do arquivo JavaScript
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
        
        <div id="status">Status do Servidor: <span id="statusText">Desconhecido</span></div>

        <script>
            // Função para atualizar o status do servidor
            async function obterStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('statusText').textContent = data.status;
            }

            // Funções para controlar o servidor
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

            // Atualiza o status do servidor quando a página é carregada
            window.onload = obterStatus;
        </script>

    </body>
    </html>
  `);
});

// Iniciar o servidor Express e obter o IP público
app.listen(port, async () => {
  const ipPublico = await obterIpPublico();
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`IP Público da máquina: ${ipPublico}`);
});
