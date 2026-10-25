use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::system_params;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Lists system parameters. Currently only `relationshipsBreakMatches`, read from BREAK_RES of
/// the CFG_RTYPE row with RCLASS_ID 2; omitted if that row or value is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an object mapping parameter name to its value as a string.
#[napi]
pub fn list_system_parameters(config_json: String) -> Result<String> {
    let params =
        system_params::list_system_parameters(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&params).map_err(json_serialize_error)
}

/// Sets a system parameter. Only `relationshipsBreakMatches` (case-insensitive, also
/// `relationships_break_matches`) is supported; it writes BREAK_RES on the CFG_RTYPE row with
/// RCLASS_ID 2. Throws InvalidConfig for an unknown name, NotFound if that row is missing.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param parameterName - The parameter name.
/// @param parameterValue - The value as JSON text (e.g. `1`), written as-is.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_system_parameter(
    config_json: String,
    parameter_name: String,
    parameter_value: String,
) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&parameter_value).map_err(json_serialize_error)?;
    system_params::set_system_parameter(&config_json, &parameter_name, &value)
        .map_err(config_error_to_napi)
}
