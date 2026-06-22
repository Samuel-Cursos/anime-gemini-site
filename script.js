const chatForm = document.getElementById("chatForm");
let userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modelSelect = document.getElementById("model");
const siteTitle = document.getElementById("siteTitle");
const siteSubtitle = document.getElementById("siteSubtitle");
const sendBtn = document.querySelector(".send-btn");

const STORAGE_KEY = "animeGeminiAppV3";
let temaAtual = "solo";

const temas = {
  solo: {
    bodyClass: "theme-solo",
    title: "Shadow Hunter AI",
    subtitle: "Assistente IA · Responde perguntas",
    button: "PERGUNTAR ⚔️",
    placeholder: "Digite sua pergunta...",
    avatar: "⚔️",
    typing: "Pensando como o sistema",
    welcome: "⚔️ MODO ASSISTENTE ATIVADO\n\nFaça perguntas, peça explicações, estudos ou códigos.",
    quicks: ["Explique HTML e CSS", "Me ajude a estudar matemática", "Crie um código simples"],
    labels: ["Explicar", "Estudar", "Código"]
  },
  naruto: {
    bodyClass: "theme-naruto",
    title: "Ninja Art AI",
    subtitle: "Gerador de imagens · Naruto",
    button: "CRIAR ARTE 🍥",
    placeholder: "Descreva a imagem que você quer criar...",
    avatar: "🍥",
    typing: "Criando prompt visual",
    welcome: "🍥 MODO IMAGEM ATIVADO\n\nDescreva uma imagem e eu crio um prompt detalhado para gerar arte.",
    quicks: ["Crie um ninja sombrio com chakra azul", "Crie uma logo anime para uma loja", "Crie um wallpaper de batalha ninja"],
    labels: ["Ninja", "Logo", "Wallpaper"]
  },
  pokemon: {
    bodyClass: "theme-pokemon",
    title: "PokéCode AI",
    subtitle: "Criador de sites · Pokémon",
    button: "GERAR SITE ⚡",
    placeholder: "Descreva o site que você quer criar...",
    avatar: "⚡",
    typing: "Montando site",
    welcome: "⚡ MODO CRIADOR DE SITES\n\nDescreva uma empresa, loja ou ideia e eu gero HTML, CSS e JS.",
    quicks: ["Crie um site para uma pizzaria", "Crie uma landing page para academia", "Crie um site para salgados"],
    labels: ["Pizzaria", "Academia", "Salgados"]
  }
};

let appData = {
  username: "",
  lastTheme: "solo",
  activeChatByTheme: {
    solo: null,
    naruto: null,
    pokemon: null
  },
  chats: {
    solo: [],
    naruto: [],
    pokemon: []
  }
};

document.addEventListener("DOMContentLoaded", () => {
  carregarDados();
  normalizarDados();
  prepararInterface();
  setTheme(appData.lastTheme || "solo");
});

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  enviarMensagem();
});

function prepararInterface() {
  criarSidebar();
  criarPainelSuperior();
  transformarInputEmTextarea();
  pedirNomeSeNecessario();
}

