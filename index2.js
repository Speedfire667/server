const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

// Desativa a verificação SSL (usar com cuidado)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// CONFIG DO PTERODACTYL
const API_URL = 'https://backend.magmanode.com/'; // coloque o link exato do seu painel aqui
const API_KEY = 'ptlc_qbwCZjtZlXra4eQ5G32o4mFIwVIOZse6XEn8bSHlnJX';

const HEADERS = {
  'Authorization': `Bearer ${API_KEY}`,
  'Accept': 'Application/vnd.pterodactyl.v1+json',
  'Content-Type': 'application/json'
};

app.use(express.urlencoded({ extended: true }));

// Página principal
app.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/client`, { headers: HEADERS });
    
    // Verificar se a resposta contém dados válidos
    if (!response.data || !response.data.data) {
      return res.send('Dados de servidores não encontrados ou formato inválido.');
    }

    const servidores = response.data.data.map(s => ({
      nome: s.attributes.name,
      id: s.attributes.identifier
    }));

    let html = `
    <html>
    <head>
      <title>Gerenciador de Servidores</title>
      <style>
        body { font-family: Arial; background: #111; color: #fff; text-align: center; }
        .card { background: #222; padding: 20px; margin: 20px auto; border-radius: 10px; width: 300px; box-shadow: 0 0 10px #000; }
        button { padding: 10px 15px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; }
        .start { background: #28a745; color: #fff; }
        .stop { background: #dc3545; color: #fff; }
        .restart { background: #ffc107; color: #000; }
      </style>
    </head>
    <body>
      <h1>Servidores Pterodactyl</h1>`;

    servidores.forEach(s => {
      html += `
      <div class="card">
        <h2>${s.nome}</h2>
        <form method="POST" action="/power">
          <input type="hidden" name="id" value="${s.id}">
          <button class="start" name="comando" value="start">Start</button>
          <button class="stop" name="comando" value="stop">Stop</button>
          <button class="restart" name="comando" value="restart">Restart</button>
        </form>
      </div>`;
    });

    html += `</body></html>`;
    res.send(html);
  } catch (err) {
    res.send('Erro ao carregar servidores:<br><pre>' + (err.response?.data || err.message) + '</pre>');
  }
});

// Controle de servidor
app.post('/power', async (req, res) => {
  const { id, comando } = req.body;
  try {
    await axios.post(`${API_URL}/api/client/servers/${id}/power`, {
      signal: comando
    }, { headers: HEADERS });
    res.redirect('/');
  } catch (err) {
    res.send('Erro ao enviar comando:<br><pre>' + (err.response?.data || err.message) + '</pre>');
  }
});

app.listen(PORT, () => console.log(`Servidor web rodando em http://localhost:${PORT}`));
