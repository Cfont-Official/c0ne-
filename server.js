import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";

const app = express();
app.use(express.static("public"));

const DDG = "https://duckduckgo.com/html/?q=";

// ---- DuckDuckGo search proxy ----
app.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const html = await fetch(DDG + encodeURIComponent(q)).then(r => r.text());

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Rewrite all result links → proxy
    doc.querySelectorAll("a.result__a").forEach(a => {
      a.href = "/proxy?url=" + encodeURIComponent(a.href);
    });

    res.send(dom.serialize());
  } catch (e) {
    res.send("Search error: " + e);
  }
});

// ---- Iframe proxy ----
app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.send("No url provided.");

  // Allow iframe embedding
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "");

  res.send(`
    <!DOCTYPE html>
    <html><body style="margin:0;padding:0;">
    <iframe src="${url}" style="width:100vw;height:100vh;border:none;"></iframe>
    </body></html>
  `);
});

// ---- Render Port Binding ----
app.listen(process.env.PORT || 3000, () => {
  console.log("Running on Render");
});
