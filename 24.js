const axios = require('axios');

const urls = [
  'https://icebot.onrender.com',
  'https://server-2-5brz.onrender.com',
  'https://exemplo.com/pagina2'
];

// Número de "guias" ativas
const quantidadeGuias = 5;

function cutucarGuia(url) {
  return new Promise(async (resolve) => {
    try {
      const res = await axios.get(url);
      console.log(`[${url}] Código: ${res.status}`);
    } catch (err) {
      console.log(`[${url}] Erro: ${err.message}`);
    }

    // Espera 5 segundos (como se a guia estivesse aberta)
    setTimeout(resolve, 5000);
  });
}

async function loopInfinito() {
  while (true) {
    const promessas = [];

    for (let i = 0; i < quantidadeGuias; i++) {
      const url = urls[i % urls.length]; // pega URLs de forma cíclica
      promessas.push(cutucarGuia(url));
    }

    await Promise.all(promessas); // espera todas as "guias" fecharem
  }
}

loopInfinito();
