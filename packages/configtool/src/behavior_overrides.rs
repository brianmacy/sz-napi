use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::behavior_overrides;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Adds a feature behavior override to CFG_FBOVR for a feature and usage type.
/// The behavior code (e.g. `F1E`) is split into FTYPE_FREQ/FTYPE_EXCL/FTYPE_STAB. Throws
/// NotFound for an unknown feature, AlreadyExists if an override exists for the pair, and
/// InvalidInput for an invalid behavior code.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - FTYPE_CODE of the feature (case-insensitive).
/// @param usageType - UTYPE_CODE, e.g. `BUSINESS` (uppercased).
/// @param behavior - Behavior code: frequency plus optional `E`/`S` suffixes, e.g. `F1ES`.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_behavior_override(
    config_json: String,
    feature_code: String,
    usage_type: String,
    behavior: String,
) -> Result<String> {
    let params =
        behavior_overrides::AddBehaviorOverrideParams::new(&feature_code, &usage_type, &behavior);
    behavior_overrides::add_behavior_override(&config_json, params).map_err(config_error_to_napi)
}

/// Deletes the CFG_FBOVR override for a feature and usage type.
/// Throws NotFound if the feature or override does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - FTYPE_CODE of the feature (case-insensitive).
/// @param usageType - UTYPE_CODE of the override (case-insensitive).
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_behavior_override(
    config_json: String,
    feature_code: String,
    usage_type: String,
) -> Result<String> {
    behavior_overrides::delete_behavior_override(&config_json, &feature_code, &usage_type)
        .map_err(config_error_to_napi)
}

/// Gets the CFG_FBOVR override for a feature and usage type.
/// Throws NotFound if the feature or override does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param featureCode - FTYPE_CODE of the feature (case-insensitive).
/// @param usageType - UTYPE_CODE of the override (case-insensitive).
/// @returns JSON string of the raw CFG_FBOVR row (FTYPE_ID, UTYPE_CODE, FTYPE_FREQ, FTYPE_EXCL,
///   FTYPE_STAB).
#[napi]
pub fn get_behavior_override(
    config_json: String,
    feature_code: String,
    usage_type: String,
) -> Result<String> {
    let value = behavior_overrides::get_behavior_override(&config_json, &feature_code, &usage_type)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all behavior overrides in CFG_FBOVR, sorted by FTYPE_ID.
/// Throws MissingSection if CFG_FBOVR is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an array of raw CFG_FBOVR rows.
#[napi]
pub fn list_behavior_overrides(config_json: String) -> Result<String> {
    let values =
        behavior_overrides::list_behavior_overrides(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}
