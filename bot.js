require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = 'SEU_CLIENT_ID';
const CHANNEL_ID = 'SEU_CANAL_ID';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/c/SEU_CANAL';

const invitesDBPath = './invites.json';
let inviteCounts = {};
let previousInvites = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

if (fs.existsSync(invitesDBPath)) {
  inviteCounts = JSON.parse(fs.readFileSync(invitesDBPath));
}

const commands = [
  new SlashCommandBuilder().setName('conquistas').setDescription('Veja quantas pessoas você convidou'),
  new SlashCommandBuilder().setName('chanel').setDescription('Veja o canal do YouTube do bot'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Informações do servidor'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Informações do seu perfil'),
  new SlashCommandBuilder().setName('help').setDescription('Lista de comandos disponíveis'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados.');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);
  await carregarConvites();
});

async function carregarConvites() {
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch().catch(() => []);
    const inviteMap = new Map();
    invites.forEach(inv => inviteMap.set(inv.code, inv));
    previousInvites.set(guild.id, inviteMap);
  }
}

function salvarConvites() {
  fs.writeFileSync(invitesDBPath, JSON.stringify(inviteCounts, null, 2));
}

client.on('guildMemberAdd', async member => {
  const newInvites = await member.guild.invites.fetch().catch(() => []);
  const oldInvites = previousInvites.get(member.guild.id);
  const inviteUsed = newInvites.find(inv => {
    const old = oldInvites.get(inv.code);
    return old && inv.uses > old.uses;
  });

  if (inviteUsed?.inviter) {
    const inviterId = inviteUsed.inviter.id;
    inviteCounts[inviterId] = (inviteCounts[inviterId] || 0) + 1;
    salvarConvites();

    const total = inviteCounts[inviterId];
    const cargos = {
      5: 'Conquistador',
      10: 'Veterano',
      20: 'Lendário',
    };

    if (cargos[total]) {
      const role = member.guild.roles.cache.find(r => r.name === cargos[total]);
      if (role) {
        const convidador = await member.guild.members.fetch(inviterId).catch(() => null);
        if (convidador && !convidador.roles.cache.has(role.id)) {
          await convidador.roles.add(role);
          convidador.send(`Você recebeu o cargo **${cargos[total]}** por convidar ${total} pessoas!`);
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

  const total = inviteCounts[interaction.user.id] || 0;
  const canal = await client.channels.fetch(CHANNEL_ID).catch(() => null);

  if (interaction.commandName === 'conquistas') {
    if (canal) canal.send(`${interaction.user.tag} já convidou ${total} pessoa(s)!`);
    await interaction.reply({ content: `Você já convidou ${total} pessoa(s)!`, ephemeral: true });
  }

  if (interaction.commandName === 'chanel') {
    if (canal) canal.send(`Canal do YouTube: ${YOUTUBE_CHANNEL_URL}`);
    await interaction.reply({ content: `Canal do YouTube: ${YOUTUBE_CHANNEL_URL}`, ephemeral: true });
  }

  if (interaction.commandName === 'serverinfo') {
    const guild = interaction.guild;
    await interaction.reply({
      content: `Servidor: ${guild.name}\nMembros: ${guild.memberCount}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'userinfo') {
    const user = interaction.user;
    await interaction.reply({
      content: `Usuário: ${user.username}\nID: ${user.id}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'help') {
    await interaction.reply({
      content: `Comandos disponíveis:\n/conquistas\n/chanel\n/serverinfo\n/userinfo\n/help`,
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
