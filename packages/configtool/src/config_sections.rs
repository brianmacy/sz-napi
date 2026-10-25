use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::config_sections;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Adds a new, empty top-level section (an empty array) under G2_CONFIG.
/// The name is uppercased. Throws AlreadyExists if the section exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sectionName - Name of the section, e.g. `CFG_CUSTOM`.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_config_section(config_json: String, section_name: String) -> Result<String> {
    config_sections::add_config_section(&config_json, &section_name).map_err(config_error_to_napi)
}

/// Removes a top-level section from G2_CONFIG. The name is uppercased.
/// Throws NotFound if the section does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sectionName - Name of the section to remove.
/// @returns The updated configuration JSON string.
#[napi]
pub fn remove_config_section(config_json: String, section_name: String) -> Result<String> {
    config_sections::remove_config_section(&config_json, &section_name)
        .map_err(config_error_to_napi)
}

/// Gets the rows of a top-level G2_CONFIG section.
/// The name is matched exactly (not uppercased). Throws NotFound if the section does not exist.
/// A non-array section is returned as a single-element array.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sectionName - Name of the section, e.g. `CFG_ATTR`.
/// @param filter - Optional case-insensitive substring matched against each row's JSON.
/// @returns JSON string of an array of the section's raw rows (empty if none match).
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

/// Lists the names of all top-level sections under G2_CONFIG.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an array of section name strings.
#[napi]
pub fn list_config_sections(config_json: String) -> Result<String> {
    let sections =
        config_sections::list_config_sections(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&sections).map_err(json_serialize_error)
}

/// Adds a field to every row of a G2_CONFIG array section.
/// Section and field names are uppercased; rows that already have the field are left unchanged.
/// Throws NotFound if the section does not exist or is not an array.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sectionName - Name of the section.
/// @param fieldName - Name of the field to add.
/// @param fieldValue - The field's value as JSON text (e.g. `"\"x\""`, `0`, `null`).
/// @returns The updated configuration JSON string.
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

/// Removes a field from every row of a G2_CONFIG array section.
/// Section and field names are uppercased. Throws NotFound if the section does not exist or is
/// not an array.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sectionName - Name of the section.
/// @param fieldName - Name of the field to remove.
/// @returns The updated configuration JSON string.
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
