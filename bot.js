const { Client, GatewayIntentBits } = require('discord.js');

const TOKEN = 'MTM2MjYxMDgyMzMwNTg4Nzg0NA.GgStZ-.dUCw2V_0M5W_3FJ8qufZdJ39V5fJVSkFJuoMoY';
const YOUTUBE_CHANNEL = 'https://youtube.com/seu_canal';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites
    ]
});

const inviteCounts = new Map(); // Armazena número de convites por usuário
let previousInvites = new Map(); // Para rastrear mudanças

client.once('ready', async () => {
    console.log(`Bot está online como ${client.user.tag}`);
    await loadInvites();
});

async function loadInvites() {
    client.guilds.cache.forEach(async guild => {
        const invites = await guild.invites.fetch();
        const codeMap = new Map();
        invites.forEach(inv => codeMap.set(inv.code, inv));
        previousInvites.set(guild.id, codeMap);
    });
}

// Atualizar convites sempre que alguém entrar
client.on('guildMemberAdd', async member => {
    const invites = await member.guild.invites.fetch();
    const oldInvites = previousInvites.get(member.guild.id);

    const inviter = invites.find(inv => {
        const old = oldInvites.get(inv.code);
        return old && inv.uses > old.uses;
    });

    if (inviter?.inviter) {
        const userId = inviter.inviter.id;
        const current = inviteCounts.get(userId) || 0;
        inviteCounts.set(userId, current + 1);

        // Dar cargo se chegou a 5
        if (current + 1 === 5) {
            const role = member.guild.roles.cache.find(role => role.name === 'Conquistador');
            const userMember = await member.guild.members.fetch(userId);
            if (role && userMember) {
                userMember.roles.add(role);
                userMember.send(`Parabéns! Você ganhou o cargo **Conquistador** por convidar 5 pessoas!`);
            }
        }
    }

    // Atualizar cache de convites
    const newMap = new Map();
    invites.forEach(inv => newMap.set(inv.code, inv));
    previousInvites.set(member.guild.id, newMap);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const msg = message.content.toLowerCase();

    if (msg === '!help') {
        message.channel.send(`**Comandos disponíveis:**
- \`!channel\` → Link do canal do YouTube
- \`!archiciemnt\` → Veja quantas pessoas você convidou
- \`!help\` → Mostra essa mensagem`);
    }

    if (msg === '!channel') {
        message.channel.send(`Confira meu canal: ${YOUTUBE_CHANNEL}`);
    }

    if (msg === '!archiciemnt') {
        const userId = message.author.id;
        const total = inviteCounts.get(userId) || 0;
        message.author.send(`Você já convidou **${total}** pessoa(s).`);
        message.reply('Te enviei uma mensagem privada com suas conquistas!');
    }
});

client.login(TOKEN);
