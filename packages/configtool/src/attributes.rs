use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::attributes;

use crate::error::config_error_to_napi;

#[napi(object)]
pub struct AddAttributeOptions {
    pub attribute: String,
    pub feature: String,
    pub element: String,
    pub class: String,
    pub default_value: Option<String>,
    pub internal: Option<String>,
    pub required: Option<String>,
}

#[napi(object)]
pub struct SetAttributeOptions {
    pub attribute: String,
    pub internal: Option<String>,
    pub required: Option<String>,
    pub default_value: Option<String>,
}

#[napi]
pub fn add_attribute(config_json: String, options: AddAttributeOptions) -> Result<String> {
    let params = attributes::AddAttributeParams {
        attribute: &options.attribute,
        feature: &options.feature,
        element: &options.element,
        class: &options.class,
        default_value: options.default_value.as_deref(),
        internal: options.internal.as_deref(),
        required: options.required.as_deref(),
    };
    let (config, _value) = attributes::add_attribute(&config_json, params).map_err(config_error_to_napi)?;
    Ok(config)
}

#[napi]
pub fn delete_attribute(config_json: String, code: String) -> Result<String> {
    attributes::delete_attribute(&config_json, &code).map_err(config_error_to_napi)
}

#[napi]
pub fn get_attribute(config_json: String, code: String) -> Result<String> {
    let value = attributes::get_attribute(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn list_attributes(config_json: String) -> Result<String> {
    let values = attributes::list_attributes(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn set_attribute(config_json: String, options: SetAttributeOptions) -> Result<String> {
    let params = attributes::SetAttributeParams {
        attribute: &options.attribute,
        internal: options.internal.as_deref(),
        required: options.required.as_deref(),
        default_value: options.default_value.as_deref(),
    };
    attributes::set_attribute(&config_json, params).map_err(config_error_to_napi)
}
