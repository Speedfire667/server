require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1362610823305887844';
const CHANNEL_ID = '1362932927650074685';
const YOUTUBE_CHANNEL_URL = 'https://youtube.com/@ice_noobz?si=NS6x2h_gzXkzNxgW';

const inviteCounts = new Map();
let previousInvites = new Map();

const CARGOS_FILE = 'cargos.json';
let cargos = { 5: 'Conquistador', 10: 'Veterano', 20: 'Lendário' };
if (fs.existsSync(CARGOS_FILE)) {
  cargos = JSON.parse(fs.readFileSync(CARGOS_FILE, 'utf-8'));
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

const commands = [
  new SlashCommandBuilder().setName('conquistas').setDescription('Veja quantas pessoas você convidou'),
  new SlashCommandBuilder().setName('chanel').setDescription('Veja o canal do YouTube do bot'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();

async function carregarConvites() {
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch();
    const inviteMap = new Map();
    invites.forEach(inv => inviteMap.set(inv.code, inv));
    previousInvites.set(guild.id, inviteMap);
  }

  if (fs.existsSync('convites.json')) {
    const data = JSON.parse(fs.readFileSync('convites.json', 'utf-8'));
    for (const [id, count] of data) inviteCounts.set(id, count);
  }
}

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);
  await carregarConvites();
});

client.on('guildMemberAdd', async member => {
  const newInvites = await member.guild.invites.fetch();
  const oldInvites = previousInvites.get(member.guild.id);
  const inviteUsed = newInvites.find(inv => {
    const old = oldInvites.get(inv.code);
    return old && inv.uses > old.uses;
  });

  if (inviteUsed?.inviter) {
    const inviterId = inviteUsed.inviter.id;
    const current = inviteCounts.get(inviterId) || 0;
    const total = current + 1;
    inviteCounts.set(inviterId, total);

    const canal = await client.channels.fetch(CHANNEL_ID);
    canal.send(`**${inviteUsed.inviter.tag}** convidou alguém! Total: **${total}** convite(s).`);

    if (cargos[total]) {
      const role = member.guild.roles.cache.find(r => r.name === cargos[total]);
      if (role) {
        const convidador = await member.guild.members.fetch(inviterId).catch(() => null);
        if (convidador && !convidador.roles.cache.has(role.id)) {
          await convidador.roles.add(role);
          canal.send(`Parabéns **${inviteUsed.inviter.tag}**, você ganhou o cargo **${cargos[total]}**!`);
        }
      }
    }
  }

  const updatedMap = new Map();
  newInvites.forEach(inv => updatedMap.set(inv.code, inv));
  previousInvites.set(member.guild.id, updatedMap);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'conquistas') {
    const total = inviteCounts.get(interaction.user.id) || 0;
    await interaction.reply({
      content: `Você já convidou **${total}** pessoa(s)!`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'chanel') {
    await interaction.reply({
      content: `Aqui está o link para o canal do YouTube: ${YOUTUBE_CHANNEL_URL}`,
      ephemeral: true,
    });
  }
});

function salvarConvites() {
  const data = JSON.stringify([...inviteCounts], null, 2);
  fs.writeFileSync('convites.json', data, 'utf-8');
}
setInterval(salvarConvites, 30 * 60 * 1000);

// Painel web dinâmico
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Painel de Cargos</title>
        <style>
          body { background: #1c1c1c; color: white; font-family: sans-serif; text-align: center; padding: 40px; }
          input, button { padding: 10px; margin: 10px; border-radius: 5px; border: none; font-size: 16px; }
          input { width: 250px; }
          button { background: #5865F2; color: white; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Configurar Cargos por Convites</h1>
        <form method="POST" action="/salvar">
          <div>
            <label>5 convites: <input type="text" name="5" value="${cargos[5] || ''}" /></label>
          </div>
          <div>
            <label>10 convites: <input type="text" name="10" value="${cargos[10] || ''}" /></label>
          </div>
          <div>
            <label>20 convites: <input type="text" name="20" value="${cargos[20] || ''}" /></label>
          </div>
          <button type="submit">Salvar</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/salvar', (req, res) => {
  cargos[5] = req.body["5"];
  cargos[10] = req.body["10"];
  cargos[20] = req.body["20"];
  fs.writeFileSync(CARGOS_FILE, JSON.stringify(cargos, null, 2), 'utf-8');
  res.send('<script>alert("Cargos atualizados!"); window.location.href="/";</script>');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Painel web iniciado!');
});

client.login(TOKEN);
