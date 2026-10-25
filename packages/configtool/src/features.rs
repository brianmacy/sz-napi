use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::features;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddFeatureOptions {
    pub feature: String,
    pub element_list: String,
    pub class: Option<String>,
    pub behavior: Option<String>,
    pub candidates: Option<String>,
    pub anonymize: Option<String>,
    pub derived: Option<String>,
    pub history: Option<String>,
    pub matchkey: Option<String>,
    pub standardize: Option<String>,
    pub expression: Option<String>,
    pub comparison: Option<String>,
    pub version: Option<i64>,
    pub rtype_id: Option<i64>,
    /// Explicit FTYPE_ID; absent or <= 0 auto-assigns. A taken id is rejected.
    pub id: Option<i64>,
}

#[napi(object)]
pub struct SetFeatureOptions {
    pub feature: String,
    pub candidates: Option<String>,
    pub anonymize: Option<String>,
    pub derived: Option<String>,
    pub history: Option<String>,
    pub matchkey: Option<String>,
    pub behavior: Option<String>,
    pub class: Option<String>,
    pub version: Option<i64>,
    pub rtype_id: Option<i64>,
}

#[napi(object)]
pub struct AddFeatureComparisonOptions {
    pub feature_code: String,
    pub element_code: String,
    pub exec_order: Option<i64>,
    pub display_level: Option<i64>,
    pub display_delim: Option<String>,
    pub derived: Option<String>,
}

#[napi(object)]
pub struct GetFeatureComparisonOptions {
    pub feature_code: String,
    pub element_code: String,
}

#[napi(object)]
pub struct AddFeatureDistinctCallElementOptions {
    pub feature_code: String,
    pub distinct_func_code: String,
    pub element_code: Option<String>,
    pub exec_order: Option<i64>,
}

/// Add a new feature type (CFG_FTYPE row) with its element mappings (CFG_FBOM), creating any
/// element not already in CFG_FELEM. Defaults: class OTHER, behavior FM, candidates/anonymize/
/// derived No, history Yes, matchkey Yes when a comparison function is given (else No).
/// Optional standardize/expression/comparison function codes also add the matching call rows.
/// Throws `AlreadyExists` if the feature code or an explicit `id` is taken, `InvalidInput` for
/// an empty/invalid elementList or out-of-domain value, `NotFound` for an unknown class.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Feature code and `elementList` (a JSON array string whose items are element
///   codes or objects with `element`, `expressed`, `compared`, `display`/`displayLevel`,
///   `displayDelim`, `derived`), plus optional attributes; `id` absent or <= 0 auto-assigns.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_feature(config_json: String, options: AddFeatureOptions) -> Result<String> {
    let element_list: serde_json::Value =
        serde_json::from_str(&options.element_list).map_err(json_serialize_error)?;
    let params = features::AddFeatureParams {
        feature: &options.feature,
        element_list: &element_list,
        class: options.class.as_deref(),
        behavior: options.behavior.as_deref(),
        candidates: options.candidates.as_deref(),
        anonymize: options.anonymize.as_deref(),
        derived: options.derived.as_deref(),
        history: options.history.as_deref(),
        matchkey: options.matchkey.as_deref(),
        standardize: options.standardize.as_deref(),
        expression: options.expression.as_deref(),
        comparison: options.comparison.as_deref(),
        version: options.version,
        rtype_id: options.rtype_id,
        id: options.id,
    };
    features::add_feature(&config_json, params).map_err(config_error_to_napi)
}

/// Delete a feature type (CFG_FTYPE row) and everything tied to it: its CFG_FBOM and CFG_ATTR
/// rows and its standardize, expression, comparison, and distinct calls (with their BOM rows).
/// Throws `NotFound` if it does not exist and `InvalidInput` for the protected features NAME,
/// ADDRESS, PHONE, DOB, REL_LINK, REL_ANCHOR, REL_POINTER.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCodeOrId - The feature code, or its numeric FTYPE_ID as a string.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_feature(config_json: String, feature_code_or_id: String) -> Result<String> {
    features::delete_feature(&config_json, &feature_code_or_id).map_err(config_error_to_napi)
}

