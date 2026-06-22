export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { message, history, model } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY não configurada na Vercel" });
    }

    const selectedModel = model || "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            ...(history || []),
            {
              role: "user",
              parts: [{ text: message }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const answer =
      data.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") ||
      "O Gemini respondeu, mas não veio texto.";

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
