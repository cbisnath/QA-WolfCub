const { chromium } = require("playwright");

// Converts "X minutes/hours/days ago" into total minutes
function parseAge(text) {
  const parts = text.split(" ");
  const number = parseInt(parts[0], 10);
  const unit = parts[1];

  if (unit.startsWith("minute")) return number;
  if (unit.startsWith("hour")) return number * 60;
  if (unit.startsWith("day")) return number * 60 * 24;

  return Number.MAX_SAFE_INTEGER;
}

async function sortHackerNewsArticles() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://news.ycombinator.com/newest", {
    waitUntil: "domcontentloaded",
  });

  const articles = [];

  while (articles.length < 100) {
    const rows = await page.$$("tr.athing");

    for (const row of rows) {
      if (articles.length >= 100) break;

      const title = await row.$eval(".titleline a", (el) => el.innerText);
      const ageText = await row.evaluate(
        (el) => el.nextElementSibling.querySelector(".age").innerText
      );

      articles.push({
        title,
        ageText,
        ageMinutes: parseAge(ageText),
      });
    }

    if (articles.length < 100) {
      const moreButton = await page.$("a.morelink");
      if (!moreButton) break;

      await moreButton.click();
      await page.waitForLoadState("domcontentloaded");
    }
  }

  // ✅ Validate EXACTLY 100
  if (articles.length !== 100) {
    console.error(`❌ FAIL: Expected 100 articles, found ${articles.length}`);
    await browser.close();
    process.exit(1);
  }

  // ✅ Validate sorting newest → oldest
  let sorted = true;

  for (let i = 1; i < articles.length; i++) {
    if (articles[i].ageMinutes < articles[i - 1].ageMinutes) {
      sorted = false;
      break;
    }
  }

  // ✅ Print full ordered list
  console.log("\n📰 First 100 Hacker News Articles (Newest → Oldest):\n");
  articles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title} — ${article.ageText}`);
  });

  // ✅ Final Result
  if (sorted) {
    console.log(
      "\n🎉 SUCCESS! The first 100 articles are sorted correctly (newest → oldest)."
    );
  } else {
    console.error("\n⚠️ FAIL: The articles are NOT sorted correctly.");
  }

  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();
