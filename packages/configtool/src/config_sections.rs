use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::config_sections;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi]
pub fn add_config_section(config_json: String, section_name: String) -> Result<String> {
    config_sections::add_config_section(&config_json, &section_name).map_err(config_error_to_napi)
}

#[napi]
pub fn remove_config_section(config_json: String, section_name: String) -> Result<String> {
    config_sections::remove_config_section(&config_json, &section_name)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn get_config_section(
    config_json: String,
    section_name: String,
    filter: Option<String>,
) -> Result<String> {
    let values =
        config_sections::get_config_section(&config_json, &section_name, filter.as_deref())
            .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi]
pub fn list_config_sections(config_json: String) -> Result<String> {
    let sections =
        config_sections::list_config_sections(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&sections).map_err(json_serialize_error)
}

#[napi]
pub fn add_config_section_field(
    config_json: String,
    section_name: String,
    field_name: String,
    field_value: String,
) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&field_value).map_err(json_serialize_error)?;
    let (config, _count) =
        config_sections::add_config_section_field(&config_json, &section_name, &field_name, &value)
            .map_err(config_error_to_napi)?;
    Ok(config)
}

#[napi]
pub fn remove_config_section_field(
    config_json: String,
    section_name: String,
    field_name: String,
) -> Result<String> {
    let (config, _count) =
        config_sections::remove_config_section_field(&config_json, &section_name, &field_name)
            .map_err(config_error_to_napi)?;
    Ok(config)
}
