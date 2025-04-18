require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

// DADOS DIRETOS NO CÓDIGO (substitua pelos seus):
const TOKEN = process.env.TOKEN; // Do .env
const CLIENT_ID = '1362610823305887844';  // Exemplo: 123456789012345678
const CHANNEL_ID = '1362616215075291287';  // Exemplo: 112233445566778899
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/c/SEU_CANAL'; // Substitua pelo seu link

const inviteCounts = new Map();
let previousInvites = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
  ],
});

// REGISTRA OS COMANDOS SLASH "/conquistas" e "/chanel"
const commands = [
  new SlashCommandBuilder()
    .setName('conquistas')
    .setDescription('Veja quantas pessoas você convidou'),
  new SlashCommandBuilder()
    .setName('chanel')
    .setDescription('Veja o canal do YouTube do bot'),
].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('Registrando comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });
    console.log('Comandos registrados com sucesso!');
  } catch (err) {
    console.error('Erro ao registrar comandos:', err);
  }
})();

client.once('ready', async () => {
  console.log(`Bot online como ${client.user.tag}`);
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

  // Comando /conquistas
  if (interaction.commandName === 'conquistas') {
    const total = inviteCounts.get(interaction.user.id) || 0;

    // Envia mensagem no canal fixo (CHANNEL_ID) e também no chat que chamou o comando
    const canal = await client.channels.fetch(CHANNEL_ID);

    // Mensagem no canal específico
    canal.send(`**${interaction.user.tag}** já convidou **${total}** pessoa(s)!`);

    // Resposta ephemeral só para quem usou o comando
    await interaction.reply({
      content: `Você já convidou **${total}** pessoa(s)!`,
      ephemeral: true,  // Só quem usou vê
    });
  }

  // Comando /chanel
  if (interaction.commandName === 'chanel') {
    // Envia o link do canal do YouTube no canal específico (CHANNEL_ID)
    const canal = await client.channels.fetch(CHANNEL_ID);
    canal.send(`Aqui está o link para o canal do YouTube: ${YOUTUBE_CHANNEL_URL}`);

    // Resposta ephemeral só para quem usou o comando
    await interaction.reply({
      content: `Aqui está o link para o canal do YouTube: ${YOUTUBE_CHANNEL_URL}`,
      ephemeral: true,  // Só quem usou vê
    });
  }
});

client.login(TOKEN);
