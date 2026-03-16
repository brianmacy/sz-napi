use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::behavior_overrides;

use crate::error::config_error_to_napi;

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

#[napi]
pub fn delete_behavior_override(
    config_json: String,
    feature_code: String,
    usage_type: String,
) -> Result<String> {
    behavior_overrides::delete_behavior_override(&config_json, &feature_code, &usage_type)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn get_behavior_override(
    config_json: String,
    feature_code: String,
    usage_type: String,
) -> Result<String> {
    let value =
        behavior_overrides::get_behavior_override(&config_json, &feature_code, &usage_type)
            .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn list_behavior_overrides(config_json: String) -> Result<String> {
    let values =
        behavior_overrides::list_behavior_overrides(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}