function criarSidebar() {
  if (document.getElementById("conversationSidebar")) return;

  const sidebar = document.createElement("aside");
  sidebar.className = "conversation-sidebar";
  sidebar.id = "conversationSidebar";

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <strong>💬 Conversas</strong>
      <button type="button" onclick="toggleSidebar()">✕</button>
    </div>

    <button class="sidebar-new" type="button" onclick="novaConversa()">➕ Nova conversa</button>

    <div class="conversation-list" id="conversationList"></div>
  `;

  document.body.appendChild(sidebar);

  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  overlay.id = "sidebarOverlay";
  overlay.onclick = toggleSidebar;

  document.body.appendChild(overlay);
}

function criarPainelSuperior() {
  const config = document.querySelector(".config");

  const painelAntigo = document.querySelector(".chat-tools");
  if (painelAntigo) painelAntigo.remove();

  const painel = document.createElement("div");
  painel.className = "chat-tools";
  painel.innerHTML = `
    <button type="button" onclick="toggleSidebar()">☰ Conversas</button>
    <button type="button" onclick="novaConversa()">➕ Nova conversa</button>
    <span id="messageCounter">Mensagens: 0</span>
    <span id="userWelcome"></span>
  `;

  config.after(painel);
}

function transformarInputEmTextarea() {
  if (userInput.tagName.toLowerCase() === "textarea") return;

  const textarea = document.createElement("textarea");
  textarea.id = "userInput";
  textarea.placeholder = userInput.placeholder;
  textarea.autocomplete = "off";

  userInput.replaceWith(textarea);
  userInput = textarea;

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
    appData.username = nome?.trim() || "Usuário";
    salvarDados();
  }

  const userWelcome = document.getElementById("userWelcome");
  if (userWelcome) userWelcome.textContent = `Olá, ${appData.username}`;
}

function setTheme(theme) {
  temaAtual = theme;
  appData.lastTheme = theme;

  document.body.classList.remove("theme-solo", "theme-naruto", "theme-pokemon");

  const config = temas[theme];

  document.body.classList.add(config.bodyClass);
  siteTitle.textContent = config.title;
  siteSubtitle.textContent = config.subtitle;
  sendBtn.textContent = config.button;
  userInput.placeholder = config.placeholder;

  updateQuickButtons(config);
  garantirConversaAtiva();
  renderizarConversa();
  renderizarListaConversas();
  renderThemeFX(theme);
  salvarDados();
}

function garantirConversaAtiva() {
  const lista = appData.chats[temaAtual];

  if (lista.length === 0) {
    criarConversa(temaAtual);
  }

  const ativa = appData.activeChatByTheme[temaAtual];
  const existe = lista.some(chat => chat.id === ativa);

  if (!existe) {
    appData.activeChatByTheme[temaAtual] = lista[lista.length - 1].id;
  }
}

function criarConversa(theme) {
  const numero = appData.chats[theme].length + 1;

  const nova = {
    id: Date.now() + Math.floor(Math.random() * 9999),
    title: `Conversa ${numero}`,
    createdAt: new Date().toISOString(),
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
  appData.activeChatByTheme[theme] = nova.id;

  salvarDados();
  return nova;
}

function novaConversa() {
  criarConversa(temaAtual);
  renderizarConversa();
  renderizarListaConversas();
  fecharSidebarNoMobile();
}

function conversaAtual() {
  const lista = appData.chats[temaAtual];
  const activeId = appData.activeChatByTheme[temaAtual];

  return lista.find(chat => chat.id === activeId) || lista[lista.length - 1];
}

function selecionarConversa(id) {
  appData.activeChatByTheme[temaAtual] = id;
  renderizarConversa();
  renderizarListaConversas();
  salvarDados();
  fecharSidebarNoMobile();
}

function renomearConversa(id) {
  const chat = appData.chats[temaAtual].find(c => c.id === id);
  if (!chat) return;

  const novoNome = prompt("Novo nome da conversa:", chat.title);
  if (!novoNome || !novoNome.trim()) return;

  chat.title = novoNome.trim();
  renderizarListaConversas();
  salvarDados();
}

function excluirConversa(id) {
  const lista = appData.chats[temaAtual];

  if (lista.length <= 1) {
    alert("Você precisa ter pelo menos uma conversa.");
    return;
  }

  const confirmar = confirm("Excluir esta conversa?");
  if (!confirmar) return;

  appData.chats[temaAtual] = lista.filter(chat => chat.id !== id);

  if (appData.activeChatByTheme[temaAtual] === id) {
    const novaAtiva = appData.chats[temaAtual][appData.chats[temaAtual].length - 1];
    appData.activeChatByTheme[temaAtual] = novaAtiva.id;
  }

  renderizarConversa();
  renderizarListaConversas();
  salvarDados();
}

function renderizarListaConversas() {
  const container = document.getElementById("conversationList");
  if (!container) return;

  const lista = appData.chats[temaAtual];
  const activeId = appData.activeChatByTheme[temaAtual];
  const avatar = temas[temaAtual].avatar;

  container.innerHTML = "";

  lista.slice().reverse().forEach(chat => {
    const item = document.createElement("div");
    item.className = "conversation-item" + (chat.id === activeId ? " active" : "");

    item.innerHTML = `
      <button class="conversation-open" type="button" onclick="selecionarConversa(${chat.id})">
        <span>${avatar}</span>
        <span>${escapeHTML(chat.title)}</span>
      </button>

      <div class="conversation-actions">
        <button type="button" onclick="renomearConversa(${chat.id})">✏️</button>
        <button type="button" onclick="excluirConversa(${chat.id})">🗑️</button>
      </div>
    `;

    container.appendChild(item);
  });
}

function renderizarConversa() {
  const chat = conversaAtual();
  if (!chat) return;

  chatArea.innerHTML = "";

  chat.messages.forEach(msg => {
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
    <button type="button" onclick="limparConversaAtual()">Limpar conversa</button>
  `;
}

