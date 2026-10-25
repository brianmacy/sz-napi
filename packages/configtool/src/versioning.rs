use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::versioning;

use crate::error::config_error_to_napi;

/// Gets the configuration version from CONFIG_BASE_VERSION.VERSION.
/// Throws NotFound if it is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns The VERSION string, e.g. `4.0.0`.
#[napi]
pub fn get_version(config_json: String) -> Result<String> {
    versioning::get_version(&config_json).map_err(config_error_to_napi)
}

/// Gets the compatibility version from CONFIG_BASE_VERSION.COMPATIBILITY_VERSION.CONFIG_VERSION.
/// Throws NotFound if it is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns The CONFIG_VERSION string, e.g. `11`.
#[napi]
pub fn get_compatibility_version(config_json: String) -> Result<String> {
    versioning::get_compatibility_version(&config_json).map_err(config_error_to_napi)
}

/// Sets CONFIG_BASE_VERSION.COMPATIBILITY_VERSION.CONFIG_VERSION.
/// Throws NotFound if CONFIG_BASE_VERSION or COMPATIBILITY_VERSION is missing.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param newVersion - The new CONFIG_VERSION string.
/// @returns The updated configuration JSON string.
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

/// Compares CONFIG_BASE_VERSION.COMPATIBILITY_VERSION.CONFIG_VERSION with an expected value
/// (exact string match). Throws NotFound if CONFIG_VERSION is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param expectedVersion - The expected CONFIG_VERSION string.
/// @returns An object `{ currentVersion, matches }`.
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
