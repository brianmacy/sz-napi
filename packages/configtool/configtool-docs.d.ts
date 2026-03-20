/**
 * Documentation augmentation for @senzing/configtool functions.
 *
 * This file provides JSDoc with @example tags for key configtool functions.
 * TypeDoc merges these declarations with the auto-generated index.d.ts.
 *
 * @module
 */

import type { AddDataSourceOptions, AddAttributeOptions } from './index';

/**
 * Adds a data source to the Senzing configuration. Returns the updated
 * configuration JSON string with the new data source included.
 *
 * @param configJson - The current configuration as a JSON string.
 * @param options - Data source options including the required `code` identifier.
 * @returns The updated configuration JSON string.
 *
 * @example
 * ```typescript
 * import { addDataSource } from "@senzing/configtool";
 *
 * let config = addDataSource(configJson, { code: "CUSTOMERS" });
 * config = addDataSource(config, { code: "WATCHLIST", retentionLevel: "Remember" });
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare function addDataSource(configJson: string, options: AddDataSourceOptions): string;

/**
 * Lists all data sources defined in the configuration. Returns a JSON string
 * containing an array of data source objects.
 *
 * @param configJson - The current configuration as a JSON string.
 * @returns A JSON string representing an array of data source objects.
 *
 * @example
 * ```typescript
 * import { listDataSources } from "@senzing/configtool";
 *
 * const sources = JSON.parse(listDataSources(configJson));
 * for (const ds of sources) {
 *   console.log(`${ds.DSRC_CODE} (id: ${ds.DSRC_ID})`);
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare function listDataSources(configJson: string): string;

/**
 * Retrieves details for a specific data source by its code. Returns a JSON
 * string containing the data source object.
 *
 * @param configJson - The current configuration as a JSON string.
 * @param code - The data source code to look up (e.g., "CUSTOMERS").
 * @returns A JSON string representing the data source object.
 *
 * @example
 * ```typescript
 * import { getDataSource } from "@senzing/configtool";
 *
 * const ds = JSON.parse(getDataSource(configJson, "CUSTOMERS"));
 * console.log(ds.DSRC_CODE, ds.DSRC_RELY);
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare function getDataSource(configJson: string, code: string): string;

/**
 * Deletes a data source from the configuration by its code. Returns the
 * updated configuration JSON string with the data source removed.
 *
 * @param configJson - The current configuration as a JSON string.
 * @param code - The data source code to delete.
 * @returns The updated configuration JSON string.
 *
 * @example
 * ```typescript
 * import { deleteDataSource } from "@senzing/configtool";
 *
 * configJson = deleteDataSource(configJson, "OLD_SOURCE");
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare function deleteDataSource(configJson: string, code: string): string;

/**
 * Processes a batch of configtool commands from a multi-line script string.
 * Each line is executed sequentially against the configuration. Returns the
 * final updated configuration JSON string.
 *
 * @param configJson - The current configuration as a JSON string.
 * @param script - A newline-delimited string of configtool commands.
 * @returns The updated configuration JSON string after all commands execute.
 *
 * @example
 * ```typescript
 * import { processScript } from "@senzing/configtool";
 *
 * const script = "addDataSource CUSTOMERS\naddDataSource WATCHLIST";
 * configJson = processScript(configJson, script);
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/process-script | process-script snippet}
 */
export declare function processScript(configJson: string, script: string): string;

/**
 * Lists all features defined in the configuration. Returns a JSON string
 * containing an array of feature objects with their type codes, classes,
 * and other properties.
 *
 * @param configJson - The current configuration as a JSON string.
 * @returns A JSON string representing an array of feature objects.
 *
 * @example
 * ```typescript
 * import { listFeatures } from "@senzing/configtool";
 *
 * const features = JSON.parse(listFeatures(configJson));
 * for (const f of features.slice(0, 5)) {
 *   console.log(`${f.FTYPE_CODE} (class: ${f.FCLASS_CODE})`);
 * }
 * ```
 */
export declare function listFeatures(configJson: string): string;

/**
 * Adds an attribute mapping to the configuration. Maps a named attribute
 * to a feature, element, and class so that incoming records with this
 * attribute are processed correctly by the Senzing engine.
 *
 * @param configJson - The current configuration as a JSON string.
 * @param options - Attribute options including `attribute`, `feature`, `element`, and `class`.
 * @returns The updated configuration JSON string.
 *
 * @example
 * ```typescript
 * import { addAttribute } from "@senzing/configtool";
 *
 * configJson = addAttribute(configJson, {
 *   attribute: "LOYALTY_NUMBER",
 *   feature: "OTHER_ID",
 *   element: "OTHER_ID_NUMBER",
 *   class: "OTHER",
 * });
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare function addAttribute(configJson: string, options: AddAttributeOptions): string;

/**
 * Error thrown by configtool functions when a configuration operation fails.
 * The `errorType` property indicates the category of failure, such as
 * `'NotFound'`, `'AlreadyExists'`, or `'InvalidInput'`.
 *
 * @example
 * ```typescript
 * import { addDataSource, SzConfigError } from "@senzing/configtool";
 *
 * try {
 *   addDataSource(configJson, { code: "DUPLICATE" });
 * } catch (e) {
 *   if (e instanceof SzConfigError) {
 *     console.log(`${e.errorType}: ${e.message}`);
 *   }
 * }
 * ```
 *
 * @see {@link https://github.com/brianmacy/sz-napi/tree/main/code-snippets/configtool/basic-usage | basic-usage snippet}
 */
export declare class SzConfigError extends Error {
  name: 'SzConfigError';
  /** The category of configuration error. */
  errorType: string;
  constructor(errorType: string, message: string);
}
