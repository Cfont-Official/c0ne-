import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const app = express();
app.use(express.static("public"));

const DDG = "https://duckduckgo.com/html/?q=";

// ---- DuckDuckGo Search Proxy ----
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const url = DDG + encodeURIComponent(q);

    const response = await fetch(url);
    const html = await response.text();

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const links = doc.querySelectorAll("a.result__a");

    links.forEach(a => {
      if (a.href.startsWith("http")) {
        a.href = "/proxy?url=" + encodeURIComponent(a.href);
      }
    });

    res.send(dom.serialize());
  } catch (err) {
    console.error(err);
    res.status(500).send("DuckDuckGo search failed.");
  }
});

// ---- Website Iframe Proxy ----
app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.send("No URL provided.");

  // Allow iframe embedding
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "");

  res.send(`
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;">
      <iframe src="${url}" style="width:100vw;height:100vh;border:none;"></iframe>
    </body>
    </html>
  `);
});

// ---- Render Port Binding ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
