const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modelSelect = document.getElementById("model");
const siteTitle = document.getElementById("siteTitle");
const siteSubtitle = document.getElementById("siteSubtitle");
const sendBtn = document.querySelector(".send-btn");

const STORAGE_KEY = "animeGeminiAppV2";
let temaAtual = "solo";
let conversaAtual = null;

const temas = {
  solo: {
    bodyClass: "theme-solo",
    title: "Shadow Hunter AI",
    subtitle: "Sistema das Sombras · Solo Leveling",
    button: "INVOCAR ⚔️",
    placeholder: "Digite sua missão para o sistema...",
    avatar: "⚔️",
    typing: "Invocando sombras",
    welcome: "⚔️ SISTEMA INICIADO\n\nVocê despertou como caçador.",
    quicks: ["Explique esse projeto como rank S", "Crie uma frase sombria", "Ideia de site dark"],
    labels: ["Rank S", "Frase sombria", "Site dark"]
  },
  naruto: {
    bodyClass: "theme-naruto",
    title: "Chakra Shinobi AI",
    subtitle: "Modo Shinobi · Naruto",
    button: "USAR JUTSU 🍥",
    placeholder: "Digite sua pergunta shinobi...",
    avatar: "🍥",
    typing: "Canalizando chakra",
    welcome: "🍥 MODO SHINOBI ATIVADO\n\nBem-vindo à vila.",
    quicks: ["Crie uma frase ninja", "Explique como um sensei", "Ideia de site com chakra"],
    labels: ["Frase ninja", "Sensei", "Chakra site"]
  },
  pokemon: {
    bodyClass: "theme-pokemon",
    title: "PokéDex Gemini",
    subtitle: "Pokédex Online · Pokémon",
    button: "CAPTURAR ⚡",
    placeholder: "Digite sua pergunta de treinador...",
    avatar: "⚡",
    typing: "Consultando Pokédex",
    welcome: "⚡ POKÉDEX ONLINE\n\nSistema pronto para batalha.",
    quicks: ["Crie uma ideia Pokémon", "Explique como Pokédex", "Frase de treinador"],
    labels: ["Site Pokémon", "Pokédex", "Treinador"]
  }
};

let appData = {
  username: "",
  lastTheme: "solo",
  chats: {
    solo: [],
    naruto: [],
    pokemon: []
  }
};

document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
  prepararInterface();
  setTheme(appData.lastTheme || "solo");
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  enviarMensagem();
});

function prepararInterface() {
  criarPainelSuperior();
  criarTextarea();
  pedirNomeSeNecessario();
}

function criarPainelSuperior() {
  const config = document.querySelector(".config");

  const painel = document.createElement("div");
  painel.className = "chat-tools";
  painel.innerHTML = `
    <button type="button" onclick="novaConversa()">➕ Nova conversa</button>
    <button type="button" onclick="exportarConversa()">📄 Baixar conversa</button>
    <span id="messageCounter">Mensagens: 0</span>
    <span id="userWelcome"></span>
  `;

  config.after(painel);
}

function criarTextarea() {
  const textarea = document.createElement("textarea");
  textarea.id = "userInput";
  textarea.placeholder = userInput.placeholder;
  textarea.autocomplete = "off";

  userInput.replaceWith(textarea);

  window.userInput = textarea;

  textarea.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      enviarMensagem();
    }
  });
}

function pedirNomeSeNecessario() {
  if (!appData.username) {
    const nome = prompt("Qual seu nome?");
    appData.username = nome?.trim() || "Treinador";
    salvarDados();
  }

  document.getElementById("userWelcome").textContent = `Olá, ${appData.username}`;
}

function setTheme(theme) {
  salvarConversaAtual();

  temaAtual = theme;
  appData.lastTheme = theme;

  document.body.classList.remove("theme-solo", "theme-naruto", "theme-pokemon");

  const config = temas[theme];

  document.body.classList.add(config.bodyClass);
  siteTitle.textContent = config.title;
  siteSubtitle.textContent = config.subtitle;
  sendBtn.textContent = config.button;
  document.getElementById("userInput").placeholder = config.placeholder;

  updateQuickButtons(config);
  carregarOuCriarConversa(theme);
  renderThemeFX(theme);
  salvarDados();
}

function carregarOuCriarConversa(theme) {
  if (!appData.chats[theme]) appData.chats[theme] = [];

  if (appData.chats[theme].length === 0) {
    criarNovaConversa(theme);
  }

  conversaAtual = appData.chats[theme][appData.chats[theme].length - 1];
  renderizarConversa();
}

