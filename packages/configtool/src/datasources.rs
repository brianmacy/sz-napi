use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::datasources;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddDataSourceOptions {
    pub code: String,
    pub retention_level: Option<String>,
    pub conversational: Option<String>,
    pub reliability: Option<i64>,
}

#[napi(object)]
pub struct SetDataSourceOptions {
    pub retention_level: Option<String>,
    pub conversational: Option<String>,
    pub reliability: Option<i64>,
}

#[napi]
pub fn add_data_source(config_json: String, options: AddDataSourceOptions) -> Result<String> {
    let params = datasources::AddDataSourceParams {
        code: &options.code,
        retention_level: options.retention_level.as_deref(),
        conversational: options.conversational.as_deref(),
        reliability: options.reliability,
    };
    datasources::add_data_source(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn set_data_source(
    config_json: String,
    code: String,
    options: SetDataSourceOptions,
) -> Result<String> {
    let params = datasources::SetDataSourceParams {
        code: &code,
        retention_level: options.retention_level.as_deref(),
        conversational: options.conversational.as_deref(),
        reliability: options.reliability,
    };
    datasources::set_data_source(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn get_data_source(config_json: String, code: String) -> Result<String> {
    let value = datasources::get_data_source(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi]
pub fn delete_data_source(config_json: String, code: String) -> Result<String> {
    datasources::delete_data_source(&config_json, &code).map_err(config_error_to_napi)
}

#[napi]
pub fn list_data_sources(config_json: String) -> Result<String> {
    let values = datasources::list_data_sources(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}
