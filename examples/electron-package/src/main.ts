/**
 * Electron Main Process — using @senzing/electron
 *
 * Demonstrates the SzElectronEnvironment API with native-style
 * positional arg calls. On startup:
 *   1. Initializes a SQLite database with the Senzing schema
 *   2. Starts the SDK via SzElectronEnvironment
 *   3. Bootstraps data sources via configManager
 *   4. Loads the Senzing truthset from GitHub
 *   5. Opens a BrowserWindow with a plain HTML UI
 *
 * Prerequisites:
 *   - Senzing runtime installed
 *   - LD_LIBRARY_PATH=/opt/senzing/er/lib (Linux)
 */
import { app, BrowserWindow } from "electron";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import * as path from "node:path";
import { SzElectronEnvironment } from "@senzing/electron";
import { addDataSource } from "@senzing/configtool";

// -- Platform detection -------------------------------------------------------

const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------

const dbPath = "/tmp/senzing-electron-pkg-example.db";
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;

const settings = JSON.stringify({
  PIPELINE: {
    CONFIGPATH: `${senzingBase}/resources/templates`,
    RESOURCEPATH: `${senzingBase}/resources`,
    SUPPORTPATH: supportPath,
  },
  SQL: {
    CONNECTION: `sqlite3://na:na@${dbPath}`,
  },
});

const TRUTHSET_BASE_URL =
  "https://raw.githubusercontent.com/Senzing/code-snippets-v4/main/resources/data/truthset";
const JSONL_FILES = ["customers.jsonl", "watchlist.jsonl", "reference.jsonl"];

// -- SDK setup ----------------------------------------------------------------

const sz = new SzElectronEnvironment();

async function loadTruthset(): Promise<void> {
  let total = 0;
  for (const file of JSONL_FILES) {
    const url = `${TRUTHSET_BASE_URL}/${file}`;
    console.log(`Fetching ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch ${file}: ${response.statusText}`);
      continue;
    }
    const content = await response.text();
    const lines = content.trim().split("\n").filter(Boolean);
    for (const line of lines) {
      const record = JSON.parse(line);
      await sz.engine.addRecord(record.DATA_SOURCE, record.RECORD_ID, line);
      total++;
    }
    console.log(`  Loaded ${lines.length} records from ${file}`);
  }
  console.log(`Loaded ${total} truthset records total.`);
}

// -- Window -------------------------------------------------------------------

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  return win;
}

// -- App lifecycle ------------------------------------------------------------

app.whenReady().then(async () => {
  try {
    // Initialize SQLite database
    if (existsSync(dbPath)) unlinkSync(dbPath);
    execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

    // Register IPC handlers and start SDK
    sz.setup();
    await sz.initialize(settings);
    console.log("Senzing SDK initialized.");

    // Configure data sources
    let configJson = await sz.configManager.createConfig();
    configJson = addDataSource(configJson, { code: "CUSTOMERS" });
    configJson = addDataSource(configJson, { code: "WATCHLIST" });
    configJson = addDataSource(configJson, { code: "REFERENCE" });
    const configId = await sz.configManager.setDefaultConfig(
      configJson,
      "Electron example config with truthset data sources",
    );
    await sz.reinitialize(configId);
    console.log("Data sources configured.");

    // Load truthset
    await loadTruthset();

    // Open window
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  } catch (err) {
    console.error("Startup failed:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", async () => {
  await sz.teardown();
  if (existsSync(dbPath)) unlinkSync(dbPath);
});
