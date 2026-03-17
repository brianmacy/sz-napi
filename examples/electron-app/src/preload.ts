/**
 * Preload Script
 *
 * Exposes a typed `window.senzing` API to the renderer process using
 * contextBridge. The renderer never has direct access to Node.js or
 * Electron APIs — all Senzing operations go through IPC to the main
 * process, which relays them to the worker thread.
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("senzing", {
  /**
   * Get Senzing engine version and build info.
   */
  getVersion: (): Promise<Record<string, string>> =>
    ipcRenderer.invoke("senzing:getVersion"),

  /**
   * Add a record to Senzing for entity resolution.
   * @param dataSourceCode - Data source (e.g., "CUSTOMERS", "WATCHLIST")
   * @param recordId - Unique record identifier within the data source
   * @param recordDefinition - JSON string of record attributes
   * @returns WITH_INFO result or null
   */
  addRecord: (
    dataSourceCode: string,
    recordId: string,
    recordDefinition: string
  ): Promise<Record<string, unknown> | null> =>
    ipcRenderer.invoke(
      "senzing:addRecord",
      dataSourceCode,
      recordId,
      recordDefinition
    ),

  /**
   * Search for entities matching a set of attributes.
   * @param attributes - JSON string of search attributes
   * @returns Search results with resolved entities
   */
  searchByAttributes: (
    attributes: string
  ): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke("senzing:searchByAttributes", attributes),

  /**
   * Download and load the Senzing truthset (customers, watchlist, reference) from GitHub.
   * @returns Summary with loaded count, error count, and elapsed seconds
   */
  loadTruthset: (): Promise<{ loaded: number; errors: number; elapsed: number }> =>
    ipcRenderer.invoke("senzing:loadTruthset"),

  /**
   * Listen for truthset loading progress updates.
   * @param callback - Called with progress info as records are loaded
   */
  onLoadProgress: (
    callback: (progress: { loaded: number; total: number; errors: number }) => void
  ): void => {
    ipcRenderer.on("senzing:loadProgress", (_event, progress) => callback(progress));
  },
});
