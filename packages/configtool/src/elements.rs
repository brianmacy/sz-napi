use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::elements;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddElementOptions {
    pub code: String,
    /// Explicit FELEM_ID; absent or <= 0 auto-assigns. A taken id is rejected.
    pub id: Option<i64>,
    pub description: Option<String>,
    pub data_type: Option<String>,
    /// @deprecated Ignored since 0.10.0: TOKENIZED is not a CFG_FELEM column in Senzing v4; never written.
    pub tokenized: Option<String>,
}

#[napi(object)]
pub struct SetElementOptions {
    pub code: String,
    pub description: Option<String>,
    pub data_type: Option<String>,
    /// @deprecated Ignored since 0.10.0: TOKENIZED is not a CFG_FELEM column in Senzing v4; never written.
    pub tokenized: Option<String>,
}

#[napi(object)]
pub struct SetFeatureElementOptions {
    pub feature_code: String,
    pub element_code: String,
    pub exec_order: Option<i64>,
    pub display_level: Option<i64>,
    pub display_delim: Option<String>,
    pub derived: Option<String>,
}

/// Add a new feature element (CFG_FELEM row). The code is uppercased; `dataType` defaults to
/// `string` and must be one of string, number, date, datetime, json (else `InvalidInput`);
/// `description` defaults to the code. The deprecated `tokenized` option is ignored.
/// Throws `AlreadyExists` if the element code or an explicit `id` is taken.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Element code plus optional id (absent or <= 0 auto-assigns from 1000),
///   description, and dataType.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_element(config_json: String, options: AddElementOptions) -> Result<String> {
    let params = elements::AddElementParams {
        code: &options.code,
        description: options.description.as_deref(),
        data_type: options.data_type.as_deref(),
        id: options.id,
    };
    elements::add_element(&config_json, params).map_err(config_error_to_napi)
}

/// Delete a feature element (CFG_FELEM row) by code (case-insensitive).
/// Throws `NotFound` if it does not exist and `InvalidInput` if any feature still uses it
/// (CFG_FBOM linkage).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - The element code (FELEM_CODE) to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_element(config_json: String, code: String) -> Result<String> {
    elements::delete_element(&config_json, &code).map_err(config_error_to_napi)
}

/// Get one feature element (CFG_FELEM row) by code (case-insensitive).
/// Throws `NotFound` if it does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - The element code (FELEM_CODE) to look up.
/// @returns A JSON object string with keys `id`, `element`, and `datatype`.
#[napi]
pub fn get_element(config_json: String, code: String) -> Result<String> {
    let value = elements::get_element(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// List all feature elements in CFG_FELEM, sorted by element code.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys `id`, `element`, and `datatype`.
#[napi]
pub fn list_elements(config_json: String) -> Result<String> {
    let values = elements::list_elements(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Update an existing feature element (CFG_FELEM row) in place; only provided fields change.
/// `dataType` is written as given (not validated here). The deprecated `tokenized` option is
/// ignored. Throws `NotFound` if the element code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - The element code plus optional description and dataType.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_element(config_json: String, options: SetElementOptions) -> Result<String> {
    let params = elements::SetElementParams {
        code: &options.code,
        description: options.description.as_deref(),
        data_type: options.data_type.as_deref(),
    };
    elements::set_element(&config_json, params).map_err(config_error_to_napi)
}

/// Update an existing feature-to-element mapping (CFG_FBOM row) in place; only provided
/// fields change. `displayLevel` must be non-negative and `derived` Yes/No (else
/// `InvalidInput`). Throws `NotFound` if the feature, element, or mapping does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - featureCode and elementCode identifying the row, plus optional
///   execOrder, displayLevel, displayDelim, and derived.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_feature_element(
    config_json: String,
    options: SetFeatureElementOptions,
) -> Result<String> {
    let params = elements::SetFeatureElementParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    elements::set_feature_element(&config_json, params).map_err(config_error_to_napi)
}

/// Set DISPLAY_LEVEL on an existing feature-to-element mapping (CFG_FBOM row).
/// Equivalent to `setFeatureElement` with only `displayLevel`; a negative value throws
/// `InvalidInput` and a missing feature, element, or mapping throws `NotFound`.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - The feature code (e.g. NAME).
/// @param elementCode - The element code (e.g. FIRST_NAME).
/// @param displayLevel - The non-negative display level to store.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_feature_element_display_level(
    config_json: String,
    feature_code: String,
    element_code: String,
    display_level: i64,
) -> Result<String> {
    elements::set_feature_element_display_level(
        &config_json,
        &feature_code,
        &element_code,
        display_level,
    )
    .map_err(config_error_to_napi)
}

/// Set the DERIVED flag on an existing feature-to-element mapping (CFG_FBOM row).
/// Equivalent to `setFeatureElement` with only `derived`; a value other than Yes/No
/// (case-insensitive) throws `InvalidInput` and a missing mapping throws `NotFound`.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - The feature code (e.g. NAME).
/// @param elementCode - The element code (e.g. FIRST_NAME).
/// @param derived - `Yes` or `No`.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_feature_element_derived(
    config_json: String,
    feature_code: String,
    element_code: String,
    derived: String,
) -> Result<String> {
    elements::set_feature_element_derived(&config_json, &feature_code, &element_code, &derived)
        .map_err(config_error_to_napi)
}
