use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::fragments;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Adds a fragment row to CFG_ERFRAG.
/// `fragmentConfig` must contain ERFRAG_CODE and ERFRAG_SOURCE; the code is uppercased and used
/// as ERFRAG_DESC. FRAGMENT references in the source are validated and stored as ERFRAG_DEPENDS.
/// An ERFRAG_ID > 0 is honoured, otherwise the next id is assigned. Throws AlreadyExists if the
/// code (or requested id) is taken, InvalidInput for an unknown fragment reference.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param fragmentConfig - JSON object string with ERFRAG_CODE, ERFRAG_SOURCE, optional ERFRAG_ID.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_fragment(config_json: String, fragment_config: String) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&fragment_config).map_err(json_serialize_error)?;
    let (config, _id) =
        fragments::add_fragment(&config_json, &value).map_err(config_error_to_napi)?;
    Ok(config)
}

/// Deletes a fragment from CFG_ERFRAG by code (case-insensitive).
/// Throws NotFound if the fragment does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param fragmentCode - ERFRAG_CODE of the fragment to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_fragment(config_json: String, fragment_code: String) -> Result<String> {
    fragments::delete_fragment(&config_json, &fragment_code).map_err(config_error_to_napi)
}

/// Gets one fragment from CFG_ERFRAG, matched by ERFRAG_CODE (case-insensitive) first, then by
/// ERFRAG_ID. Throws NotFound if neither matches.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param codeOrId - Fragment code, or its numeric id as a string.
/// @returns JSON string of `{ id, fragment, source, depends }` (source/depends may be null).
#[napi]
pub fn get_fragment(config_json: String, code_or_id: String) -> Result<String> {
    let value = fragments::get_fragment(&config_json, &code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all fragments in CFG_ERFRAG. Returns an empty array if the section is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an array of `{ id, fragment, source, depends }` objects.
#[napi]
pub fn list_fragments(config_json: String) -> Result<String> {
    let values = fragments::list_fragments(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing CFG_ERFRAG row, matched by code (case-insensitive).
/// Each key of `fragmentConfig` is tri-state: absent leaves the value, null clears it, a string
/// sets it. Setting the source re-validates it and recomputes ERFRAG_DEPENDS; clearing it also
/// clears ERFRAG_DEPENDS. Throws NotFound if the fragment does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param fragmentCode - ERFRAG_CODE of the fragment to update.
/// @param fragmentConfig - JSON object string with `ERFRAG_SOURCE`/`source` and/or
///   `ERFRAG_DESC`/`description`.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_fragment(
    config_json: String,
    fragment_code: String,
    fragment_config: String,
) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&fragment_config).map_err(json_serialize_error)?;
    // Tri-state per key: absent = leave, null = clear, string = set
    // (ERFRAG_SOURCE / source, ERFRAG_DESC / description).
    let params = fragments::SetFragmentParams::try_from(&value).map_err(config_error_to_napi)?;
    fragments::set_fragment(&config_json, &fragment_code, params).map_err(config_error_to_napi)
}
