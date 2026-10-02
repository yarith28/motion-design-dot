const { chromium, webkit } = require("playwright");

const browserType =
  process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
const executablePath =
  process.env.BROWSER_PATH ||
  process.env.CHROMIUM_PATH ||
  (process.env.BROWSER_ENGINE === "webkit"
    ? browserType.executablePath()
    : "/usr/bin/chromium");

async function launchBrowser() {
  return browserType.launch({
    executablePath,
    args: browserType === chromium ? ["--no-sandbox"] : [],
  });
}

module.exports = { launchBrowser };
