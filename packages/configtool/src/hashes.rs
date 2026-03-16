use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::hashes;

use crate::error::config_error_to_napi;

#[napi]
pub fn add_to_name_hash(config_json: String, name: String) -> Result<String> {
    hashes::add_to_name_hash(&config_json, &name).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_from_name_hash(config_json: String, name: String) -> Result<String> {
    hashes::delete_from_name_hash(&config_json, &name).map_err(config_error_to_napi)
}

#[napi]
pub fn add_to_ssn_last4_hash(config_json: String, name: String) -> Result<String> {
    hashes::add_to_ssn_last4_hash(&config_json, &name).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_from_ssn_last4_hash(config_json: String, name: String) -> Result<String> {
    hashes::delete_from_ssn_last4_hash(&config_json, &name).map_err(config_error_to_napi)
}
