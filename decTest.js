// Import required modules
const { firefox } = require("playwright");
// const { chromium } = require("playwright");

// File system for writing HTML reports
const fs = require("fs"); 

// ---------------------- Helper Function ---------------------- //
// Turns "X minutes/hours/days ago" into a number
// This lets us compare which articles are newer or older
function parseAge(text) {
  const parts = text.split(" "); // Split "5 minutes ago" to ["5", "minutes", "ago"]
  const number = parseInt(parts[0], 10); // Extract number
  const unit = parts[1]; // Extract unit (minutes, hours, days)

  if (unit.startsWith("minute")) return number;
  if (unit.startsWith("hour")) return number * 60;
  if (unit.startsWith("day")) return number * 60 * 24;

  // Fallback in case the format is unexpected  
  return Number.MAX_SAFE_INTEGER;
}

// ---------------------- Main Function ---------------------- //
// This function scrapes the first 100 articles from Hacker News
// Validates if they are sorted newest to oldest
// Generates an HTML report for review
async function sortHackerNewsArticles() {
  const startTime = Date.now(); // Start timer for execution time

  // Launch Firefox in headless mode
  const browser = await firefox.launch({ headless: true });
  // const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Ensure screenshots folder exists
  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
  }

  // Navigate to Hacker News newest page
  await page.goto("https://news.ycombinator.com/newest", {
    waitUntil: "domcontentloaded",
  });

  // Take initial screenshot
  await page.screenshot({ path: "screenshots/page_load.png" });

  // Array to hold all article objects { title, ageText, ageMinutes }
  const articles = [];

  // Loop until we collect 100 articles
  while (articles.length < 100) {
    // Each article is in a <tr> with class "athing"
    const rows = await page.$$("tr.athing");

    for (const row of rows) {
      if (articles.length >= 100) break;

      // Extract title
      const title = await row.$eval(".titleline a", (el) => el.innerText);

      // Extract age text (e.g., "5 minutes ago")
      const ageText = await row.evaluate(
        (el) => el.nextElementSibling.querySelector(".age").innerText
      );

      // Push article info into array
      articles.push({
        title,
        ageText,
        ageMinutes: parseAge(ageText),
      });
    }

    // If less than 100 articles collected, click "More" button
    if (articles.length < 100) {
      const moreButton = await page.$("a.morelink");
      if (!moreButton) break;
      await moreButton.click();
      await page.waitForLoadState("domcontentloaded");

      // Screenshot after clicking "More"
      await page.screenshot({ path: `screenshots/more_click.png` });
    }
  }

  // Take final screenshot
  await page.screenshot({ path: "screenshots/final_state.png" });

  // ---------------------- Validate Count ---------------------- //
  if (articles.length !== 100) {
    console.error(`FAIL: Expected 100 articles, found ${articles.length}`);
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
  //   console.log("\n First 100 Hacker News Articles (Newest → Oldest):\n");
  //   articles.forEach((article, index) => {
  //     console.log(`${index + 1}. ${article.title} — ${article.ageText}`);
  //   });

  if (sorted) {
    console.log(
      "\n SUCCESS! The first 100 articles are sorted correctly (newest to oldest)."
    );
  } else {
    console.error("\n FAIL: The articles are NOT sorted correctly.");
  }

  const endTime = Date.now();
  const executionSeconds = ((endTime - startTime) / 1000).toFixed(2);

  // ---------------------- Generate HTML Report ---------------------- //
  const statusText = sorted
    ? "✔ Test Passed — Articles correctly sorted (newest → oldest)"
    : "❌ Test Failed — Articles are NOT correctly sorted";

  // Create list items for HTML
  const articleListHTML = articles
    .map(
      (article, index) => `
      <li class="article-item">
        <strong>${index + 1}.</strong> ${article.title}
        <br/>
        <em>${article.ageText}</em>
      </li>
    `
    )
    .join("");

  // Screenshot gallery HTML
  const screenshotHTML = `
    <div class="metrics-grid">
      ${["page_load.png", "more_click.png", "final_state.png"]
        .map(
          (file) => `
        <div class="metric-card">
          <div class="metric-label">${file.replace(".png", "").replace("_", " ")}</div>
          <img src="screenshots/${file}" class="screenshot-thumb" />
        </div>
      `
        )
        .join("")}
    </div>
  `;

  // Full HTML content
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Hacker News Sorting Report</title>
  <style>
    body {
      margin: 0;
      font-family: Inter, Arial, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 40px;
      text-align: left;
    }
    h1, h2, h3 { margin-top: 0; font-weight: 600; }
    .header { margin-bottom: 40px; }
    .title { font-size: 32px; color: #38bdf8; }
    .subtitle { margin-top: 8px; font-size: 16px; color: #94a3b8; }
    .status-badge { display:inline-block; padding:8px 14px; border-radius:20px; background:${sorted?"#14532d":"#7f1d1d"}; color:#86efac; font-weight:600; margin-top:20px; font-size:14px; }
    .metrics-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; margin-top:40px; margin-bottom:50px; }
    .metric-card { background:#1e293b; padding:20px; border-radius:12px; }
    .metric-label { font-size:14px; color:#94a3b8; }
    .metric-value { font-size:22px; margin-top:6px; color:#f8fafc; font-weight:600; }
    .section { margin-top:50px; }
    .article-list { list-style:none; padding:0; text-align:left; }
    .article-item { background:#1e293b; padding:16px; margin-bottom:12px; border-radius:10px; border-left:4px solid #38bdf8; }
    .article-item em { color:#94a3b8; }
    .section-title { font-size:24px; margin-bottom:20px; color:#38bdf8; border-bottom:1px solid #334155; padding-bottom:10px; cursor:pointer; }
    .learning-card { background:#0f1f3d; padding:24px; border-radius:12px; margin-top:20px; border-left:5px solid #38bdf8; }
    .collapsible-content { display:none; padding-top:12px; }
    .screenshot-thumb { width:100%; border-radius:8px; cursor:pointer; margin-top:8px; }
    .modal { display:none; position:fixed; z-index:999; padding-top:60px; left:0; top:0; width:100%; height:100%; overflow:auto; background-color: rgba(0,0,0,0.8); }
    .modal-content { margin:auto; display:block; max-width:80%; max-height:80%; }
    .close { position:absolute; top:20px; right:35px; color:#fff; font-size:40px; font-weight:bold; cursor:pointer; }
  </style>
</head>
<body>

  <div class="header">
    <h1 class="title">Playwright Testing - Sorting Report</h1>
    <p class="subtitle">Automated validation of Hacker News "New" tab sorting order</p>

    <div class="status-badge">
      ${statusText}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">🕒 Execution Time</div>
      <div class="metric-value">${executionSeconds}s</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">📄 Articles Scanned</div>
      <div class="metric-value">${articles.length}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">✅ Validation Result</div>
      <div class="metric-value">${sorted?"Success":"Fail"}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">📅 Run Timestamp</div>
      <div class="metric-value">${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title" onclick="toggleCollapse('articles')">First 100 Articles - <span style="font-size: 16px;">Click to Expand</span></h2>
    <div id="articles" class="collapsible-content">
      <ul class="article-list">
        ${articleListHTML}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Screenshots</h2>
    ${screenshotHTML}
  </div>

  <!-- Modal for screenshots -->
  <div id="modal" class="modal">
    <span class="close">&times;</span>
    <img class="modal-content" id="modal-img" />
  </div>

   <div class="section">
    <h2 class="section-title" onclick="toggleCollapse('learning')">Learning Journey - <span style="font-size: 16px;">Click to Expand</span></h2>
    <div id="learning" class="collapsible-content">
      <div class="learning-card">
        <p>
          This project was a major hands-on milestone in my Playwright learning journey. I learned how to scrape real-world data, handle page navigation, validate sorting logic, capture screenshots, and produce a visually polished HTML report that resembles a real QA engineer’s output.
        </p>

        <p>
          It helped me strengthen experience with:
          <strong>DOM evaluation, Playwright selectors, test assertions,
          HTML report generation, and debugging using headed mode.</strong>
        </p>

        <p>
          My goal was to build a real-world validation tool that goes beyond a simple test—
          a full automated workflow that collects data, evaluates it, and produces a
          clean, visual, professional report.
        </p>
      </div>
    </div>
  </div>

  <script>
    function toggleCollapse(id){
      const el = document.getElementById(id);
      if(el.style.display === 'block') el.style.display='none';
      else el.style.display='block';
    }

    // Screenshot modal functionality
    const modal = document.getElementById("modal");
    const modalImg = document.getElementById("modal-img");
    const closeBtn = document.querySelector(".close");
    document.querySelectorAll(".screenshot-thumb").forEach(img => {
      img.onclick = () => {
        modal.style.display = "block";
        modalImg.src = img.src;
      }
    });
    closeBtn.onclick = () => { modal.style.display = "none"; }
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }
  </script>

</body>
</html>
`;

  // Write HTML to file
  fs.writeFileSync("report.html", htmlReport);
  console.log("\n HTML report generated: report.html");

  // Close the browser
  await browser.close();
}

// ---------------------- Run Main Function ---------------------- //
(async () => {
  await sortHackerNewsArticles();
})();
