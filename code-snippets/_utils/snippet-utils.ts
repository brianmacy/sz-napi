/**
 * Shared utility for code snippets.
 *
 * Provides a helper to create a fresh SQLite database, initialize an
 * SzEnvironment, and optionally register data sources -- eliminating
 * ~30 lines of boilerplate from every snippet.
 */

import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { SzEnvironment } from "@senzing/sdk";
import { addDataSource } from "@senzing/configtool";

// -- Platform detection -------------------------------------------------------
const isMac = process.platform === "darwin";
export const senzingDir = isMac
  ? "/opt/homebrew/opt/senzing/runtime/er"
  : "/opt/senzing/er";
export const supportDir = isMac
  ? "/opt/homebrew/opt/senzing/runtime/data"
  : "/opt/senzing/data";
export const schemaFile = `${senzingDir}/resources/schema/szcore-schema-sqlite-create.sql`;

export interface SnippetEnv {
  env: SzEnvironment;
  settings: string;
  dbPath: string;
  cleanup: () => void;
}

/**
 * Creates a fresh SQLite DB, initializes SzEnvironment, registers data sources.
 *
 * @param name    Module name for SzEnvironment
 * @param dataSources  Optional array of data source codes to register
 * @returns An object with env, settings, dbPath, and a cleanup() function
 */
export function initSnippetEnvironment(
  name: string,
  dataSources?: string[],
): SnippetEnv {
  const dbPath = `/tmp/senzing-snippet-${name}-${process.pid}.db`;

  const settings = JSON.stringify({
    PIPELINE: {
      CONFIGPATH: `${senzingDir}/resources/templates`,
      RESOURCEPATH: `${senzingDir}/resources`,
      SUPPORTPATH: supportDir,
    },
    SQL: {
      CONNECTION: `sqlite3://na:na@${dbPath}`,
    },
  });

  // Create fresh database
  if (existsSync(dbPath)) unlinkSync(dbPath);
  execSync(`sqlite3 ${dbPath} < ${schemaFile}`);

  // Initialize environment
  const env = new SzEnvironment(name, settings, false);

  // Register data sources if requested
  if (dataSources && dataSources.length > 0) {
    const configManager = env.getConfigManager();
    let configJson = configManager.createConfig();
    for (const ds of dataSources) {
      configJson = addDataSource(configJson, { code: ds });
    }
    const configId = configManager.setDefaultConfig(
      configJson,
      `${name} config with ${dataSources.join(", ")}`,
    );
    env.reinitialize(configId);
  }

  const cleanup = () => {
    if (!env.isDestroyed()) env.destroy();
    if (existsSync(dbPath)) unlinkSync(dbPath);
  };

  return { env, settings, dbPath, cleanup };
}
