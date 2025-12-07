// // EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
// const { chromium } = require("playwright");

// async function sortHackerNewsArticles() {
//   // launch browser
//   const browser = await chromium.launch({ headless: false });
//   const context = await browser.newContext();
//   const page = await context.newPage();

//   // go to Hacker News
//   await page.goto("https://news.ycombinator.com/newest");
// }

// (async () => {
//   await sortHackerNewsArticles();
// })();

//Chris Version
// Import Playwright's Chromium browser engine
// const { chromium } = require("playwright");
const { webkit } = require("playwright");

// Helper Function
// Converts "X minutes/hours/days ago" into minutes
// This allows us to numerically compare article ages
function parseAge(text) {
  var parts = text.split(" ");
  var number = parseInt(parts[0], 10);
  var unit = parts[1];

  if (unit.indexOf("minute") === 0) {
    return number;
  } else if (unit.indexOf("hour") === 0) {
    return number * 60;
  } else if (unit.indexOf("day") === 0) {
    return number * 60 * 24;
  } else {
    // Fallback in case of unexpected text format
    return Number.MAX_SAFE_INTEGER;
  }
}

// Main Function
// Launches the browser, collects 100 articles,
// validates count, and verifies sorting order
async function sortHackerNewsArticles() {
  // Launch browser + open page
  var browser = await webkit.launch({
    headless: false,
    devtools: true,
    slowMo: 1000,
    // args: [
    //   "--disable-gpu",
    //   "--disable-dev-shm-usage",
    //   "--disable-setuid-sandbox",
    //   "--no-sandbox",
    // ],
  });
  var context = await browser.newContext();
  var page = await context.newPage();

  // Navigate to Hacker News "newest" page
  await page.goto("https://news.ycombinator.com/newest", {
    waitUntil: "domcontentloaded",
  });

  // Collect first 100 article timestamps (pagination)
  var times = [];

  // Keep scraping until we reach 100 timestamps
  while (times.length < 100) {
    // Grab all current timestamp elements on the page
    var elements = await page.$$(".age");

    // Extract visible text from each timestamp safely
    for (var i = 0; i < elements.length && times.length < 100; i++) {
      var text = await elements[i].innerText();
      times.push(text);
    }

    // Stop if we successfully collected 100
    if (times.length >= 100) {
      break;
    }

    // Click the "More" button to load next page
    await page.waitForSelector("a.morelink", { timeout: 10000 });
    var moreButton = await page.$("a.morelink");

    if (!moreButton) {
      console.error("No more pages available before reaching 100 items.");
      await browser.close();
      process.exit(1);
    }

    await moreButton.click();
    await page.waitForLoadState("domcontentloaded");
  }

  // Validate that EXACTLY 100 were collected
  if (times.length !== 100) {
    console.error("Expected 100 articles, found " + times.length);
    await browser.close();
    process.exit(1);
  }

  // Validate that articles are sorted newest → oldest
  var sorted = true;

  for (var j = 1; j < times.length; j++) {
    var prev = parseAge(times[j - 1]);
    var curr = parseAge(times[j]);

    // If a newer article appears after an older one, order is broken
    if (curr < prev) {
      sorted = false;
      break;
    }
  }

  // Output final test result

  if (sorted) {
    console.log(
      "🎉 SUCCESS! The first 100 articles are sorted correctly (newest → oldest)."
    );
  } else {
    console.error("⚠️ FAIL: The articles are NOT sorted correctly.");
  }

  // Cleanup
  await browser.close();
}

// Immediately run the main function
(async function () {
  await sortHackerNewsArticles();
})();
