use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::attributes;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddAttributeOptions {
    pub attribute: String,
    pub feature: String,
    pub element: String,
    pub class: String,
    pub default_value: Option<String>,
    pub internal: Option<String>,
    pub required: Option<String>,
    /// Explicit ATTR_ID; absent or <= 0 auto-assigns (seeded at 1000). A taken id is rejected.
    pub id: Option<i64>,
}

#[napi(object)]
pub struct SetAttributeOptions {
    pub attribute: String,
    pub internal: Option<String>,
    pub required: Option<String>,
    pub default_value: Option<String>,
}

/// Add a new attribute (CFG_ATTR row) mapping an attribute code to a feature element.
/// Codes are uppercased; the feature and element must already exist. `class` must be one of
/// NAME, ATTRIBUTE, IDENTIFIER, ADDRESS, PHONE, RELATIONSHIP, OTHER (else `InvalidInput`);
/// `required` defaults to No (Yes/No/Any/Desired) and `internal` to No (Yes/No).
/// Throws `AlreadyExists` if the attribute code or an explicit `id` is taken.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Attribute code, feature, element, class, and optional
///   defaultValue/internal/required/id (absent or <= 0 auto-assigns from 1000).
/// @returns The updated configuration JSON string.
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
        id: options.id,
    };
    let (config, _value) =
        attributes::add_attribute(&config_json, params).map_err(config_error_to_napi)?;
    Ok(config)
}

/// Delete an attribute (CFG_ATTR row) by its code (case-insensitive).
/// Throws `NotFound` if no attribute has that code.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - The attribute code (ATTR_CODE) to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_attribute(config_json: String, code: String) -> Result<String> {
    attributes::delete_attribute(&config_json, &code).map_err(config_error_to_napi)
}

/// Get one attribute (CFG_ATTR row) by its code (case-insensitive).
/// Throws `NotFound` if no attribute has that code.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - The attribute code (ATTR_CODE) to look up.
/// @returns A JSON object string of the raw CFG_ATTR row (ATTR_ID, ATTR_CODE, ATTR_CLASS,
///   FTYPE_CODE, FELEM_CODE, FELEM_REQ, DEFAULT_VALUE, INTERNAL).
#[napi]
pub fn get_attribute(config_json: String, code: String) -> Result<String> {
    let value = attributes::get_attribute(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// List all attributes in CFG_ATTR.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys `id`, `attribute`, `class`, `feature`,
///   `element`, `required`, `default`, `internal`.
#[napi]
pub fn list_attributes(config_json: String) -> Result<String> {
    let values = attributes::list_attributes(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Update an existing attribute (CFG_ATTR row) in place; only provided fields change.
/// `internal` must be Yes/No and `required` Yes/No/Any/Desired (case-insensitive, else
/// `InvalidInput`). Throws `NotFound` if the attribute code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - The attribute code plus optional internal, required, and defaultValue.
/// @returns The updated configuration JSON string.
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
