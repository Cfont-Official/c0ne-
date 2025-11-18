import puppeteer from "puppeteer";

let browser;

export async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage"
      ]
    });
  }
  return browser;
}

export async function ddgSearch(query) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
    waitUntil: "networkidle2"
  });

  await page.waitForSelector(".result");

  const results = await page.evaluate(() => {
    return [...document.querySelectorAll(".result")].map(r => ({
      title: r.querySelector(".result__title")?.innerText ?? "",
      url: r.querySelector("a.result__url")?.href ?? "",
      snippet: r.querySelector(".result__snippet")?.innerText ?? ""
    }));
  });

  await page.close();
  return results;
}
