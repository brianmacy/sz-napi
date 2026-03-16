use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::versioning;

use crate::error::config_error_to_napi;

#[napi]
pub fn get_version(config_json: String) -> Result<String> {
    versioning::get_version(&config_json).map_err(config_error_to_napi)
}

#[napi]
pub fn get_compatibility_version(config_json: String) -> Result<String> {
    versioning::get_compatibility_version(&config_json).map_err(config_error_to_napi)
}

#[napi]
pub fn update_compatibility_version(config_json: String, new_version: String) -> Result<String> {
    versioning::update_compatibility_version(&config_json, &new_version)
        .map_err(config_error_to_napi)
}

#[napi(object)]
pub struct VerifyCompatibilityVersionResult {
    pub current_version: String,
    pub matches: bool,
}

#[napi]
pub fn verify_compatibility_version(
    config_json: String,
    expected_version: String,
) -> Result<VerifyCompatibilityVersionResult> {
    let (current_version, matches) =
        versioning::verify_compatibility_version(&config_json, &expected_version)
            .map_err(config_error_to_napi)?;
    Ok(VerifyCompatibilityVersionResult {
        current_version,
        matches,
    })
}
