'use strict';

/**
 * Adapters that wrap synchronous native SDK classes to satisfy
 * the @senzing/types async interfaces (Promise<parsed-object>).
 *
 * Usage:
 *   const { SzEnvironment, SzEngineNative } = require('@senzing/sdk');
 *   const env = new SzEnvironment('myApp', settings);
 *   const engine = new SzEngineNative(env.getEngine());
 *   const entity = await engine.getEntityById(123);
 */

function parseJson(val) {
  if (typeof val === 'string' && val.length > 0 && (val[0] === '{' || val[0] === '[')) {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

class SzProductNative {
  constructor(product) { this._product = product; }
  async getVersion() { return parseJson(this._product.getVersion()); }
  async getLicense() { return parseJson(this._product.getLicense()); }
}

class SzDiagnosticNative {
  constructor(diagnostic) { this._diagnostic = diagnostic; }
  async checkRepositoryPerformance(secondsToRun) { return parseJson(this._diagnostic.checkRepositoryPerformance(secondsToRun)); }
  async getFeature(featureId) { return parseJson(this._diagnostic.getFeature(featureId)); }
  async getRepositoryInfo() { return parseJson(this._diagnostic.getRepositoryInfo()); }
  async purgeRepository() { this._diagnostic.purgeRepository(); }
}

class SzConfigManagerNative {
  constructor(configManager) { this._cm = configManager; }
  async createConfig() { return parseJson(this._cm.createConfig()); }
  async createConfigFromId(configId) { return parseJson(this._cm.createConfigFromId(configId)); }
  async createConfigFromDefinition(configDefinition) { return parseJson(this._cm.createConfigFromDefinition(configDefinition)); }
  async getConfigRegistry() { return parseJson(this._cm.getConfigRegistry()); }
  async getDefaultConfigId() { return this._cm.getDefaultConfigId(); }
  async registerConfig(configDefinition, configComment) { return this._cm.registerConfig(configDefinition, configComment); }
  async replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId) { this._cm.replaceDefaultConfigId(currentDefaultConfigId, newDefaultConfigId); }
  async setDefaultConfig(configDefinition, configComment) { return this._cm.setDefaultConfig(configDefinition, configComment); }
  async setDefaultConfigId(configId) { this._cm.setDefaultConfigId(configId); }
}

class SzEngineNative {
  constructor(engine) { this._engine = engine; }

  // Record Operations
  async addRecord(dataSourceCode, recordId, recordDefinition, flags) { return parseJson(this._engine.addRecord(dataSourceCode, recordId, recordDefinition, flags)); }
  async deleteRecord(dataSourceCode, recordId, flags) { return parseJson(this._engine.deleteRecord(dataSourceCode, recordId, flags)); }
  async getRecord(dataSourceCode, recordId, flags) { return parseJson(this._engine.getRecord(dataSourceCode, recordId, flags)); }
  async getRecordPreview(recordDefinition, flags) { return parseJson(this._engine.getRecordPreview(recordDefinition, flags)); }
  async reevaluateRecord(dataSourceCode, recordId, flags) { return parseJson(this._engine.reevaluateRecord(dataSourceCode, recordId, flags)); }
  async reevaluateEntity(entityId, flags) { return parseJson(this._engine.reevaluateEntity(entityId, flags)); }

  // Entity Retrieval
  async getEntityById(entityId, flags) { return parseJson(this._engine.getEntityById(entityId, flags)); }
  async getEntityByRecord(dataSourceCode, recordId, flags) { return parseJson(this._engine.getEntityByRecord(dataSourceCode, recordId, flags)); }
  async searchByAttributes(attributes, searchProfile, flags) { return parseJson(this._engine.searchByAttributes(attributes, searchProfile, flags)); }

  // Why/How Analysis
  async whySearch(attributes, entityId, searchProfile, flags) { return parseJson(this._engine.whySearch(attributes, entityId, searchProfile, flags)); }
  async whyEntities(entityId1, entityId2, flags) { return parseJson(this._engine.whyEntities(entityId1, entityId2, flags)); }
  async whyRecords(dsCode1, recId1, dsCode2, recId2, flags) { return parseJson(this._engine.whyRecords(dsCode1, recId1, dsCode2, recId2, flags)); }
  async whyRecordInEntity(dataSourceCode, recordId, flags) { return parseJson(this._engine.whyRecordInEntity(dataSourceCode, recordId, flags)); }
  async howEntity(entityId, flags) { return parseJson(this._engine.howEntity(entityId, flags)); }
  async getVirtualEntity(recordKeys, flags) { return parseJson(this._engine.getVirtualEntity(recordKeys, flags)); }

  // Interesting Entities
  async findInterestingEntitiesById(entityId, flags) { return parseJson(this._engine.findInterestingEntitiesById(entityId, flags)); }
  async findInterestingEntitiesByRecord(dataSourceCode, recordId, flags) { return parseJson(this._engine.findInterestingEntitiesByRecord(dataSourceCode, recordId, flags)); }

  // Pathfinding
  async findPath(startEntityId, endEntityId, maxDegrees, avoidEntityIds, requiredDataSources, flags) {
    return parseJson(this._engine.findPath(startEntityId, endEntityId, maxDegrees, avoidEntityIds, requiredDataSources, flags));
  }
  async findNetwork(entityIds, maxDegrees, buildOutDegree, maxEntities, flags) {
    return parseJson(this._engine.findNetwork(entityIds, maxDegrees, buildOutDegree, maxEntities, flags));
  }

  // Redo
  async getRedoRecord() { return parseJson(this._engine.getRedoRecord()); }
  async countRedoRecords() { return this._engine.countRedoRecords(); }
  async processRedoRecord(redoRecord, flags) { return parseJson(this._engine.processRedoRecord(redoRecord, flags)); }

  // Stats
  async primeEngine() { this._engine.primeEngine(); }
  async getStats() { return parseJson(this._engine.getStats()); }

  // Export (collected results)
  async exportJsonEntityReport(flags) {
    const iter = this._engine.exportJsonEntityReport(flags);
    const chunks = [];
    for (const chunk of iter) chunks.push(chunk);
    return JSON.parse(chunks.join(''));
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
