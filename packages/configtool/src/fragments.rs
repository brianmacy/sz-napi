use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::fragments;

use crate::error::config_error_to_napi;

#[napi]
pub fn add_fragment(config_json: String, fragment_config: String) -> Result<String> {
    let value: serde_json::Value = serde_json::from_str(&fragment_config).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })?;
    let (config, _id) =
        fragments::add_fragment(&config_json, &value).map_err(config_error_to_napi)?;
    Ok(config)
}

#[napi]
pub fn delete_fragment(config_json: String, fragment_code: String) -> Result<String> {
    fragments::delete_fragment(&config_json, &fragment_code).map_err(config_error_to_napi)
}

#[napi]
pub fn get_fragment(config_json: String, code_or_id: String) -> Result<String> {
    let value =
        fragments::get_fragment(&config_json, &code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn list_fragments(config_json: String) -> Result<String> {
    let values = fragments::list_fragments(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn set_fragment(
    config_json: String,
    fragment_code: String,
    fragment_config: String,
) -> Result<String> {
    let value: serde_json::Value = serde_json::from_str(&fragment_config).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })?;
    fragments::set_fragment(&config_json, &fragment_code, &value).map_err(config_error_to_napi)
}
