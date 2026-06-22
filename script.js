const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modelSelect = document.getElementById("model");
const siteTitle = document.getElementById("siteTitle");
const siteSubtitle = document.getElementById("siteSubtitle");
const sendBtn = document.querySelector(".send-btn");

const STORAGE_KEY = "animeGeminiChatsPorTema";

let temaAtual = "solo";

let chats = {
  solo: {
    historico: [],
    chatHTML: ""
  },
  naruto: {
    historico: [],
    chatHTML: ""
  },
  pokemon: {
    historico: [],
    chatHTML: ""
  }
};

const temas = {
  solo: {
    bodyClass: "theme-solo",
    title: "Shadow Hunter AI",
    subtitle: "Sistema das Sombras · Solo Leveling",
    button: "INVOCAR ⚔️",
    placeholder: "Digite sua missão para o sistema...",
    welcome: `⚔️ SISTEMA INICIADO

Você despertou como caçador.
Esse chat pertence ao tema Solo Leveling.`,
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
    placeholder: "Digite sua pergunta shinobi...",
    welcome: `🍥 MODO SHINOBI ATIVADO

Bem-vindo à vila.
Esse chat pertence ao tema Naruto.`,
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
    placeholder: "Digite sua pergunta de treinador...",
    welcome: `⚡ POKÉDEX ONLINE

Sistema pronto para batalha.
Esse chat pertence ao tema Pokémon.`,
    quicks: [
      "Crie uma ideia de site Pokémon",
      "Me explique esse projeto como uma Pokédex",
      "Crie uma frase de treinador Pokémon"
    ],
    labels: ["Site Pokémon", "Pokédex", "Treinador"]
  }
};

window.addEventListener("DOMContentLoaded", () => {
  carregarTudo();
  setTheme(temaAtual);
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
  salvarChatAtual();

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
  userInput.placeholder = config.placeholder;

  updateQuickButtons(config);
  carregarChatDoTema(theme);
  renderThemeFX(theme);
  salvarTudo();
}

function carregarChatDoTema(theme) {
  const chat = chats[theme];

  if (chat.chatHTML && chat.chatHTML.trim() !== "") {
    chatArea.innerHTML = chat.chatHTML;
  } else {
    chatArea.innerHTML = `
      <div class="msg bot intro">
${temas[theme].welcome}
      </div>
    `;
  }

  chatArea.scrollTop = chatArea.scrollHeight;
}

function salvarChatAtual() {
  if (!chats[temaAtual]) return;

  chats[temaAtual].chatHTML = chatArea.innerHTML;
}

function updateQuickButtons(config) {
  const quickContainer = document.querySelector(".quick");

  quickContainer.innerHTML = `
    <button type="button" onclick="quickMsg('${config.quicks[0]}')">${config.labels[0]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[1]}')">${config.labels[1]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[2]}')">${config.labels[2]}</button>
    <button type="button" onclick="clearChat()">Limpar este tema</button>
  `;
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  salvarChatAtual();
  salvarTudo();

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
        history: chats[temaAtual].historico,
        theme: temaAtual
      })
    });

    const data = await response.json();

    loading.remove();

    if (!response.ok) {
      addMessage("❌ Erro:\n" + JSON.stringify(data, null, 2), "bot error");
      return;
    }

    chats[temaAtual].historico.push({
      role: "user",
      parts: [{ text }]
    });

    chats[temaAtual].historico.push({
      role: "model",
      parts: [{ text: data.answer }]
    });

    addMessage(data.answer, "bot");

    salvarChatAtual();
    salvarTudo();

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
  chats[temaAtual] = {
    historico: [],
    chatHTML: ""
  };

  carregarChatDoTema(temaAtual);
  salvarTudo();
}

function salvarTudo() {
  salvarChatAtual();

  const dados = {
    temaAtual,
    chats,
    model: modelSelect.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

function carregarTudo() {
  const salvo = localStorage.getItem(STORAGE_KEY);

  if (!salvo) return;

  try {
    const dados = JSON.parse(salvo);

    temaAtual = dados.temaAtual || "solo";

    if (dados.chats) {
      chats = {
        solo: dados.chats.solo || { historico: [], chatHTML: "" },
        naruto: dados.chats.naruto || { historico: [], chatHTML: "" },
        pokemon: dados.chats.pokemon || { historico: [], chatHTML: "" }
      };
    }

    if (dados.model) {
      modelSelect.value = dados.model;
    }

  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}
function renderThemeFX(theme) {
  const fxLayer = document.querySelector(".fx-layer");

  const antigos = fxLayer.querySelectorAll(".dynamic-fx");
  antigos.forEach(el => el.remove());

  const efeitos = {
    solo: ["⚔️", "◆", "♛", "影", "🗡️", "◆"],
    naruto: ["🍥", "🍃", "☁️", "忍", "🔥", "🍃"],
    pokemon: ["◓", "⚡", "◒", "⭐", "⚡", "◓"]
  };

  efeitos[theme].forEach((item, index) => {
    const el = document.createElement("div");
    el.className = `dynamic-fx fx-${index}`;
    el.textContent = item;

    el.style.left = Math.random() * 90 + "%";
    el.style.top = Math.random() * 80 + "%";
    el.style.animationDelay = index * 0.6 + "s";

    fxLayer.appendChild(el);
  });
}