/// Get one feature type (CFG_FTYPE) by code (case-insensitive) or numeric id, with its
/// resolved class, behavior, functions, and elements. Throws `NotFound` if it does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCodeOrId - The feature code, or its numeric FTYPE_ID as a string.
/// @returns A JSON object string with keys `id`, `feature`, `class`, `behavior`, `anonymize`,
///   `candidates`, `standardize`, `expression`, `comparison`, `matchKey`, `version`, and
///   `elementList` (objects with `element`, `expressed`, `compared`, `derived`, `display`).
#[napi]
pub fn get_feature(config_json: String, feature_code_or_id: String) -> Result<String> {
    let value =
        features::get_feature(&config_json, &feature_code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// List all feature types (CFG_FTYPE), sorted by FTYPE_ID.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of feature objects, each shaped as returned by `getFeature`.
#[napi]
pub fn list_features(config_json: String) -> Result<String> {
    let values = features::list_features(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Update an existing feature type (CFG_FTYPE row) in place; only provided fields change.
/// `candidates` must be Yes/No, `matchkey` Yes/No/Confirm/Denial, and `behavior` a valid
/// behavior code; `anonymize`, `derived`, and `history` are written as given. Throws `NotFound`
/// for an unknown feature or class, and `InvalidInput` if no field actually changes.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - `feature` (code or numeric id) plus optional candidates, anonymize,
///   derived, history, matchkey, behavior, class, version, and rtypeId.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_feature(config_json: String, options: SetFeatureOptions) -> Result<String> {
    let params = features::SetFeatureParams {
        feature: &options.feature,
        candidates: options.candidates.as_deref(),
        anonymize: options.anonymize.as_deref(),
        derived: options.derived.as_deref(),
        history: options.history.as_deref(),
        matchkey: options.matchkey.as_deref(),
        behavior: options.behavior.as_deref(),
        class: options.class.as_deref(),
        version: options.version,
        rtype_id: options.rtype_id,
    };
    features::set_feature(&config_json, params).map_err(config_error_to_napi)
}

/// Add a feature-to-element mapping (CFG_FBOM row) for an existing feature and element.
/// EXEC_ORDER honors `execOrder` (rejected if taken) or takes the next free value across
/// CFG_FBOM; unset displayLevel/displayDelim/derived are stored as null. Throws `NotFound` for
/// an unknown feature or element and `AlreadyExists` if the mapping exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - featureCode, elementCode, and optional execOrder, displayLevel,
///   displayDelim, and derived.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_feature_comparison(
    config_json: String,
    options: AddFeatureComparisonOptions,
) -> Result<String> {
    let params = features::AddFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    features::add_feature_comparison(&config_json, params).map_err(config_error_to_napi)
}

/// Delete a feature-to-element mapping (CFG_FBOM row).
/// Throws `NotFound` if the feature, element, or mapping does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - The feature code.
/// @param elementCode - The element code.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_feature_comparison(
    config_json: String,
    feature_code: String,
    element_code: String,
) -> Result<String> {
    features::delete_feature_comparison(&config_json, &feature_code, &element_code)
        .map_err(config_error_to_napi)
}

/// Get one feature-to-element mapping (CFG_FBOM row).
/// Throws `NotFound` if the feature, element, or mapping does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - featureCode and elementCode identifying the mapping.
/// @returns A JSON object string of the raw CFG_FBOM row (FTYPE_ID, FELEM_ID, EXEC_ORDER,
///   DISPLAY_LEVEL, DISPLAY_DELIM, DERIVED).
#[napi]
pub fn get_feature_comparison(
    config_json: String,
    options: GetFeatureComparisonOptions,
) -> Result<String> {
    let params = features::GetFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
    };
    let value =
        features::get_feature_comparison(&config_json, params).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// List all feature-to-element mappings (CFG_FBOM rows), sorted by FTYPE_ID then EXEC_ORDER.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of raw CFG_FBOM row objects.
#[napi]
pub fn list_feature_comparisons(config_json: String) -> Result<String> {
    let values = features::list_feature_comparisons(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Alias of `addFeatureComparison`: adds a feature-to-element mapping (CFG_FBOM row).
/// Throws `NotFound` for an unknown feature or element and `AlreadyExists` if it exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - featureCode, elementCode, and optional execOrder, displayLevel,
///   displayDelim, and derived.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_feature_comparison_element(
    config_json: String,
    options: AddFeatureComparisonOptions,
) -> Result<String> {
    let params = features::AddFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    features::add_feature_comparison_element(&config_json, params).map_err(config_error_to_napi)
}

/// Alias of `deleteFeatureComparison`: deletes a feature-to-element mapping (CFG_FBOM row).
/// Throws `NotFound` if the feature, element, or mapping does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - The feature code.
/// @param elementCode - The element code.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_feature_comparison_element(
    config_json: String,
    feature_code: String,
    element_code: String,
) -> Result<String> {
    features::delete_feature_comparison_element(&config_json, &feature_code, &element_code)
        .map_err(config_error_to_napi)
}

/// Add a distinct call (CFG_DFCALL row) linking a feature to a distinct function; DFCALL_ID
/// is auto-assigned from 1000. `elementCode` is only validated (must exist) and `execOrder` is
/// not stored, as CFG_DFCALL has no element or order column. Throws `NotFound` for an unknown
/// feature, function, or element and `AlreadyExists` if the feature/function pair exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - featureCode, distinctFuncCode, and optional elementCode and execOrder.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_feature_distinct_call_element(
    config_json: String,
    options: AddFeatureDistinctCallElementOptions,
) -> Result<String> {
    let params = features::AddFeatureDistinctCallElementParams {
        feature_code: Some(options.feature_code.as_str()),
        distinct_func_code: Some(options.distinct_func_code.as_str()),
        element_code: options.element_code.as_deref(),
        exec_order: options.exec_order,
    };
    features::add_feature_distinct_call_element(&config_json, params).map_err(config_error_to_napi)
}

/// List all feature classes (CFG_FCLASS rows), sorted by FCLASS_ID.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of raw CFG_FCLASS row objects.
#[napi]
pub fn list_feature_classes(config_json: String) -> Result<String> {
    let values = features::list_feature_classes(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Get one feature class (CFG_FCLASS row) by numeric id or code (case-insensitive).
/// Throws `NotFound` if it does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param fclassIdOrCode - The FCLASS_ID as a numeric string, or the FCLASS_CODE.
/// @returns A JSON object string of the raw CFG_FCLASS row.
#[napi]
pub fn get_feature_class(config_json: String, fclass_id_or_code: String) -> Result<String> {
    let value = features::get_feature_class(&config_json, &fclass_id_or_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Set FEATURE_VERSION under CONFIG_BASE_VERSION.COMPATIBILITY_VERSION.
/// Throws `MissingSection` if COMPATIBILITY_VERSION is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param version - The new feature version string (stored as given).
/// @returns The updated configuration JSON string.
#[napi]
pub fn update_feature_version(config_json: String, version: String) -> Result<String> {
    features::update_feature_version(&config_json, &version).map_err(config_error_to_napi)
}
