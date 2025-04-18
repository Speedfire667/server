require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = '1362610823305887844'; // ID do bot
const CHANNEL_ID = '1362616215075291287'; // ID do canal no servidor
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/c/SEU_CANAL'; // Substitua pelo link do seu canal

const inviteCounts = new Map();
let previousInvites = new Map();

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
  new SlashCommandBuilder().setName('userinfo').setDescription('Veja informações suas'),
  new SlashCommandBuilder().setName('serverinfo').setDescription('Veja informações do servidor')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();

client.once('ready', async () => {
  console.log(`Logado como ${client.user.tag}`);
  await carregarConvites();
});

async function carregarConvites() {
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch();
    const inviteMap = new Map();
    invites.forEach(inv => inviteMap.set(inv.code, inv));
    previousInvites.set(guild.id, inviteMap);
  }
}

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
          convidador.send(`Você ganhou o cargo **${cargos[total]}** por convidar ${total} pessoas!`);
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

  const user = interaction.user;
  const canal = await client.channels.fetch(CHANNEL_ID);

  if (interaction.commandName === 'conquistas') {
    const total = inviteCounts.get(user.id) || 0;

    await canal.send(`**${user.tag}** já convidou **${total}** pessoa(s)!`);
    await interaction.reply({ content: `Você já convidou **${total}** pessoa(s)!`, ephemeral: true });
  }

  if (interaction.commandName === 'chanel') {
    await canal.send(`Canal do YouTube: ${YOUTUBE_CHANNEL_URL}`);
    await interaction.reply({ content: `Aqui está o canal do YouTube: ${YOUTUBE_CHANNEL_URL}`, ephemeral: true });
  }

  if (interaction.commandName === 'userinfo') {
    await interaction.reply({
      content: `Nome: ${user.username}\nID: ${user.id}\nCriado em: ${user.createdAt.toDateString()}`,
      ephemeral: true,
    });
  }

  if (interaction.commandName === 'serverinfo') {
    const guild = interaction.guild;
    await interaction.reply({
      content: `Servidor: ${guild.name}\nID: ${guild.id}\nMembros: ${guild.memberCount}`,
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
