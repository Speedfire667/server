require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const bodyParser = require('body-parser');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1362610823305887844';
const CHANNEL_ID = '1362932927650074685';
const YOUTUBE_CHANNEL_URL = 'https://youtube.com/@ice_noobz?si=NS6x2h_gzXkzNxgW';

const inviteCounts = new Map();
let previousInvites = new Map();

// Inicializa o servidor Express
const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // Serve arquivos estáticos da pasta "public"

// Inicializa o cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

// Cargos com suas descrições e IDs
const cargos = {
  5: {
    name: 'Conquistador',
    description: 'Você é um Conquistador! Parabéns, você trouxe amigos para o servidor. Aproveite acesso especial ao canal e eventos exclusivos!',
    id: '',
  },
  10: {
    name: 'Veterano',
    description: 'Veterano! Você é um membro essencial da comunidade. Ganhe acesso a benefícios exclusivos como cargos especiais e eventos VIP!',
    id: '',
  },
  20: {
    name: 'Lendário',
    description: 'Lendário! Você é um dos maiores contribuidores da nossa comunidade. Receba reconhecimento exclusivo e acesso a canais e eventos reservados!',
    id: '',
  },
};

const commands = [
  new SlashCommandBuilder().setName('conquistas').setDescription('Veja quantas pessoas você convidou'),
  new SlashCommandBuilder().setName('chanel').setDescription('Veja o canal do YouTube do bot'),
  new SlashCommandBuilder().setName('roles').setDescription('Veja os cargos disponíveis e o que cada um significa'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Veja informações sobre o seu usuário'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Veja informações sobre o servidor'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

// Registra os comandos do bot
(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();

// Função para carregar os convites
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

// Função para salvar os convites
function salvarConvites() {
  const data = JSON.stringify([...inviteCounts], null, 2);
  fs.writeFileSync('convites.json', data, 'utf-8');
}

// Lógica do bot do Discord
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

    // Atribui cargo com base no total de convites
    if (cargos[total]) {
      const role = member.guild.roles.cache.find(r => r.name === cargos[total].name);
      if (role) {
        const convidador = await member.guild.members.fetch(inviterId).catch(() => null);
        if (convidador && !convidador.roles.cache.has(role.id)) {
          await convidador.roles.add(role);
          canal.send(`Parabéns **${inviteUsed.inviter.tag}**, você ganhou o cargo **${cargos[total].name}**!`);
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

  if (interaction.commandName === 'roles') {
    const rolesList = Object.keys(cargos).map(key => {
      const cargo = cargos[key];
      return `**${cargo.name}**: ${cargo.description}`;
    }).join('\n');

    await interaction.reply({
      content: `Cargos disponíveis e o que cada um significa:\n${rolesList}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'userinfo') {
    const total = inviteCounts.get(interaction.user.id) || 0;
    const userRoles = [];
    Object.keys(cargos).forEach(key => {
      if (total >= key) {
        userRoles.push(cargos[key].name);
      }
    });

    await interaction.reply({
      content: `Informações de **${interaction.user.tag}**:\nConvites: **${total}**\nCargos: ${userRoles.length ? userRoles.join(', ') : 'Nenhum cargo atribuído'}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'serverinfo') {
    const guild = interaction.guild;
    const memberCount = guild.memberCount;
    await interaction.reply({
      content: `Informações do servidor **${guild.name}**:\nMembros: **${memberCount}**`,
      ephemeral: true,
    });
  }
});

// Atualização de IDs de cargos via requisição POST
app.post('/update-roles', (req, res) => {
  const { cargo5, cargo10, cargo20 } = req.body;

  if (cargo5) cargos[5].id = cargo5;
  if (cargo10) cargos[10].id = cargo10;
  if (cargo20) cargos[20].id = cargo20;

  res.send('IDs de cargos atualizados com sucesso!');
});

// Serve o painel HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-br">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Configuração de Cargos</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
        h1 { color: #333; }
        label { display: block; margin-top: 10px; }
        input { padding: 8px; font-size: 14px; width: 100%; margin-top: 5px; }
        button { padding: 10px 15px; margin-top: 20px; font-size: 16px; background-color: #28a745; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #218838; }
      </style>
    </head>
    <body>
      <h1>Configuração de Cargos</h1>
      <form action="/update-roles" method="POST">
        <label for="cargo5">ID do Cargo Conquistador (5 convites):</label>
        <input type="text" id="cargo5" name="cargo5" value="${cargos[5].id}">
        
        <label for="cargo10">ID do Cargo Veterano (10 convites):</label>
        <input type="text" id="cargo10" name="cargo10" value="${cargos[10].id}">
        
        <label for="cargo20">ID do Cargo Lendário (20 convites):</label>
        <input type="text" id="cargo20" name="cargo20" value="${cargos[20].id}">
        
        <button type="submit">Atualizar Cargos</button>
      </form>
    </body>
    </html>
  `);
});

// Inicia o servidor Express
app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor Express rodando na porta 3000');
});

// Salva os convites a cada 30 minutos
setInterval(salvarConvites, 30 * 60 * 1000);

// Login do bot
client.login(TOKEN);
