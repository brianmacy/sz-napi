/**
 * tRPC Server Example
 *
 * Demonstrates hosting a Senzing tRPC server with Express:
 * - Initializes a SQLite-backed Senzing environment
 * - Bootstraps data sources via @senzing/configtool
 * - Loads sample records
 * - Mounts the szRouter on an Express server
 * - Gracefully shuts down on SIGINT/SIGTERM
 *
 * Prerequisites:
 *   - Senzing runtime installed (brew install senzingsdk-runtime-unofficial on macOS)
 *
 * Usage:
 *   npm start                          # Starts on port 3000
 *   PORT=8080 npm start                # Starts on port 8080
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { SzEnvironment, SzFlags } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";
import { szRouter, SzTrpcEnvironment } from "@senzing/trpc";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------
const dbPath = "/tmp/senzing-trpc-example.db";
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;
const port = Number(process.env.PORT) || 3000;

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

// -- Initialize SQLite database with schema -----------------------------------
if (existsSync(dbPath)) unlinkSync(dbPath);
execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

// -- Initialize Senzing -------------------------------------------------------
const env = new SzEnvironment("trpc-server-example", settings, false);

// Bootstrap data sources
const configManager = env.getConfigManager();
let configJson = configManager.createConfig();
configJson = addDataSource(configJson, { code: "CUSTOMERS" });
configJson = addDataSource(configJson, { code: "WATCHLIST" });
configJson = addDataSource(configJson, { code: "REFERENCE" });
const configId = configManager.setDefaultConfig(
  configJson,
  "tRPC example config with truthset data sources"
);
env.reinitialize(configId);

// Load truthset from GitHub (same source as sz-sdk-typescript-grpc examples)
const engine = env.getEngine();
const TRUTHSET_BASE_URL =
  "https://raw.githubusercontent.com/Senzing/code-snippets-v4/main/resources/data/truthset";
const JSONL_FILES = ["customers.jsonl", "watchlist.jsonl", "reference.jsonl"];

let totalLoaded = 0;
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
    engine.addRecord(record.DATA_SOURCE, record.RECORD_ID, line);
    totalLoaded++;
  }
  console.log(`  Loaded ${lines.length} records from ${file}`);
}
console.log(`Loaded ${totalLoaded} truthset records total.`);

// -- Create tRPC environment and Express server -------------------------------
const szTrpc = new SzTrpcEnvironment({ environment: env });

const app = express();

// Enable CORS for development (e.g. Angular on a different port)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Mount the Senzing tRPC router
app.use(
  "/trpc",
  createExpressMiddleware({
    router: szRouter,
    createContext: () => szTrpc.context,
  })
);

// Simple health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, destroyed: env.isDestroyed() });
});

const server = app.listen(port, () => {
  console.log(`Senzing tRPC server listening on http://localhost:${port}`);
  console.log(`  tRPC endpoint: http://localhost:${port}/trpc`);
  console.log(`  Health check:  http://localhost:${port}/health`);
  console.log(`\nTry the trpc-client example, or query directly:`);
  console.log(
    `  curl "http://localhost:${port}/trpc/product.getVersion" | jq`
  );
});

// -- Graceful shutdown --------------------------------------------------------
function shutdown() {
  console.log("\nShutting down...");
  server.close(() => {
    env.destroy();
    console.log("Environment destroyed.");
    if (existsSync(dbPath)) unlinkSync(dbPath);
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
