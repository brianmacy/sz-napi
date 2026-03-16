use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::elements;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddElementOptions {
    pub code: String,
    pub description: Option<String>,
    pub data_type: Option<String>,
    pub tokenized: Option<String>,
}

#[napi(object)]
pub struct SetElementOptions {
    pub code: String,
    pub description: Option<String>,
    pub data_type: Option<String>,
    pub tokenized: Option<String>,
}

#[napi(object)]
pub struct SetFeatureElementOptions {
    pub feature_code: String,
    pub element_code: String,
    pub exec_order: Option<i64>,
    pub display_level: Option<i64>,
    pub display_delim: Option<String>,
    pub derived: Option<String>,
}

#[napi]
pub fn add_element(config_json: String, options: AddElementOptions) -> Result<String> {
    let params = elements::AddElementParams {
        code: &options.code,
        description: options.description.as_deref(),
        data_type: options.data_type.as_deref(),
        tokenized: options.tokenized.as_deref(),
    };
    elements::add_element(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_element(config_json: String, code: String) -> Result<String> {
    elements::delete_element(&config_json, &code).map_err(config_error_to_napi)
}

#[napi]
pub fn get_element(config_json: String, code: String) -> Result<String> {
    let value = elements::get_element(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi]
pub fn list_elements(config_json: String) -> Result<String> {
    let values = elements::list_elements(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi]
pub fn set_element(config_json: String, options: SetElementOptions) -> Result<String> {
    let params = elements::SetElementParams {
        code: &options.code,
        description: options.description.as_deref(),
        data_type: options.data_type.as_deref(),
        tokenized: options.tokenized.as_deref(),
    };
    elements::set_element(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn set_feature_element(
    config_json: String,
    options: SetFeatureElementOptions,
) -> Result<String> {
    let params = elements::SetFeatureElementParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    elements::set_feature_element(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn set_feature_element_display_level(
    config_json: String,
    feature_code: String,
    element_code: String,
    display_level: i64,
) -> Result<String> {
    elements::set_feature_element_display_level(
        &config_json,
        &feature_code,
        &element_code,
        display_level,
    )
    .map_err(config_error_to_napi)
}

#[napi]
pub fn set_feature_element_derived(
    config_json: String,
    feature_code: String,
    element_code: String,
    derived: String,
) -> Result<String> {
    elements::set_feature_element_derived(&config_json, &feature_code, &element_code, &derived)
        .map_err(config_error_to_napi)
}
