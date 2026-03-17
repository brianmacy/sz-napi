/**
 * Entity Graph Visualization Example
 *
 * Loads Senzing truth-set data, resolves entities, exports the entity graph,
 * and serves an interactive D3.js force-directed visualization.
 *
 * Prerequisites:
 *   - Senzing runtime installed (brew install senzingsdk-runtime-unofficial on macOS)
 *
 * Usage:
 *   npm install && npm start
 *   Then open http://localhost:8787
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { createServer, IncomingMessage, ServerResponse } from "node:http";
import https from "node:https";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SzEnvironment, SzFlags } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

const __dirname = dirname(fileURLToPath(import.meta.url));

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
const senzingBase = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
const supportPath = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";

// -- Configuration ------------------------------------------------------------
const dbPath = "/tmp/senzing-graph-example.db";
const schemaPath = `${senzingBase}/resources/schema/szcore-schema-sqlite-create.sql`;
const PORT = 8787;

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

// -- Truth-set URLs -----------------------------------------------------------
const TRUTHSET_BASE =
  "https://raw.githubusercontent.com/senzing/truth-sets/refs/heads/main/truthsets/demo_v3";
const TRUTHSET_FILES: { url: string; dataSource: string }[] = [
  { url: `${TRUTHSET_BASE}/customers.json`, dataSource: "CUSTOMERS" },
  { url: `${TRUTHSET_BASE}/watchlist.json`, dataSource: "WATCHLIST" },
  { url: `${TRUTHSET_BASE}/reference.json`, dataSource: "REFERENCE" },
];

// -- Download helper with redirect support ------------------------------------
function downloadFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          downloadFile(res.headers.location!).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

// -- Graph data types ---------------------------------------------------------
interface GraphNode {
  id: number;
  name: string;
  recordCount: number;
  dataSources: Record<string, number>;
  records: { dataSource: string; recordId: string }[];
}

interface GraphEdge {
  source: number;
  target: number;
  matchKey: string;
  matchLevel: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// -- Main ---------------------------------------------------------------------
async function main() {
  // Initialize SQLite database with schema
  if (existsSync(dbPath)) unlinkSync(dbPath);
  execSync(`sqlite3 ${dbPath} < ${schemaPath}`);

  // Initialize the environment
  const env = new SzEnvironment("entity-graph", settings, false);

  // Bootstrap data sources
  const configManager = env.getConfigManager();
  let configJson = configManager.createConfig();
  configJson = addDataSource(configJson, { code: "CUSTOMERS" });
  configJson = addDataSource(configJson, { code: "WATCHLIST" });
  configJson = addDataSource(configJson, { code: "REFERENCE" });
  const configId = configManager.setDefaultConfig(
    configJson,
    "Entity graph example with CUSTOMERS, WATCHLIST, and REFERENCE"
  );
  env.reinitialize(configId);

  const engine = env.getEngine();

  // Download and load truth-set data
  console.log("Downloading truth-set data...");
  for (const { url, dataSource } of TRUTHSET_FILES) {
    console.log(`  Downloading ${dataSource}...`);
    const content = await downloadFile(url);
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    let count = 0;
    for (const line of lines) {
      const record = JSON.parse(line);
      const recordId = record.RECORD_ID;
      const recordData = JSON.stringify(record);
      engine.addRecord(dataSource, recordId, recordData, SzFlags.NO_FLAGS);
      count++;
    }
    console.log(`  Loaded ${count} ${dataSource} records`);
  }

  // Export entities and build graph data
  console.log("Exporting entities and building graph...");
  const nodes: GraphNode[] = [];
  const edgeMap = new Map<string, GraphEdge>();

  for (const entityJson of engine.exportJsonEntityReport(
    SzFlags.EXPORT_DEFAULT_FLAGS
  )) {
    const entity = JSON.parse(entityJson);
    const resolved = entity.RESOLVED_ENTITY;

    // Build data source counts
    const dataSources: Record<string, number> = {};
    const records: { dataSource: string; recordId: string }[] = [];
    for (const rec of resolved.RECORDS ?? []) {
      const ds = rec.DATA_SOURCE;
      dataSources[ds] = (dataSources[ds] ?? 0) + 1;
      records.push({ dataSource: ds, recordId: rec.RECORD_ID });
    }

    nodes.push({
      id: resolved.ENTITY_ID,
      name: resolved.ENTITY_NAME ?? `Entity ${resolved.ENTITY_ID}`,
      recordCount: records.length,
      dataSources,
      records,
    });

    // Build edges from related entities
    for (const related of entity.RELATED_ENTITIES ?? []) {
      const src = resolved.ENTITY_ID;
      const tgt = related.ENTITY_ID;
      const lo = Math.min(src, tgt);
      const hi = Math.max(src, tgt);
      const key = `${lo}-${hi}`;

      if (!edgeMap.has(key)) {
        let matchLevel = "RESOLVED";
        const ml = related.MATCH_LEVEL ?? related.MATCH_LEVEL_CODE ?? 0;
        if (ml === 1) matchLevel = "RESOLVED";
        else if (ml === 2) matchLevel = "POSSIBLY_SAME";
        else if (ml === 3) matchLevel = "POSSIBLY_RELATED";
        else if (ml === 4) matchLevel = "NAME_ONLY";
        else if (ml === 11) matchLevel = "DISCLOSED";

        edgeMap.set(key, {
          source: src,
          target: tgt,
          matchKey: related.MATCH_KEY ?? "",
          matchLevel,
        });
      }
    }
  }

  const graphData: GraphData = {
    nodes,
    edges: Array.from(edgeMap.values()),
  };

  console.log(
    `Graph built: ${graphData.nodes.length} entities, ${graphData.edges.length} relationships`
  );

  // Read the HTML file
  const htmlPath = join(__dirname, "index.html");
  const htmlContent = readFileSync(htmlPath, "utf-8");
  const graphJson = JSON.stringify(graphData);

  // Start HTTP server
  const server = createServer(
    (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url ?? "/";

      if (url === "/" || url === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(htmlContent);
        return;
      }

      if (url === "/graph.json") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(graphJson);
        return;
      }

      const entityMatch = url.match(/^\/entity\/(\d+)$/);
      if (entityMatch) {
        const entityId = parseInt(entityMatch[1], 10);
        try {
          const result = engine.getEntityById(
            entityId,
            SzFlags.ENTITY_DEFAULT_FLAGS
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(result);
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : String(e);
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: message }));
        }
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  );

  server.listen(PORT, () => {
    console.log(`\nEntity graph ready at http://localhost:${PORT}`);

    // Try to open browser
    try {
      if (isMac) {
        execSync(`open http://localhost:${PORT}`);
      } else {
        execSync(`xdg-open http://localhost:${PORT}`);
      }
    } catch {
      // No display or browser available — that is fine
    }
  });

  // Graceful shutdown
  const cleanup = () => {
    console.log("\nShutting down...");
    server.close();
    env.destroy();
    console.log("Environment destroyed.");
    if (existsSync(dbPath)) unlinkSync(dbPath);
    console.log("Database cleaned up.");
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
