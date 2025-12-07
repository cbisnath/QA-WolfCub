// Import required modules
const { firefox } = require("playwright"); // Browser automation
const fs = require("fs"); // File system for writing HTML reports

// ---------------------- Helper Function ---------------------- //
// Converts relative timestamps like "5 minutes ago", "2 hours ago", "1 day ago"
// into total minutes so we can numerically compare articles
function parseAge(text) {
  const parts = text.split(" "); // Split "5 minutes ago" -> ["5", "minutes", "ago"]
  const number = parseInt(parts[0], 10); // Extract number
  const unit = parts[1]; // Extract unit (minutes, hours, days)

  if (unit.startsWith("minute")) return number;
  if (unit.startsWith("hour")) return number * 60;
  if (unit.startsWith("day")) return number * 60 * 24;

  // Fallback in case the format is unexpected
  return Number.MAX_SAFE_INTEGER;
}

// ---------------------- Main Function ---------------------- //
// This function scrapes the first 100 articles from Hacker News /newest
// Validates if they are sorted newest → oldest
// Generates an HTML report for human review
async function sortHackerNewsArticles() {
  // Launch Chromium browser in headless mode (no UI)
  const browser = await firefox.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to Hacker News newest page
  await page.goto("https://news.ycombinator.com/newest", {
    waitUntil: "domcontentloaded",
  });

  // Array to hold all article objects { title, ageText, ageMinutes }
  const articles = [];

  // Loop until we collect 100 articles
  while (articles.length < 100) {
    // Each article is in a <tr> with class "athing"
    const rows = await page.$$("tr.athing");

    for (const row of rows) {
      if (articles.length >= 100) break; // Stop if we already have 100

      // Extract title
      const title = await row.$eval(".titleline a", (el) => el.innerText);

      // Extract age text (e.g., "5 minutes ago")
      const ageText = await row.evaluate(
        (el) => el.nextElementSibling.querySelector(".age").innerText
      );

      // Push structured article object into array
      articles.push({
        title,
        ageText,
        ageMinutes: parseAge(ageText),
      });
    }

    // If less than 100 articles collected, click "More" button
    if (articles.length < 100) {
      const moreButton = await page.$("a.morelink");
      if (!moreButton) break; // No more pages available
      await moreButton.click();
      await page.waitForLoadState("domcontentloaded");
    }
  }

  // ---------------------- Validate Count ---------------------- //
  if (articles.length !== 100) {
    console.error(`❌ FAIL: Expected 100 articles, found ${articles.length}`);
    await browser.close();
    process.exit(1);
  }

  // ---------------------- Validate Sorting ---------------------- //
  let sorted = true;
  for (let i = 1; i < articles.length; i++) {
    if (articles[i].ageMinutes < articles[i - 1].ageMinutes) {
      sorted = false;
      break;
    }
  }

  // ---------------------- Output to Console ---------------------- //
  //   console.log("\n📰 First 100 Hacker News Articles (Newest → Oldest):\n");
  //   articles.forEach((article, index) => {
  //     console.log(`${index + 1}. ${article.title} — ${article.ageText}`);
  //   });

  if (sorted) {
    console.log(
      "\n🎉 SUCCESS! The first 100 articles are sorted correctly (newest → oldest)."
    );
  } else {
    console.error("\n⚠️ FAIL: The articles are NOT sorted correctly.");
  }

  // ---------------------- Generate HTML Report ---------------------- //
  const statusText = sorted
    ? "✅ SUCCESS: Articles are correctly sorted (newest → oldest)"
    : "❌ FAIL: Articles are NOT correctly sorted";

  // Create list items for HTML
  const articleListHTML = articles
    .map(
      (article, index) => `
      <li>
        <strong>${index + 1}.</strong> ${article.title}
        <br/>
        <em>${article.ageText}</em>
      </li>
    `
    )
    .join("");

  // Full HTML content
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Hacker News Sorting Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0f172a;
      color: #e5e7eb;
      padding: 40px;
    }
    h1 {
      color: #38bdf8;
    }
    .status {
      font-size: 20px;
      margin-bottom: 20px;
      padding: 12px;
      border-radius: 8px;
      background: ${sorted ? "#14532d" : "#7f1d1d"};
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      background: #1e293b;
      margin-bottom: 12px;
      padding: 12px;
      border-radius: 8px;
    }
  </style>
</head>
<body>

  <h1>Playwright Hacker News Test Report</h1>

  <div class="status">${statusText}</div>

  <p><strong>Test Run:</strong> ${new Date().toLocaleString()}</p>

  <h2>First 100 Articles</h2>
  <ul>
    ${articleListHTML}
  </ul>

</body>
</html>
`;

  // Write HTML to file
  fs.writeFileSync("report.html", htmlReport);
  console.log("\n📄 HTML report generated: report.html");

  // Close the browser
  await browser.close();
}

// ---------------------- Run the Function ---------------------- //
(async () => {
  await sortHackerNewsArticles();
})();
