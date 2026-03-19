/**
 * Preload — loads the @senzing/electron preload script.
 *
 * Sandboxed preloads can't resolve npm packages by name, so we
 * resolve by absolute path. sandbox: false is set on the window.
 */
const path = require("path");
require(path.join(__dirname, "..", "node_modules", "@senzing", "electron", "dist", "preload", "index.js"));
