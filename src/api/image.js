export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "query fehlt" });

    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    const GOOGLE_CX = process.env.GOOGLE_CX;

    // Erst mit spezifischen Fashion-Seiten suchen
    const siteFilter = "site:vinted.de OR site:stockx.com OR site:goat.com OR site:depop.com";
    const searchQuery = `${query} ${siteFilter}`;

    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=3&imgSize=medium&safe=active`;

    const response = await fetch(url);
    const data = await response.json();

    let images = (data.items || []).map((item) => ({
      url: item.link,
      source: item.displayLink,
      title: item.title,
    }));

    // Fallback: falls keine Bilder gefunden → ohne site-Filter nochmal suchen
    if (images.length === 0) {
      const fallbackUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query + " fashion product")}&searchType=image&num=1&imgSize=medium&safe=active`;
      const fallbackRes = await fetch(fallbackUrl);
      const fallbackData = await fallbackRes.json();
      images = (fallbackData.items || []).map((item) => ({
        url: item.link,
        source: item.displayLink,
        title: item.title,
      }));
    }

    return res.status(200).json({ images });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
