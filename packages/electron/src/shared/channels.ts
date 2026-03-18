export interface MethodDef {
  service: string;
  method: string;
  channel: string;
  /** Ordered arg names matching the Zod schema / NAPI positional order. */
  args: string[];
  streaming?: boolean;
}

export const METHOD_REGISTRY: MethodDef[] = [
  // Lifecycle
  { service: "lifecycle", method: "initialize", channel: "sz:lifecycle:initialize", args: ["settings", "opts"] },
  { service: "lifecycle", method: "destroy", channel: "sz:lifecycle:destroy", args: [] },
  { service: "lifecycle", method: "reinitialize", channel: "sz:lifecycle:reinitialize", args: ["configId"] },
  { service: "lifecycle", method: "getActiveConfigId", channel: "sz:lifecycle:getActiveConfigId", args: [] },
  // Product
  { service: "product", method: "getLicense", channel: "sz:product:getLicense", args: [] },
  { service: "product", method: "getVersion", channel: "sz:product:getVersion", args: [] },
  // Engine
  { service: "engine", method: "primeEngine", channel: "sz:engine:primeEngine", args: [] },
  { service: "engine", method: "getStats", channel: "sz:engine:getStats", args: [] },
  { service: "engine", method: "addRecord", channel: "sz:engine:addRecord", args: ["dataSourceCode", "recordId", "recordDefinition", "flags"] },
  { service: "engine", method: "deleteRecord", channel: "sz:engine:deleteRecord", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "reevaluateRecord", channel: "sz:engine:reevaluateRecord", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "reevaluateEntity", channel: "sz:engine:reevaluateEntity", args: ["entityId", "flags"] },
  { service: "engine", method: "getRecord", channel: "sz:engine:getRecord", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "getRecordPreview", channel: "sz:engine:getRecordPreview", args: ["recordDefinition", "flags"] },
  { service: "engine", method: "getEntityById", channel: "sz:engine:getEntityById", args: ["entityId", "flags"] },
  { service: "engine", method: "getEntityByRecord", channel: "sz:engine:getEntityByRecord", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "searchByAttributes", channel: "sz:engine:searchByAttributes", args: ["attributes", "searchProfile", "flags"] },
  { service: "engine", method: "whySearch", channel: "sz:engine:whySearch", args: ["attributes", "entityId", "searchProfile", "flags"] },
  { service: "engine", method: "whyEntities", channel: "sz:engine:whyEntities", args: ["entityId1", "entityId2", "flags"] },
  { service: "engine", method: "whyRecords", channel: "sz:engine:whyRecords", args: ["dsCode1", "recId1", "dsCode2", "recId2", "flags"] },
  { service: "engine", method: "whyRecordInEntity", channel: "sz:engine:whyRecordInEntity", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "howEntity", channel: "sz:engine:howEntity", args: ["entityId", "flags"] },
  { service: "engine", method: "getVirtualEntity", channel: "sz:engine:getVirtualEntity", args: ["recordKeys", "flags"] },
  { service: "engine", method: "findInterestingEntitiesById", channel: "sz:engine:findInterestingEntitiesById", args: ["entityId", "flags"] },
  { service: "engine", method: "findInterestingEntitiesByRecord", channel: "sz:engine:findInterestingEntitiesByRecord", args: ["dataSourceCode", "recordId", "flags"] },
  { service: "engine", method: "findPath", channel: "sz:engine:findPath", args: ["startEntityId", "endEntityId", "maxDegrees", "avoidEntityIds", "requiredDataSources", "flags"] },
  { service: "engine", method: "findNetwork", channel: "sz:engine:findNetwork", args: ["entityIds", "maxDegrees", "buildOutDegree", "maxEntities", "flags"] },
  { service: "engine", method: "getRedoRecord", channel: "sz:engine:getRedoRecord", args: [] },
  { service: "engine", method: "countRedoRecords", channel: "sz:engine:countRedoRecords", args: [] },
  { service: "engine", method: "processRedoRecord", channel: "sz:engine:processRedoRecord", args: ["redoRecord", "flags"] },
  { service: "engine", method: "exportJsonEntityReport", channel: "sz:engine:exportJsonEntityReport", args: ["flags"], streaming: true },
  { service: "engine", method: "exportCsvEntityReport", channel: "sz:engine:exportCsvEntityReport", args: ["csvColumnList", "flags"], streaming: true },
  // ConfigManager
  { service: "configManager", method: "createConfig", channel: "sz:configManager:createConfig", args: [] },
  { service: "configManager", method: "createConfigFromId", channel: "sz:configManager:createConfigFromId", args: ["configId"] },
  { service: "configManager", method: "createConfigFromDefinition", channel: "sz:configManager:createConfigFromDefinition", args: ["configDefinition"] },
  { service: "configManager", method: "getConfigRegistry", channel: "sz:configManager:getConfigRegistry", args: [] },
  { service: "configManager", method: "getDefaultConfigId", channel: "sz:configManager:getDefaultConfigId", args: [] },
  { service: "configManager", method: "registerConfig", channel: "sz:configManager:registerConfig", args: ["configDefinition", "configComment"] },
  { service: "configManager", method: "replaceDefaultConfigId", channel: "sz:configManager:replaceDefaultConfigId", args: ["currentDefaultConfigId", "newDefaultConfigId"] },
  { service: "configManager", method: "setDefaultConfig", channel: "sz:configManager:setDefaultConfig", args: ["configDefinition", "configComment"] },
  { service: "configManager", method: "setDefaultConfigId", channel: "sz:configManager:setDefaultConfigId", args: ["configId"] },
  // Diagnostic
  { service: "diagnostic", method: "checkRepositoryPerformance", channel: "sz:diagnostic:checkRepositoryPerformance", args: ["secondsToRun"] },
  { service: "diagnostic", method: "getFeature", channel: "sz:diagnostic:getFeature", args: ["featureId"] },
  { service: "diagnostic", method: "getRepositoryInfo", channel: "sz:diagnostic:getRepositoryInfo", args: [] },
  { service: "diagnostic", method: "purgeRepository", channel: "sz:diagnostic:purgeRepository", args: [] },
];

/** Lookup map: "service:method" → MethodDef */
export const METHOD_MAP = new Map<string, MethodDef>(
  METHOD_REGISTRY.map(d => [`${d.service}:${d.method}`, d])
);
