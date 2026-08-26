'use strict';

/**
 * Adapters that wrap synchronous native SDK classes to satisfy
 * the @senzing/types async interfaces.
 *
 * JSON-returning methods resolve the raw JSON string exactly as the native
 * SDK produces it — the caller parses if and when needed. This matches the
 * contract of every Senzing V4 binding (Rust returns JsonString; Java, C#,
 * Python and the native TypeScript surface all return the JSON string).
 *
 * Usage:
 *   const { SzEnvironment, SzEngineNative } = require('@senzing/sdk');
 *   const env = new SzEnvironment('myApp', settings);
 *   const engine = new SzEngineNative(env.getEngine());
 *   const entity = JSON.parse(await engine.getEntityById(123));
 */

class SzProductNative {
  constructor(product) { this._product = product; }
  async getVersion() { return this._product.getVersion(); }
  async getLicense() { return this._product.getLicense(); }
}

class SzDiagnosticNative {
  constructor(diagnostic) { this._diagnostic = diagnostic; }
  async checkRepositoryPerformance(secondsToRun) { return this._diagnostic.checkRepositoryPerformance(secondsToRun); }
  async getFeature(featureId) { return this._diagnostic.getFeature(featureId); }
  async getRepositoryInfo() { return this._diagnostic.getRepositoryInfo(); }
  async purgeRepository() { this._diagnostic.purgeRepository(); }
}

class SzConfigManagerNative {
  constructor(configManager) { this._cm = configManager; }
  async createConfig() { return this._cm.createConfig(); }
  async createConfigFromId(configId) { return this._cm.createConfigFromId(configId); }
  async createConfigFromDefinition(configDefinition) { return this._cm.createConfigFromDefinition(configDefinition); }
  async getConfigRegistry() { return this._cm.getConfigRegistry(); }
  async getDefaultConfigId() { return this._cm.getDefaultConfigId(); }
  async registerConfig(configDefinition, configComment) { return this._cm.registerConfig(configDefinition, configComment); }
  async replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId) { this._cm.replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId); }
  async setDefaultConfig(configDefinition, configComment) { return this._cm.setDefaultConfig(configDefinition, configComment); }
  async setDefaultConfigId(configId) { this._cm.setDefaultConfigId(configId); }
}

class SzEngineNative {
  constructor(engine) { this._engine = engine; }

  // Record Operations
  async addRecord(dataSourceCode, recordId, recordDefinition, flags) { return this._engine.addRecord(dataSourceCode, recordId, recordDefinition, flags); }
  async deleteRecord(dataSourceCode, recordId, flags) { return this._engine.deleteRecord(dataSourceCode, recordId, flags); }
  async getRecord(dataSourceCode, recordId, flags) { return this._engine.getRecord(dataSourceCode, recordId, flags); }
  async getRecordPreview(recordDefinition, flags) { return this._engine.getRecordPreview(recordDefinition, flags); }
  async reevaluateRecord(dataSourceCode, recordId, flags) { return this._engine.reevaluateRecord(dataSourceCode, recordId, flags); }
  async reevaluateEntity(entityId, flags) { return this._engine.reevaluateEntity(entityId, flags); }

  // Entity Retrieval
  async getEntityById(entityId, flags) { return this._engine.getEntityById(entityId, flags); }
  async getEntityByRecord(dataSourceCode, recordId, flags) { return this._engine.getEntityByRecord(dataSourceCode, recordId, flags); }
  async searchByAttributes(attributes, searchProfile, flags) { return this._engine.searchByAttributes(attributes, searchProfile, flags); }

  // Why/How Analysis
  async whySearch(attributes, entityId, searchProfile, flags) { return this._engine.whySearch(attributes, entityId, searchProfile, flags); }
  async whyEntities(entityId1, entityId2, flags) { return this._engine.whyEntities(entityId1, entityId2, flags); }
  async whyRecords(dsCode1, recId1, dsCode2, recId2, flags) { return this._engine.whyRecords(dsCode1, recId1, dsCode2, recId2, flags); }
  async whyRecordInEntity(dataSourceCode, recordId, flags) { return this._engine.whyRecordInEntity(dataSourceCode, recordId, flags); }
  async howEntity(entityId, flags) { return this._engine.howEntity(entityId, flags); }
  async getVirtualEntity(recordKeys, flags) { return this._engine.getVirtualEntity(recordKeys, flags); }

  // Interesting Entities
  async findInterestingEntitiesById(entityId, flags) { return this._engine.findInterestingEntitiesById(entityId, flags); }
  async findInterestingEntitiesByRecord(dataSourceCode, recordId, flags) { return this._engine.findInterestingEntitiesByRecord(dataSourceCode, recordId, flags); }

  // Pathfinding
  async findPath(startEntityId, endEntityId, maxDegrees, avoidEntityIds, requiredDataSources, flags) {
    return this._engine.findPath(startEntityId, endEntityId, maxDegrees, avoidEntityIds, requiredDataSources, flags);
  }
  async findNetwork(entityIds, maxDegrees, buildOutDegree, maxEntities, flags) {
    return this._engine.findNetwork(entityIds, maxDegrees, buildOutDegree, maxEntities, flags);
  }

  // Redo
  async getRedoRecord() { return this._engine.getRedoRecord(); }
  async countRedoRecords() { return this._engine.countRedoRecords(); }
  async processRedoRecord(redoRecord, flags) { return this._engine.processRedoRecord(redoRecord, flags); }

  // Stats
  async primeEngine() { this._engine.primeEngine(); }
  async getStats() { return this._engine.getStats(); }

  // Export (collected results). exportJsonEntityReport returns the raw
  // concatenated JSON string; exportCsvEntityReport returns raw CSV text.
  async exportJsonEntityReport(flags) {
    const iter = this._engine.exportJsonEntityReport(flags);
    const chunks = [];
    for (const chunk of iter) chunks.push(chunk);
    return chunks.join('');
  }
  async exportCsvEntityReport(csvColumnList, flags) {
    const iter = this._engine.exportCsvEntityReport(csvColumnList, flags);
    const chunks = [];
    for (const chunk of iter) chunks.push(chunk);
    return chunks.join('');
  }
}

class SzEnvironmentNative {
  constructor(environment) { this._env = environment; }
  async destroy() { this._env.destroy(); }
  async reinitialize(configId) { this._env.reinitialize(configId); }
  async getActiveConfigId() { return this._env.getActiveConfigId(); }
  async isDestroyed() { return this._env.isDestroyed(); }
}

module.exports = {
  SzEngineNative,
  SzConfigManagerNative,
  SzDiagnosticNative,
  SzProductNative,
  SzEnvironmentNative,
};
