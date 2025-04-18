const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// Configuração do servidor Express para manter o bot ativo
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>Bot está ativo!</h1>');
});

app.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});

// IDs fornecidos por você
const CHANNEL_ID = '1362616215075291287'; // Canal para mensagens públicas
const CARGO_ID = 'ID_DO_CARGO'; // Substitua pelo ID real do cargo

client.once('ready', () => {
  console.log(`Logado como ${client.user.tag}`);
});

// Função para atribuir cargo e enviar mensagem pública
async function atribuirCargoEMensagemPublica(member, cargoId) {
  try {
    const cargo = member.guild.roles.cache.get(cargoId);
    if (!cargo) {
      console.error(`Cargo com ID ${cargoId} não encontrado.`);
      return;
    }

    await member.roles.add(cargo);

    const canal = await client.channels.fetch(CHANNEL_ID);
    if (!canal) {
      console.error(`Canal com ID ${CHANNEL_ID} não encontrado.`);
      return;
    }

    await canal.send(`Parabéns ${member.user}, você recebeu o cargo **${cargo.name}** por convidar novos membros!`);
  } catch (error) {
    console.error('Erro ao atribuir cargo e enviar mensagem pública:', error);
  }
}

// Evento para quando um novo membro entra no servidor
client.on('guildMemberAdd', async member => {
  // Aqui você deve implementar a lógica para verificar se o membro foi convidado por alguém
  // e quantos convites essa pessoa já fez

  // Supondo que a lógica determine que o membro deve receber um cargo
  await atribuirCargoEMensagemPublica(member, CARGO_ID);
});

client.login('SEU_TOKEN_DO_BOT');
