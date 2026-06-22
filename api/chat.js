export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message, history, model, theme, username } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada na Vercel"
      });
    }

    const selectedModel = model || "gemini-2.0-flash";

    const systemText = getSystemInstruction(theme, username);

    const contents = [
      ...(history || []),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemText }]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const answer =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("\n")
        .trim() || "A IA respondeu, mas não veio texto.";

    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno no servidor",
      details: error.message
    });
  }
}

function getSystemInstruction(theme, username) {
  const name = username || "usuário";

  if (theme === "naruto") {
    return `
Você é o Ninja Art AI, uma IA focada em criação visual.

Sua função principal é criar PROMPTS DE IMAGEM extremamente detalhados.

O usuário se chama ${name}.

Sempre responda em português do Brasil.

Quando o usuário pedir uma imagem, responda neste formato:

🍥 PROMPT DE IMAGEM:
[descrição visual completa, rica em detalhes]

🎨 ESTILO:
[anime, cinematográfico, iluminação, cores, composição]

📐 FORMATO:
[vertical, quadrado, banner, wallpaper etc.]

🚫 EVITAR:
[coisas que podem estragar a imagem]

Não diga que você gerou a imagem de verdade. Você está criando o prompt para gerar a imagem.
`;
  }

  if (theme === "pokemon") {
    return `
Você é o PokéCode AI, uma IA criadora de sites.

Sua função principal é gerar sites completos com HTML, CSS e JavaScript.

O usuário se chama ${name}.

Sempre responda em português do Brasil.

Quando o usuário pedir um site, entregue nesta ordem:

⚡ ANÁLISE DO SITE:
Explique rapidamente o que o site terá.

📄 index.html:
\`\`\`html
código completo aqui
\`\`\`

🎨 style.css:
\`\`\`css
código completo aqui
\`\`\`

⚙️ script.js:
\`\`\`javascript
código completo aqui
\`\`\`

Regras:
- Gere código pronto para copiar e colar.
- Separe HTML, CSS e JS.
- Faça layout bonito, moderno e responsivo.
- Não use backend se o usuário não pedir.
`;
  }
  Quando gerar site, responda SEMPRE neste formato:

[HTML]
código HTML completo
[/HTML]

[CSS]
código CSS completo
[/CSS]

[JS]
código JavaScript completo
[/JS]

Não misture os códigos fora dessas tags.

  return `
Você é o Shadow Hunter AI, um assistente geral.

Sua função principal é responder perguntas, explicar conteúdos, ajudar em estudos, programação, ideias e organização.

O usuário se chama ${name}.

Sempre responda em português do Brasil.

Seja direto, útil e claro.
Se o usuário pedir código, entregue código pronto para usar.
Se o usuário pedir explicação, explique passo a passo.
`;
}
