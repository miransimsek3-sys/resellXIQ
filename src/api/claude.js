export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  try {
    const { messages, system, useSearch } = req.body;
    const body = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages,
      ...(system ? { system } : {}),
      ...(useSearch ? { tools: [{ type: "web_search_20250305", name: "web_search" }] } : {}),
    };
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
