require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1362610823305887844';
const CHANNEL_ID = '1362616215075291287';
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/c/SEU_CANAL';

const inviteCounts = new Map();
let previousInvites = new Map();

const cargos = {
  5: 'Conquistador',
  10: 'Veterano',
  20: 'Lendário',
};

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

  // Carrega JSON salvo anteriormente (para manter contagem após reinício)
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

    // Atribui cargo com base no total de convites
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
    const canal = await client.channels.fetch(CHANNEL_ID);
    canal.send(`**${interaction.user.tag}** já convidou **${total}** pessoa(s)!`);

    await interaction.reply({
      content: `Você já convidou **${total}** pessoa(s)!`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'chanel') {
    const canal = await client.channels.fetch(CHANNEL_ID);
    canal.send(`Aqui está o link para o canal do YouTube: ${YOUTUBE_CHANNEL_URL}`);

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

// Mini servidor Express só para manter online no Render
const app = express();
app.get('/', (req, res) => {
  res.send('<h1>Bot rodando com sucesso!</h1>');
});
app.listen(process.env.PORT || 3000, () => {
  console.log('Servidor web iniciado');
});

client.login(TOKEN);