function addMessage(text, role, intro = false) {
  const chat = conversaAtual();

  chat.messages.push({ role, text, intro });

  addMessageToScreen(text, role, true, intro);
  atualizarTituloAutomatico(text);
  renderizarListaConversas();
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
  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  await callGemini(text);
}

async function callGemini(text) {
  const model = modelSelect.value;
  const loading = addTypingMessage();
  const chat = conversaAtual();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        model,
        history: chat.historico,
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

    chat.historico.push({
      role: "user",
      parts: [{ text }]
    });

    chat.historico.push({
      role: "model",
      parts: [{ text: data.answer }]
    });

    addMessage(data.answer, "bot");
    salvarDados();

  } catch (error) {
    loading.remove();
    addMessage("❌ Erro ao conectar com o servidor.", "bot");
  }
}

function atualizarTituloAutomatico(text) {
  const chat = conversaAtual();
  if (!chat) return;

  const mensagensUser = chat.messages.filter(m => m.role === "user");

  if (mensagensUser.length === 1 && chat.title.startsWith("Conversa ")) {
    chat.title = text.slice(0, 28) + (text.length > 28 ? "..." : "");
  }
}

function quickMsg(text) {
  userInput.value = text;
  enviarMensagem();
}

function limparConversaAtual() {
  const chat = conversaAtual();
  if (!chat) return;

  const confirmar = confirm("Limpar apenas esta conversa?");
  if (!confirmar) return;

  chat.messages = [
    {
      role: "bot",
      text: temas[temaAtual].welcome,
      intro: true
    }
  ];

  chat.historico = [];

  renderizarConversa();
  salvarDados();
}

function atualizarContador() {
  const counter = document.getElementById("messageCounter");
  const chat = conversaAtual();

  if (!counter || !chat) return;

  const total = chat.messages.filter(m => !m.intro).length;
  counter.textContent = `Mensagens: ${total}`;
}

function toggleSidebar() {
  document.body.classList.toggle("sidebar-open");
}

function fecharSidebarNoMobile() {
  if (window.innerWidth <= 760) {
    document.body.classList.remove("sidebar-open");
  }
}

function salvarDados() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

function carregarDados() {
  const salvoV3 = localStorage.getItem(STORAGE_KEY);
  const salvoV2 = localStorage.getItem("animeGeminiAppV2");

  const salvo = salvoV3 || salvoV2;

  if (!salvo) return;

  try {
    appData = JSON.parse(salvo);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function normalizarDados() {
  if (!appData.chats) {
    appData.chats = { solo: [], naruto: [], pokemon: [] };
  }

  ["solo", "naruto", "pokemon"].forEach(theme => {
    if (!appData.chats[theme]) appData.chats[theme] = [];

    appData.chats[theme] = appData.chats[theme].map((chat, index) => ({
      id: chat.id || Date.now() + index + Math.floor(Math.random() * 9999),
      title: chat.title || `Conversa ${index + 1}`,
      createdAt: chat.createdAt || new Date().toISOString(),
      messages: chat.messages || [
        {
          role: "bot",
          text: temas[theme].welcome,
          intro: true
        }
      ],
      historico: chat.historico || []
    }));
  });

  if (!appData.activeChatByTheme) {
    appData.activeChatByTheme = {
      solo: appData.chats.solo.at(-1)?.id || null,
      naruto: appData.chats.naruto.at(-1)?.id || null,
      pokemon: appData.chats.pokemon.at(-1)?.id || null
    };
  }

  if (!appData.lastTheme) appData.lastTheme = "solo";
}

function renderThemeFX(theme) {
  const fxLayer = document.querySelector(".fx-layer");
  if (!fxLayer) return;

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

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clearChat() {
  limparConversaAtual();
}
