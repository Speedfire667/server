const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const bedrock = require('bedrock-protocol');

// Configurações
const PORT = 3000;
const MINECRAFT_SERVER = { host: 'BYTEServer.aternos.me', port: 12444 };

// Iniciar bot Bedrock
const client = bedrock.createClient({
  host: MINECRAFT_SERVER.host,
  port: MINECRAFT_SERVER.port,
  username: 'MeuBot123',
  offline: true,
});

// Variável para armazenar dados da "tela"
let botInfo = {
  position: { x: 0, y: 0, z: 0 },
  dimension: '',
};

client.on('spawn', () => {
  console.log('Bot conectado!');
});

client.on('position', (packet) => {
  botInfo.position = {
    x: packet.x.toFixed(2),
    y: packet.y.toFixed(2),
    z: packet.z.toFixed(2),
  };
});

client.on('level_event', (packet) => {
  botInfo.dimension = `Dimension ID: ${packet.eventId}`;
});

// Servidor Web com Socket.io
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bot Minecraft Bedrock</title>
      <style>
        body { font-family: sans-serif; background: #111; color: #0f0; padding: 2rem; }
      </style>
    </head>
    <body>
      <h1>Informações do Bot</h1>
      <div id="info">Carregando...</div>
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        socket.on('botData', data => {
          document.getElementById('info').innerText = 
            'Posição: X=' + data.position.x + ' Y=' + data.position.y + ' Z=' + data.position.z + 
            '\\n' + data.dimension;
        });
      </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  console.log('Web conectado');
  const interval = setInterval(() => {
    socket.emit('botData', botInfo);
  }, 1000);

  socket.on('disconnect', () => clearInterval(interval));
});

httpServer.listen(PORT, () => {
  console.log(`Site disponível em http://localhost:${PORT}`);
});
