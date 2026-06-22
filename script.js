const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatArea = document.getElementById("chatArea");
const modelSelect = document.getElementById("model");
const siteTitle = document.getElementById("siteTitle");
const siteSubtitle = document.getElementById("siteSubtitle");

let historico = [];

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  addMessage(text, "user");
  userInput.value = "";

  await callGemini(text);
});

function setTheme(theme) {
  document.body.classList.remove("theme-solo", "theme-naruto", "theme-pokemon");

  if (theme === "solo") {
    document.body.classList.add("theme-solo");
    siteTitle.textContent = "Shadow Hunter AI";
    siteSubtitle.textContent = "Tema Solo Leveling · Chat com Gemini";
  }

  if (theme === "naruto") {
    document.body.classList.add("theme-naruto");
    siteTitle.textContent = "Chakra Shinobi AI";
    siteSubtitle.textContent = "Tema Naruto · Chat com Gemini";
  }

  if (theme === "pokemon") {
    document.body.classList.add("theme-pokemon");
    siteTitle.textContent = "PokéDex Gemini";
    siteSubtitle.textContent = "Tema Pokémon · Chat com Gemini";
  }
}

function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = "msg " + type;
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

async function callGemini(text) {
  const model = modelSelect.value;

  const loading = addMessage("⏳ Gerando resposta...", "bot");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        model: model,
        history: historico
      })
    });

    const data = await response.json();
    loading.remove();

    if (!response.ok) {
      addMessage("❌ Erro na API:\n" + JSON.stringify(data, null, 2), "bot error");
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

  } catch (error) {
    loading.remove();
    addMessage("❌ Erro ao conectar com o servidor:\n" + error.message, "bot error");
  }
}

  try {
    historico.push({
      role: "user",
      parts: [{ text }]
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: historico,
        systemInstruction: {
          parts: [{
            text: "Você é um assistente direto, criativo e útil. Responda em português do Brasil. Se o usuário pedir código, entregue código claro e pronto para usar."
          }]
        }
      })
    });

    const data = await response.json();
    loading.remove();

    if (!response.ok) {
      addMessage("❌ Erro na API:\n" + JSON.stringify(data, null, 2), "bot error");
      return;
    }

    const answer = extractGeminiText(data);

    historico.push({
      role: "model",
      parts: [{ text: answer }]
    });

    addMessage(answer, "bot");

  } catch (error) {
    loading.remove();
    addMessage("❌ Não consegui conectar com o Gemini.\n\nDetalhe: " + error.message, "bot error");
  }
}

function extractGeminiText(data) {
  try {
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map(part => part.text || "").join("\n").trim();
    return text || "O Gemini respondeu, mas não veio texto.";
  } catch {
    return "Não consegui ler a resposta:\n" + JSON.stringify(data, null, 2);
  }
}

function quickMsg(text) {
  userInput.value = text;
  chatForm.dispatchEvent(new Event("submit"));
}

function clearChat() {
  historico = [];
  chatArea.innerHTML = `
    <div class="msg bot">
Chat limpo. Pode mandar uma nova mensagem.
    </div>
  `;
}
