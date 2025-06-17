// bot_pvp_ai_demo.js
const { Client } = require('bedrock-protocol');
const Vec3 = require('vec3');
const OpenAI = require('openai');

// CONFIGURAÇÃO (EDITAR ANTES DE USAR)
const CONFIG = {
  // Conexão com o servidor
  SERVER: {
    host: 'emerald.magmanode.com',
    port: 31834,
    username: 'AI_PVP_DEMO',
    version: '1.20.0',
    offline: true
  },

  // Configuração da IA (SUBSTITUA PELA SUA CHAVE REAL)
  AI: {
    apiKey: 'sk-EXAMPLE123...substitua-isso...456EXAMPLE', // ← Alterar para sua chave!
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  }
};

// Inicialização
const client = new Client(CONFIG.SERVER);
const openai = new OpenAI({ apiKey: CONFIG.AI.apiKey });

// Estado do Bot
const bot = {
  target: null,
  combatMode: false,
  memory: [],
  lastAction: null
};

// ==================
// FUNÇÕES PRINCIPAIS
// ==================

// 1. Sistema de Decisão por IA
async function getAIDecision() {
  const prompt = `Você controla um bot PVP no Minecraft Bedrock 1.20.0.
  
Situação atual:
- Alvo: ${bot.target?.username || 'nenhum'}
- Distância: ${bot.target ? client.position.distanceTo(bot.target.position) : 'N/A'}
- Saúde: ${client.health}/20
- Última ação: ${bot.lastAction || 'nenhuma'}

Opções disponíveis:
1. attack - Atacar o alvo
2. strafe - Esquivar em movimento
3. block - Bloquear com escudo
4. retreat - Recuar
5. use_item - Usar item do inventário

Responda APENAS com o nome da ação.`;

  try {
    const response = await openai.chat.completions.create({
      model: CONFIG.AI.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });
    
    return response.choices[0].message.content.trim().toLowerCase();
  } catch (error) {
    console.error('Erro na OpenAI:', error);
    return 'attack'; // Fallback
  }
}

// 2. Executor de Ações
function executeAction(action) {
  console.log(`[AI] Executando: ${action}`);
  
  switch(action) {
    case 'attack':
      client.lookAt(bot.target.position);
      client.attack(bot.target);
      break;
      
    case 'strafe':
      const directions = ['left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      client.setControlState(direction, true);
      setTimeout(() => client.setControlState(direction, false), 600);
      break;
      
    case 'block':
      client.setControlState('sneak', true);
      setTimeout(() => client.setControlState('sneak', false), 1000);
      break;
      
    case 'retreat':
      client.setControlState('back', true);
      setTimeout(() => client.setControlState('back', false), 800);
      break;
      
    default:
      client.attack(bot.target);
  }
  
  bot.lastAction = action;
  bot.memory.push(action);
}

// ==================
// EVENTOS DO MINECRAFT
// ==================

client.on('spawn', () => {
  console.log('Bot conectado! IA ativada.');
  
  // Loop de decisão
  setInterval(async () => {
    if (!bot.target) return;
    const action = await getAIDecision();
    executeAction(action);
  }, CONFIG.AI.decisionInterval || 2000);
});

client.on('entity', (entity) => {
  if (entity.type === 'player' && entity.username !== CONFIG.SERVER.username) {
    bot.target = entity;
    console.log(`Alvo encontrado: ${entity.username}`);
  }
});

client.on('error', (err) => {
  console.error('Erro de conexão:', err);
});

// ==================
// INICIALIZAÇÃO
// ==================
console.log('Iniciando bot PVP com IA...');
console.log('Configure sua chave OpenAI no código!');
console.log('Comandos: CTRL+C para sair');
