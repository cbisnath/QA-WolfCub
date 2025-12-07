// ========================
// Hacker News Sorter + HTML Reporter
// ========================

// Import Firefox from Playwright
const { firefox } = require("playwright");
const fs = require("fs");
const path = require("path");

// ------------------------
// Helper: Convert "X minutes/hours/days ago" into minutes
// ------------------------
function parseAge(text) {
  const parts = text.split(" ");
  const number = parseInt(parts[0], 10);
  const unit = parts[1];

  if (unit.startsWith("minute")) return number;
  if (unit.startsWith("hour")) return number * 60;
  if (unit.startsWith("day")) return number * 60 * 24;

  return Number.MAX_SAFE_INTEGER;
}

// ------------------------
// Main Function
// ------------------------
async function sortHackerNewsArticles() {
  // Launch browser safely
  const browser = await firefox.launch({
    headless: false, // Headful mode for Mac stability
    args: ["--no-sandbox"], // Avoid sandbox issues on Mac
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News "newest"
  await page.goto("https://news.ycombinator.com/newest", {
    waitUntil: "domcontentloaded",
  });

  const articles = [];

  // Scrape until 100 articles
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

    // Click "More" if we need more articles
    if (articles.length < 100) {
      const moreButton = await page.$("a.morelink");
      if (!moreButton) break;

      await moreButton.click();
      await page.waitForLoadState("domcontentloaded");
    }
  }

  // Validate EXACTLY 100 articles
  if (articles.length !== 100) {
    console.error(`❌ FAIL: Expected 100 articles, found ${articles.length}`);
    await browser.close();
    process.exit(1);
  }

  // Validate sorting newest → oldest
  let sorted = true;
  for (let i = 1; i < articles.length; i++) {
    if (articles[i].ageMinutes < articles[i - 1].ageMinutes) {
      sorted = false;
      break;
    }
  }

  // Prepare status message
  const statusText = sorted
    ? "✅ SUCCESS: Articles are correctly sorted (newest → oldest)"
    : "❌ FAIL: Articles are NOT correctly sorted";

  // ------------------------
  // Output to console
  // ------------------------
  console.log("\n📰 First 100 Hacker News Articles (Newest → Oldest):\n");
  articles.forEach((article, index) => {
    console.log(`${index + 1}. ${article.title} — ${article.ageText}`);
  });
  console.log(`\n${statusText}\n`);

  // ------------------------
  // Generate HTML Report
  // ------------------------
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Hacker News Report</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 900px; margin: auto; padding: 20px; }
      h1 { text-align: center; }
      .status { font-size: 1.5em; margin: 20px 0; }
      ol li { margin: 8px 0; }
    </style>
  </head>
  <body>
    <h1>Hacker News - First 100 Articles</h1>
    <div class="status">${statusText}</div>
    <ol>
      ${articles
        .map((article) => `<li>${article.title} — ${article.ageText}</li>`)
        .join("\n")}
    </ol>
  </body>
  </html>
  `;

  // Write HTML file
  const reportPath = path.join(__dirname, "report.html");
  fs.writeFileSync(reportPath, htmlContent, "utf-8");
  console.log(`📄 HTML report generated at: ${reportPath}`);

  // Close browser
  await browser.close();
}

// ------------------------
// Run the main function
// ------------------------
(async () => {
  try {
    await sortHackerNewsArticles();
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
})();