function criarNovaConversa(theme) {
  const nova = {
    id: Date.now(),
    title: `Conversa ${appData.chats[theme].length + 1}`,
    messages: [
      {
        role: "bot",
        text: temas[theme].welcome,
        intro: true
      }
    ],
    historico: []
  };

  appData.chats[theme].push(nova);
  conversaAtual = nova;
  salvarDados();
}

function novaConversa() {
  criarNovaConversa(temaAtual);
  renderizarConversa();
}

function renderizarConversa() {
  chatArea.innerHTML = "";

  conversaAtual.messages.forEach(msg => {
    addMessageToScreen(msg.text, msg.role, false, msg.intro);
  });

  atualizarContador();
  chatArea.scrollTop = chatArea.scrollHeight;
}

function updateQuickButtons(config) {
  const quickContainer = document.querySelector(".quick");

  quickContainer.innerHTML = `
    <button type="button" onclick="quickMsg('${config.quicks[0]}')">${config.labels[0]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[1]}')">${config.labels[1]}</button>
    <button type="button" onclick="quickMsg('${config.quicks[2]}')">${config.labels[2]}</button>
    <button type="button" onclick="limparTema()">Limpar tema</button>
  `;
}

function addMessage(text, role, intro = false) {
  conversaAtual.messages.push({ role, text, intro });
  addMessageToScreen(text, role, true, intro);
  salvarDados();
}

function addMessageToScreen(text, role, scroll = true, intro = false) {
  const div = document.createElement("div");
  div.className = `msg ${role} ${intro ? "intro" : ""}`;

  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "👤" : temas[temaAtual].avatar;

  const content = document.createElement("span");
  content.textContent = text;

  div.appendChild(avatar);
  div.appendChild(content);

  chatArea.appendChild(div);

  if (scroll) chatArea.scrollTop = chatArea.scrollHeight;

  atualizarContador();
  return div;
}

function addTypingMessage() {
  const div = document.createElement("div");
  div.className = "msg bot typing-msg";
  div.innerHTML = `
    <span class="avatar">${temas[temaAtual].avatar}</span>
    <span>${temas[temaAtual].typing}</span>
    <div class="typing-dots">
      <i></i><i></i><i></i>
    </div>
  `;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;

  return div;
}

async function enviarMensagem() {
  const input = document.getElementById("userInput");
  const text = input.value.trim();
  if (!text) return;

  addMessage(text, "user");
  input.value = "";

  await callGemini(text);
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
        model,
        history: conversaAtual.historico,
        theme: temaAtual,
        username: appData.username
      })
    });

    const data = await response.json();
    loading.remove();

   if (!response.ok) {

    let mensagemErro = "⚠️ Erro ao conectar com a IA.";

    if (data?.error?.code === 429) {
        mensagemErro = "🚫 Limite diário da API atingido. Tente novamente mais tarde.";
    }

    addMessage(mensagemErro, "bot");
    return;
}

    conversaAtual.historico.push({
      role: "user",
      parts: [{ text }]
    });

    conversaAtual.historico.push({
      role: "model",
      parts: [{ text: data.answer }]
    });

    addMessage(data.answer, "bot");
    salvarDados();

  } catch (error) {
    loading.remove();
    addMessage("❌ Erro ao conectar com o servidor:\n" + error.message, "bot");
  }
}

function quickMsg(text) {
  document.getElementById("userInput").value = text;
  enviarMensagem();
}

function limparTema() {
  appData.chats[temaAtual] = [];
  criarNovaConversa(temaAtual);
  renderizarConversa();
  salvarDados();
}

function exportarConversa() {
  const texto = conversaAtual.messages
    .map(msg => `${msg.role === "user" ? appData.username : siteTitle.textContent}: ${msg.text}`)
    .join("\n\n");

  const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${temaAtual}-conversa.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

function atualizarContador() {
  const counter = document.getElementById("messageCounter");
  if (!counter || !conversaAtual) return;

  const total = conversaAtual.messages.filter(m => !m.intro).length;
  counter.textContent = `Mensagens: ${total}`;
}

function salvarConversaAtual() {
  if (!conversaAtual) return;
  salvarDados();
}

function salvarDados() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function carregarDados() {
  const salvo = localStorage.getItem(STORAGE_KEY);

  if (!salvo) return;

  try {
    appData = JSON.parse(salvo);
  } catch {
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

function clearChat() {
  limparTema();
}
