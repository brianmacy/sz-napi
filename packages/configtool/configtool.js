'use strict';

const native = require('./index.js');
const { wrapFunction } = require('./js/wrapper');
const { SzConfigError } = require('./js/errors');

module.exports = {
  // Datasources
  addDataSource: wrapFunction(native.addDataSource),
  setDataSource: wrapFunction(native.setDataSource),
  getDataSource: wrapFunction(native.getDataSource),
  deleteDataSource: wrapFunction(native.deleteDataSource),
  listDataSources: wrapFunction(native.listDataSources),

  // Attributes
  addAttribute: wrapFunction(native.addAttribute),
  deleteAttribute: wrapFunction(native.deleteAttribute),
  getAttribute: wrapFunction(native.getAttribute),
  listAttributes: wrapFunction(native.listAttributes),
  setAttribute: wrapFunction(native.setAttribute),

  // Elements
  addElement: wrapFunction(native.addElement),
  deleteElement: wrapFunction(native.deleteElement),
  getElement: wrapFunction(native.getElement),
  listElements: wrapFunction(native.listElements),
  setElement: wrapFunction(native.setElement),
  setFeatureElement: wrapFunction(native.setFeatureElement),
  setFeatureElementDisplayLevel: wrapFunction(native.setFeatureElementDisplayLevel),
  setFeatureElementDerived: wrapFunction(native.setFeatureElementDerived),

  // Features
  addFeature: wrapFunction(native.addFeature),
  deleteFeature: wrapFunction(native.deleteFeature),
  getFeature: wrapFunction(native.getFeature),
  listFeatures: wrapFunction(native.listFeatures),
  setFeature: wrapFunction(native.setFeature),
  addFeatureComparison: wrapFunction(native.addFeatureComparison),
  deleteFeatureComparison: wrapFunction(native.deleteFeatureComparison),
  getFeatureComparison: wrapFunction(native.getFeatureComparison),
  listFeatureComparisons: wrapFunction(native.listFeatureComparisons),
  addFeatureComparisonElement: wrapFunction(native.addFeatureComparisonElement),
  deleteFeatureComparisonElement: wrapFunction(native.deleteFeatureComparisonElement),
  addFeatureDistinctCallElement: wrapFunction(native.addFeatureDistinctCallElement),
  listFeatureClasses: wrapFunction(native.listFeatureClasses),
  getFeatureClass: wrapFunction(native.getFeatureClass),
  updateFeatureVersion: wrapFunction(native.updateFeatureVersion),

  // Rules
  addRule: wrapFunction(native.addRule),
  deleteRule: wrapFunction(native.deleteRule),
  getRule: wrapFunction(native.getRule),
  listRules: wrapFunction(native.listRules),
  setRule: wrapFunction(native.setRule),

  // Fragments
  addFragment: wrapFunction(native.addFragment),
  deleteFragment: wrapFunction(native.deleteFragment),
  getFragment: wrapFunction(native.getFragment),
  listFragments: wrapFunction(native.listFragments),
  setFragment: wrapFunction(native.setFragment),

  // Thresholds
  addComparisonThreshold: wrapFunction(native.addComparisonThreshold),
  deleteComparisonThreshold: wrapFunction(native.deleteComparisonThreshold),
  setComparisonThreshold: wrapFunction(native.setComparisonThreshold),
  listComparisonThresholds: wrapFunction(native.listComparisonThresholds),
  addGenericThreshold: wrapFunction(native.addGenericThreshold),
  deleteGenericThreshold: wrapFunction(native.deleteGenericThreshold),
  setGenericThreshold: wrapFunction(native.setGenericThreshold),
  listGenericThresholds: wrapFunction(native.listGenericThresholds),
  getThreshold: wrapFunction(native.getThreshold),
  setThreshold: wrapFunction(native.setThreshold),

  // Behavior Overrides
  addBehaviorOverride: wrapFunction(native.addBehaviorOverride),
  deleteBehaviorOverride: wrapFunction(native.deleteBehaviorOverride),
  getBehaviorOverride: wrapFunction(native.getBehaviorOverride),
  listBehaviorOverrides: wrapFunction(native.listBehaviorOverrides),

  // Generic Plans
  cloneGenericPlan: wrapFunction(native.cloneGenericPlan),
  deleteGenericPlan: wrapFunction(native.deleteGenericPlan),
  listGenericPlans: wrapFunction(native.listGenericPlans),
  setGenericPlan: wrapFunction(native.setGenericPlan),

  // Hashes
  addToNameHash: wrapFunction(native.addToNameHash),
  deleteFromNameHash: wrapFunction(native.deleteFromNameHash),
  addToSsnLast4Hash: wrapFunction(native.addToSsnLast4Hash),
  deleteFromSsnLast4Hash: wrapFunction(native.deleteFromSsnLast4Hash),

  // System Parameters
  listSystemParameters: wrapFunction(native.listSystemParameters),
  setSystemParameter: wrapFunction(native.setSystemParameter),

  // Config Sections
  addConfigSection: wrapFunction(native.addConfigSection),
  removeConfigSection: wrapFunction(native.removeConfigSection),
  getConfigSection: wrapFunction(native.getConfigSection),
  listConfigSections: wrapFunction(native.listConfigSections),
  addConfigSectionField: wrapFunction(native.addConfigSectionField),
  removeConfigSectionField: wrapFunction(native.removeConfigSectionField),

  // Versioning
  getVersion: wrapFunction(native.getVersion),
  getCompatibilityVersion: wrapFunction(native.getCompatibilityVersion),
  updateCompatibilityVersion: wrapFunction(native.updateCompatibilityVersion),
  verifyCompatibilityVersion: wrapFunction(native.verifyCompatibilityVersion),

  // Standardize Functions
  addStandardizeFunction: wrapFunction(native.addStandardizeFunction),
  deleteStandardizeFunction: wrapFunction(native.deleteStandardizeFunction),
  getStandardizeFunction: wrapFunction(native.getStandardizeFunction),
  listStandardizeFunctions: wrapFunction(native.listStandardizeFunctions),
  setStandardizeFunction: wrapFunction(native.setStandardizeFunction),

  // Expression Functions
  addExpressionFunction: wrapFunction(native.addExpressionFunction),
  deleteExpressionFunction: wrapFunction(native.deleteExpressionFunction),
  getExpressionFunction: wrapFunction(native.getExpressionFunction),
  listExpressionFunctions: wrapFunction(native.listExpressionFunctions),
  setExpressionFunction: wrapFunction(native.setExpressionFunction),

  // Comparison Functions
  addComparisonFunction: wrapFunction(native.addComparisonFunction),
  deleteComparisonFunction: wrapFunction(native.deleteComparisonFunction),
  getComparisonFunction: wrapFunction(native.getComparisonFunction),
  listComparisonFunctions: wrapFunction(native.listComparisonFunctions),
  setComparisonFunction: wrapFunction(native.setComparisonFunction),
  addComparisonFuncReturnCode: wrapFunction(native.addComparisonFuncReturnCode),

  // Distinct Functions
  addDistinctFunction: wrapFunction(native.addDistinctFunction),
  deleteDistinctFunction: wrapFunction(native.deleteDistinctFunction),
  getDistinctFunction: wrapFunction(native.getDistinctFunction),
  listDistinctFunctions: wrapFunction(native.listDistinctFunctions),
  setDistinctFunction: wrapFunction(native.setDistinctFunction),

  // Matching Functions
  addMatchingFunction: wrapFunction(native.addMatchingFunction),
  deleteMatchingFunction: wrapFunction(native.deleteMatchingFunction),
  getMatchingFunction: wrapFunction(native.getMatchingFunction),
  listMatchingFunctions: wrapFunction(native.listMatchingFunctions),
  setMatchingFunction: wrapFunction(native.setMatchingFunction),
  removeMatchingFunction: wrapFunction(native.removeMatchingFunction),

  // Scoring Functions
  addScoringFunction: wrapFunction(native.addScoringFunction),
  deleteScoringFunction: wrapFunction(native.deleteScoringFunction),
  getScoringFunction: wrapFunction(native.getScoringFunction),
  listScoringFunctions: wrapFunction(native.listScoringFunctions),
  setScoringFunction: wrapFunction(native.setScoringFunction),
  removeScoringFunction: wrapFunction(native.removeScoringFunction),

  // Candidate Functions
  addCandidateFunction: wrapFunction(native.addCandidateFunction),
  deleteCandidateFunction: wrapFunction(native.deleteCandidateFunction),
  getCandidateFunction: wrapFunction(native.getCandidateFunction),
  listCandidateFunctions: wrapFunction(native.listCandidateFunctions),
  setCandidateFunction: wrapFunction(native.setCandidateFunction),
  removeCandidateFunction: wrapFunction(native.removeCandidateFunction),

  // Validation Functions
  addValidationFunction: wrapFunction(native.addValidationFunction),
  deleteValidationFunction: wrapFunction(native.deleteValidationFunction),
  getValidationFunction: wrapFunction(native.getValidationFunction),
  listValidationFunctions: wrapFunction(native.listValidationFunctions),
  setValidationFunction: wrapFunction(native.setValidationFunction),
  removeValidationFunction: wrapFunction(native.removeValidationFunction),

  // Standardize Calls
  addStandardizeCall: wrapFunction(native.addStandardizeCall),
  deleteStandardizeCall: wrapFunction(native.deleteStandardizeCall),
  getStandardizeCall: wrapFunction(native.getStandardizeCall),
  listStandardizeCalls: wrapFunction(native.listStandardizeCalls),
  setStandardizeCall: wrapFunction(native.setStandardizeCall),
  addStandardizeCallElement: wrapFunction(native.addStandardizeCallElement),
  deleteStandardizeCallElement: wrapFunction(native.deleteStandardizeCallElement),
  setStandardizeCallElement: wrapFunction(native.setStandardizeCallElement),

  // Expression Calls
  addExpressionCall: wrapFunction(native.addExpressionCall),
  deleteExpressionCall: wrapFunction(native.deleteExpressionCall),
  getExpressionCall: wrapFunction(native.getExpressionCall),
  listExpressionCalls: wrapFunction(native.listExpressionCalls),
  setExpressionCall: wrapFunction(native.setExpressionCall),
  addExpressionCallElement: wrapFunction(native.addExpressionCallElement),
  deleteExpressionCallElement: wrapFunction(native.deleteExpressionCallElement),
  setExpressionCallElement: wrapFunction(native.setExpressionCallElement),

  // Comparison Calls
  addComparisonCall: wrapFunction(native.addComparisonCall),
  deleteComparisonCall: wrapFunction(native.deleteComparisonCall),
  getComparisonCall: wrapFunction(native.getComparisonCall),
  listComparisonCalls: wrapFunction(native.listComparisonCalls),
  setComparisonCall: wrapFunction(native.setComparisonCall),
  addComparisonCallElement: wrapFunction(native.addComparisonCallElement),
  deleteComparisonCallElement: wrapFunction(native.deleteComparisonCallElement),
  setComparisonCallElement: wrapFunction(native.setComparisonCallElement),

  // Distinct Calls
  addDistinctCall: wrapFunction(native.addDistinctCall),
  deleteDistinctCall: wrapFunction(native.deleteDistinctCall),
  getDistinctCall: wrapFunction(native.getDistinctCall),
  listDistinctCalls: wrapFunction(native.listDistinctCalls),
  setDistinctCall: wrapFunction(native.setDistinctCall),
  addDistinctCallElement: wrapFunction(native.addDistinctCallElement),
  deleteDistinctCallElement: wrapFunction(native.deleteDistinctCallElement),
  setDistinctCallElement: wrapFunction(native.setDistinctCallElement),

  // Command Processor
  processScript: wrapFunction(native.processScript),
  processFile: wrapFunction(native.processFile),

  // Meta
  bridgeVersion: native.bridgeVersion,
  SzConfigError,
};
