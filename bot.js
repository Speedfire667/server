require('dotenv').config(); const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.TOKEN; const CLIENT_ID = '1362610823305887844'; const CHANNEL_ID = '1362616215075291287'; const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/c/SEU_CANAL';

const inviteCounts = new Map(); let previousInvites = new Map();

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildInvites, ], });

const cargos = { 5: 'Conquistador', 10: 'Veterano', 20: 'Lendário', };

const commands = [ new SlashCommandBuilder().setName('conquistas').setDescription('Veja quantas pessoas você convidou'), new SlashCommandBuilder().setName('missao').setDescription('Veja seu progresso de conquistas'), new SlashCommandBuilder().setName('chanel').setDescription('Veja o canal do YouTube do bot'), new SlashCommandBuilder().setName('userinfo').setDescription('Informações sobre um usuário').addUserOption(opt => opt.setName('user').setDescription('Usuário').setRequired(true)), new SlashCommandBuilder().setName('serverinfo').setDescription('Informações sobre o servidor'), new SlashCommandBuilder().setName('help').setDescription('Lista de comandos disponíveis'), new SlashCommandBuilder().setName('rank').setDescription('Mostra quem mais convidou'), new SlashCommandBuilder().setName('meucargo').setDescription('Veja seu cargo atual por convites'), new SlashCommandBuilder().setName('convites').setDescription('Mostra contagem de convites por usuário'), new SlashCommandBuilder().setName('regras').setDescription('Veja as regras do servidor'), ].map(cmd => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN); (async () => { await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands }); })();

client.once('ready', async () => { console.log(Logado como ${client.user.tag}); await carregarConvites(); });

async function carregarConvites() { for (const guild of client.guilds.cache.values()) { const invites = await guild.invites.fetch(); const inviteMap = new Map(); invites.forEach(inv => inviteMap.set(inv.code, inv)); previousInvites.set(guild.id, inviteMap); } }

client.on('guildMemberAdd', async member => { const newInvites = await member.guild.invites.fetch(); const oldInvites = previousInvites.get(member.guild.id); const inviteUsed = newInvites.find(inv => { const old = oldInvites.get(inv.code); return old && inv.uses > old.uses; }); if (inviteUsed?.inviter) { const inviterId = inviteUsed.inviter.id; const current = inviteCounts.get(inviterId) || 0; const total = current + 1; inviteCounts.set(inviterId, total);

if (cargos[total]) {
  const role = member.guild.roles.cache.find(r => r.name === cargos[total]);
  if (role) {
    const convidador = await member.guild.members.fetch(inviterId).catch(() => null);
    if (convidador && !convidador.roles.cache.has(role.id)) {
      await convidador.roles.add(role);
      convidador.send(`Você ganhou o cargo **${cargos[total]}** por convidar ${total} pessoas!`).catch(() => {});
    }
  }
}

} const updatedMap = new Map(); newInvites.forEach(inv => updatedMap.set(inv.code, inv)); previousInvites.set(member.guild.id, updatedMap); });

client.on('interactionCreate', async interaction => { if (!interaction.isChatInputCommand()) return; const { commandName, user, guild, options } = interaction;

const total = inviteCounts.get(user.id) || 0;

if (commandName === 'conquistas') { await interaction.reply({ content: Você já convidou **${total}** pessoa(s)., ephemeral: true }); } else if (commandName === 'missao') { const metas = Object.keys(cargos).map(n => **${n}** convites = ${cargos[n]}).join('\n'); await interaction.reply({ content: Sua missão:\nVocê convidou **${total}** pessoas.\n\n${metas}, ephemeral: true }); } else if (commandName === 'chanel') { await interaction.reply({ content: Canal do YouTube: ${YOUTUBE_CHANNEL_URL}, ephemeral: true }); } else if (commandName === 'userinfo') { const target = options.getUser('user'); await interaction.reply({ content: Usuário: ${target.tag}\nID: ${target.id}, ephemeral: true }); } else if (commandName === 'serverinfo') { await interaction.reply({ content: Servidor: ${guild.name}\nID: ${guild.id}\nMembros: ${guild.memberCount}, ephemeral: true }); } else if (commandName === 'help') { await interaction.reply({ content: **Comandos disponíveis:**\n/conquistas - Ver quantos convites você fez\n/missao - Veja suas metas de convite\n/chanel - Link do YouTube\n/userinfo - Info de usuário\n/serverinfo - Info do servidor\n/rank - Top convites\n/meucargo - Seu cargo atual\n/convites - Quantidade por usuário\n/regras - Regras do servidor, ephemeral: true }); } else if (commandName === 'rank') { const ranking = [...inviteCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5); const texto = ranking.map(([id, count], i) => ${i + 1}. <@${id}>: ${count} convites).join('\n'); await interaction.reply({ content: **Top convites:**\n${texto || 'Ninguém ainda convidou.'}, ephemeral: true }); } else if (commandName === 'meucargo') { let cargoAtual = 'Nenhum'; for (const [num, nome] of Object.entries(cargos)) { if (total >= parseInt(num)) cargoAtual = nome; } await interaction.reply({ content: Seu cargo atual é: **${cargoAtual}**, ephemeral: true }); } else if (commandName === 'convites') { const linhas = [...inviteCounts.entries()].map(([id, c]) => <@${id}>: ${c}).join('\n'); await interaction.reply({ content: Convites registrados:\n${linhas || 'Nenhum convite ainda.'}, ephemeral: true }); } else if (commandName === 'regras') { await interaction.reply({ content: **Regras do servidor:**\n1. Sem spam\n2. Respeite todos\n3. Use os canais certos, ephemeral: true }); } });

client.login(TOKEN);

  
