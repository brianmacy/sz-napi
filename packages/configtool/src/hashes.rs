use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::hashes;

use crate::error::config_error_to_napi;

/// Adds a value to the SYS_OOM NAME_HASH array (created if absent).
/// Matching is exact (case-sensitive). Throws AlreadyExists if present, NotFound if SYS_OOM is
/// missing.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param name - The value to add.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_to_name_hash(config_json: String, name: String) -> Result<String> {
    hashes::add_to_name_hash(&config_json, &name).map_err(config_error_to_napi)
}

/// Removes a value from the SYS_OOM NAME_HASH array (exact, case-sensitive match).
/// Throws NotFound if the value is not present.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param name - The value to remove.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_from_name_hash(config_json: String, name: String) -> Result<String> {
    hashes::delete_from_name_hash(&config_json, &name).map_err(config_error_to_napi)
}

/// Adds a value to the SYS_OOM SSN_LAST4_HASH array (created if absent).
/// Matching is exact (case-sensitive). Throws AlreadyExists if present, NotFound if SYS_OOM is
/// missing.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param name - The value to add.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_to_ssn_last4_hash(config_json: String, name: String) -> Result<String> {
    hashes::add_to_ssn_last4_hash(&config_json, &name).map_err(config_error_to_napi)
}

/// Removes a value from the SYS_OOM SSN_LAST4_HASH array (exact, case-sensitive match).
/// Throws NotFound if the value, the array or SYS_OOM is missing.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param name - The value to remove.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_from_ssn_last4_hash(config_json: String, name: String) -> Result<String> {
    hashes::delete_from_ssn_last4_hash(&config_json, &name).map_err(config_error_to_napi)
}
