const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modelSelect = document.getElementById("model");
const siteTitle = document.getElementById("siteTitle");
const siteSubtitle = document.getElementById("siteSubtitle");
const sendBtn = document.querySelector(".send-btn");

const STORAGE_KEY = "animeGeminiChatSalvo";

let historico = [];
let temaAtual = "solo";

const temas = {
  solo: {
    bodyClass: "theme-solo",
    title: "Shadow Hunter AI",
    subtitle: "Sistema das Sombras · Solo Leveling",
    button: "INVOCAR ⚔️",
    welcome: `⚔️ SISTEMA INICIADO

Você despertou como caçador.
Faça sua pergunta e eu responderei como seu assistente das sombras.`,
    quicks: [
      "Explique esse projeto como um sistema de rank S",
      "Crie uma frase estilo Solo Leveling",
      "Me dê uma ideia de site dark"
    ],
    labels: ["Rank S", "Frase sombria", "Site dark"]
  },

  naruto: {
    bodyClass: "theme-naruto",
    title: "Chakra Shinobi AI",
    subtitle: "Modo Shinobi · Naruto",
    button: "USAR JUTSU 🍥",
    welcome: `🍥 MODO SHINOBI ATIVADO

Bem-vindo à vila.
Mande sua pergunta e eu respondo como seu sensei.`,
    quicks: [
      "Crie uma frase de ninja determinada",
      "Me explique esse projeto como um sensei",
      "Crie uma ideia de site com chakra"
    ],
    labels: ["Frase ninja", "Sensei", "Chakra site"]
  },

  pokemon: {
    bodyClass: "theme-pokemon",
    title: "PokéDex Gemini",
    subtitle: "Pokédex Online · Pokémon",
    button: "CAPTURAR ⚡",
    welcome: `⚡ POKÉDEX ONLINE

Sistema pronto para batalha.
Digite sua pergunta para registrar uma nova resposta.`,
    quicks: [
      "Crie uma ideia de site Pokémon",
      "Me explique esse projeto como uma Pokédex",
      "Crie uma frase de treinador Pokémon"
    ],
    labels: ["Site Pokémon", "Pokédex", "Treinador"]
  }
};

window.addEventListener("DOMContentLoaded", () => {
  carregarChatSalvo();
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  await callGemini(text);
});

function setTheme(theme) {
  temaAtual = theme;

  document.body.classList.remove(
    "theme-solo",
    "theme-naruto",
    "theme-pokemon"
  );

  const config = temas[theme];

  document.body.classList.add(config.bodyClass);
  siteTitle.textContent = config.title;
  siteSubtitle.textContent = config.subtitle;
  sendBtn.textContent = config.button;

  updateQuickButtons(config);

  salvarChat();
}

function updateQuickButtons(config) {
  const quickContainer = document.querySelector(".quick");

  quickContainer.innerHTML = `
    <button type="button" onclick="quickMsg('${config.quicks[0]}')">${config.labels[0]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[1]}')">${config.labels[1]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[2]}')">${config.labels[2]}</button>
    <button type="button" onclick="clearChat()">Limpar</button>
  `;
}

function resetWelcomeMessage(message) {
  chatArea.innerHTML = `
    <div class="msg bot intro">
${message}
    </div>
  `;

  historico = [];
  salvarChat();
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  salvarChat();

  return div;
}

function addTypingMessage() {
  const div = document.createElement("div");
  div.className = "msg bot typing-msg";
  div.innerHTML = `
    <span>${getTypingText()}</span>
    <div class="typing-dots">
      <i></i><i></i><i></i>
    </div>
  `;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  return div;
}

function getTypingText() {
  if (temaAtual === "solo") return "As sombras estão respondendo";
  if (temaAtual === "naruto") return "Carregando chakra";
  if (temaAtual === "pokemon") return "Consultando a Pokédex";
  return "Gerando resposta";
}

async function callGemini(text) {
  const model = modelSelect.value;

  const loading = addTypingMessage();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        model: model,
        history: historico,
        theme: temaAtual
      })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      addMessage(
        "❌ Erro:\n" + JSON.stringify(data, null, 2),
        "bot error"
      );
      return;
    }

    historico.push({
      role: "user",
      parts: [{ text }]
    });

    historico.push({
      role: "model",
      parts: [{ text: data.answer }]
    });

    addMessage(data.answer, "bot");
    salvarChat();

  } catch (error) {
    loading.remove();

    addMessage(
      "❌ Erro ao conectar com o servidor:\n" + error.message,
      "bot error"
    );
  }
}

function quickMsg(text) {
  userInput.value = text;

  chatForm.dispatchEvent(
    new Event("submit", {
      cancelable: true,
      bubbles: true
    })
  );
}

function clearChat() {
  localStorage.removeItem(STORAGE_KEY);
  resetWelcomeMessage(temas[temaAtual].welcome);
}

function salvarChat() {
  const dados = {
    temaAtual,
    historico,
    chatHTML: chatArea.innerHTML,
    model: modelSelect.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function carregarChatSalvo() {
  const salvo = localStorage.getItem(STORAGE_KEY);

  if (!salvo) {
    setTheme("solo");
    resetWelcomeMessage(temas.solo.welcome);
    return;
  }

  try {
    const dados = JSON.parse(salvo);

    temaAtual = dados.temaAtual || "solo";
    historico = dados.historico || [];

    setTheme(temaAtual);

    if (dados.model) {
      modelSelect.value = dados.model;
    }

    if (dados.chatHTML) {
      chatArea.innerHTML = dados.chatHTML;
    } else {
      resetWelcomeMessage(temas[temaAtual].welcome);
    }

    chatArea.scrollTop = chatArea.scrollHeight;

  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    setTheme("solo");
    resetWelcomeMessage(temas.solo.welcome);
  }
}
