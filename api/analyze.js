export default async function handler(req, res) {
  // Só aceita POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt é obrigatório" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY, // variável de ambiente segura
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Erro na API" });
    }

    // Extrai só o texto da resposta
    const text = data.content
      .map((i) => (i.type === "text" ? i.text : ""))
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Erro na API route:", err);
    return res.status(500).json({ error: "Erro interno do servidor" });
  }
}
