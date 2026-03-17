// ESM wrapper for @senzing/configtool — re-exports all named exports from the CJS entry point.
import configtool from './configtool.js';

export const {
  // Datasources
  addDataSource, setDataSource, getDataSource, deleteDataSource, listDataSources,
  // Attributes
  addAttribute, deleteAttribute, getAttribute, listAttributes, setAttribute,
  // Elements
  addElement, deleteElement, getElement, listElements, setElement,
  setFeatureElement, setFeatureElementDisplayLevel, setFeatureElementDerived,
  // Features
  addFeature, deleteFeature, getFeature, listFeatures, setFeature,
  addFeatureComparison, deleteFeatureComparison, getFeatureComparison, listFeatureComparisons,
  addFeatureComparisonElement, deleteFeatureComparisonElement,
  addFeatureDistinctCallElement, listFeatureClasses, getFeatureClass, updateFeatureVersion,
  // Rules
  addRule, deleteRule, getRule, listRules, setRule,
  // Fragments
  addFragment, deleteFragment, getFragment, listFragments, setFragment,
  // Thresholds
  addComparisonThreshold, deleteComparisonThreshold, setComparisonThreshold, listComparisonThresholds,
  addGenericThreshold, deleteGenericThreshold, setGenericThreshold, listGenericThresholds,
  getThreshold, setThreshold,
  // Behavior Overrides
  addBehaviorOverride, deleteBehaviorOverride, getBehaviorOverride, listBehaviorOverrides,
  // Generic Plans
  cloneGenericPlan, deleteGenericPlan, listGenericPlans, setGenericPlan,
  // Hashes
  addToNameHash, deleteFromNameHash, addToSsnLast4Hash, deleteFromSsnLast4Hash,
  // System Parameters
  listSystemParameters, setSystemParameter,
  // Config Sections
  addConfigSection, removeConfigSection, getConfigSection, listConfigSections,
  addConfigSectionField, removeConfigSectionField,
  // Versioning
  getVersion, getCompatibilityVersion, updateCompatibilityVersion, verifyCompatibilityVersion,
  // Standardize Functions
  addStandardizeFunction, deleteStandardizeFunction, getStandardizeFunction,
  listStandardizeFunctions, setStandardizeFunction,
  // Expression Functions
  addExpressionFunction, deleteExpressionFunction, getExpressionFunction,
  listExpressionFunctions, setExpressionFunction,
  // Comparison Functions
  addComparisonFunction, deleteComparisonFunction, getComparisonFunction,
  listComparisonFunctions, setComparisonFunction, addComparisonFuncReturnCode,
  // Distinct Functions
  addDistinctFunction, deleteDistinctFunction, getDistinctFunction,
  listDistinctFunctions, setDistinctFunction,
  // Matching Functions
  addMatchingFunction, deleteMatchingFunction, getMatchingFunction,
  listMatchingFunctions, setMatchingFunction, removeMatchingFunction,
  // Scoring Functions
  addScoringFunction, deleteScoringFunction, getScoringFunction,
  listScoringFunctions, setScoringFunction, removeScoringFunction,
  // Candidate Functions
  addCandidateFunction, deleteCandidateFunction, getCandidateFunction,
  listCandidateFunctions, setCandidateFunction, removeCandidateFunction,
  // Validation Functions
  addValidationFunction, deleteValidationFunction, getValidationFunction,
  listValidationFunctions, setValidationFunction, removeValidationFunction,
  // Standardize Calls
  addStandardizeCall, deleteStandardizeCall, getStandardizeCall,
  listStandardizeCalls, setStandardizeCall,
  addStandardizeCallElement, deleteStandardizeCallElement, setStandardizeCallElement,
  // Expression Calls
  addExpressionCall, deleteExpressionCall, getExpressionCall,
  listExpressionCalls, setExpressionCall,
  addExpressionCallElement, deleteExpressionCallElement, setExpressionCallElement,
  // Comparison Calls
  addComparisonCall, deleteComparisonCall, getComparisonCall,
  listComparisonCalls, setComparisonCall,
  addComparisonCallElement, deleteComparisonCallElement, setComparisonCallElement,
  // Distinct Calls
  addDistinctCall, deleteDistinctCall, getDistinctCall,
  listDistinctCalls, setDistinctCall,
  addDistinctCallElement, deleteDistinctCallElement, setDistinctCallElement,
  // Command Processor
  processScript, processFile,
  // Meta
  bridgeVersion, SzConfigError,
} = configtool;

export default configtool;
