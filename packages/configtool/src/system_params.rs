use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::system_params;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi]
pub fn list_system_parameters(config_json: String) -> Result<String> {
    let params =
        system_params::list_system_parameters(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&params).map_err(json_serialize_error)
}

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
