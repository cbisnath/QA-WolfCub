# Hacker News Sorting Automation

<img width="1130" height="681" alt="Playwright-Report-Screenshot" src="https://github.com/user-attachments/assets/5070af10-22c0-492f-bd43-71e8b9b316f5" />


[![Node.js](https://img.shields.io/badge/Node.js-20.15.1-brightgreen)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.40.0-blue)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-success)](https://github.com/cbisnath/QA-WolfCub)

---

## Table of Contents
- [Project Overview](#project-overview)  
- [Quick Start](#quick-start)  
- [Architecture & Design](#architecture--design)  
- [Usage & Commands](#usage--commands)  
- [Implementation Features](#implementation-features)  
- [Learning Journey](#learning-journey)  
- [Technical Stack](#technical-stack)  
- [Troubleshooting](#troubleshooting)  

---

## Project Overview

This project automates the **scraping and sorting validation of the first 100 Hacker News articles** from the "Newest" tab using Playwright.

It:
- Collects article titles and timestamps
- Converts relative timestamps into minutes for numerical comparison
- Validates sorting order (newest → oldest)
- Captures screenshots at key stages
- Generates a **professional HTML report** with metrics, screenshots, and collapsible article listings

This project demonstrates **real-world automation**, data validation, and report generation in JavaScript using Playwright.

---

## HTML Report Preview

> ![HTML Report Preview](path-to-your-html-report-image.png)

Replace the `path-to-your-html-report-image.png` with the screenshot or image of your actual HTML report.

---

## Quick Start

### Prerequisites
- Node.js installed ([download](https://nodejs.org/))  
- Git installed and your project cloned  

### Setup
1. Install dependencies:  
```bash
npm install
```

2. Install Playwright browser binaries:  
```bash
npx playwright install
```

> **Why both commands?**  
> - `npm install` installs project dependencies  
> - `npx playwright install` downloads browsers (Chromium, Firefox) for automation  

---

## Architecture & Design

- **Browser Choice:** Firefox (headless) is used for better DOM handling; Chromium is available as an option  
- **Pagination Handling:** Navigates multiple pages using the "More" button to collect exactly 100 articles  
- **Data Parsing:** Converts “X minutes/hours/days ago” into numerical minutes  
- **Validation:** Checks sorting order and counts exactly 100 articles  
- **Reporting:** Produces a styled HTML report with metrics, article list, screenshots, and learning notes  

**File Structure**
```
qa_wolf_take_home/
├── index.js             # Main script for scraping, validation, and report generation
├── screenshots/         # Screenshots captured during scraping
├── report.html          # Generated HTML report
├── package.json         # Dependencies and scripts
└── README.md            # Project documentation
```

---

## Usage & Commands

Run the main script to scrape, validate, and generate a report:

```bash
node index.js
```

After running:
- `report.html` is created in the root folder  
- Screenshots are saved in `/screenshots`  
- Console shows success/fail message for sorting validation  

**HTML Report Highlights**
- ✅ Sorting validation status  
- 🕒 Execution time  
- 📄 Number of articles collected  
- 📅 Timestamp of run  
- Interactive collapsible list of articles  

---

## Implementation Features

- **Automated Scraping:** Captures articles dynamically from Hacker News  
- **Sorting Validation:** Converts relative timestamps into minutes and checks order  
- **Error Handling:** Graceful handling if fewer than 100 articles are found  
- **HTML Reporting:** Fully styled report including metrics and screenshots  
- **Screenshot Gallery:** Step-by-step visuals for review and debugging  
- **Flexible Browser Support:** Firefox by default; Chromium optional  

---

## Learning Journey

This project was a **hands-on milestone** in my Playwright learning journey.  

Through building this project, I gained experience in:  
- Web scraping with Playwright  
- Page navigation and DOM evaluation  
- Handling asynchronous operations and promises  
- Validating sorting logic programmatically  
- Generating professional HTML reports with dynamic content  
- Debugging automation workflows and capturing screenshots  

> My goal was to **go beyond a basic test**: to create a **full end-to-end automated workflow** that is reusable, understandable, and professional in presentation.

---

## Technical Stack

- **JavaScript (Node.js 20.15.1)**  
- **Playwright** (cross-browser automation)  
- **File System (fs module)** for report & screenshots  
- **HTML/CSS** for styled reports  

---

## Troubleshooting

- **Playwright browser errors:** Run `npx playwright install`  
- **Report not generating:** Ensure `node index.js` runs without errors  
- **Missing screenshots:** Ensure `/screenshots` folder exists or let script create it automatically

