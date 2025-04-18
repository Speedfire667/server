require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const YOUTUBE_CHANNEL = 'https://youtube.com/seu_canal'; // Coloque seu link aqui
const CHANNEL_ID = '1362616215075291287'; // Substitua pelo ID do canal permitido

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

const inviteCounts = new Map();
let previousInvites = new Map();

client.once('ready', async () => {
    console.log(`Bot está online como ${client.user.tag}`);
    await loadInvites();
});

async function loadInvites() {
    for (const guild of client.guilds.cache.values()) {
        const invites = await guild.invites.fetch();
        const codeMap = new Map();
        invites.forEach(inv => codeMap.set(inv.code, inv));
        previousInvites.set(guild.id, codeMap);
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

        if (total === 5) {
            const role = member.guild.roles.cache.find(r => r.name === 'Conquistador');
            if (role) {
                const inviterMember = await member.guild.members.fetch(inviterId).catch(() => null);
                if (inviterMember && !inviterMember.roles.cache.has(role.id)) {
                    await inviterMember.roles.add(role);
                    inviterMember.send('Parabéns! Você ganhou o cargo **Conquistador** por convidar 5 pessoas!');
                }
            }
        }
    }

    const updatedMap = new Map();
    newInvites.forEach(inv => updatedMap.set(inv.code, inv));
    previousInvites.set(member.guild.id, updatedMap);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (message.channel.id !== CHANNEL_ID) return; // Ignora comandos fora do canal permitido

    const msg = message.content.toLowerCase();

    if (msg === '!help') {
        message.channel.send(`**Comandos disponíveis:**
- \`!channel\` → Link do canal do YouTube
- \`!archiciemnt\` → Veja quantas pessoas você convidou
- \`!help\` → Mostra esta mensagem`);
    }

    if (msg === '!channel') {
        message.channel.send(`Confira o canal do YouTube: ${YOUTUBE_CHANNEL}`);
    }

    if (msg === '!archiciemnt') {
        const total = inviteCounts.get(message.author.id) || 0;
        try {
            await message.author.send(`Você já convidou **${total}** pessoa(s)!`);
            message.reply('Te enviei uma DM com suas conquistas!');
        } catch {
            message.reply('Não consegui te mandar DM. Ative suas mensagens privadas.');
        }
    }
});

client.login(process.env.TOKEN);
