use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::search_profiles;

use crate::error::{config_error_to_napi, json_serialize_error};

/// One per-feature override of a search profile: `flag` is `Yes` (force the feature on as a candidate builder) or `No` (force it off).
#[napi(object)]
pub struct SearchProfileElement {
    pub feature: String,
    pub flag: String,
}

#[napi(object)]
pub struct AddSearchProfileOptions {
    /// SPROFILE_CODE (required)
    pub code: String,
    /// GPLAN_CODE of the generic plan the profile uses, e.g. `SEARCH` (required)
    pub plan: String,
    /// DEFAULT_USED_FOR_CAND: `Normal` (default) or `Off`
    pub candidates: Option<String>,
    pub description: Option<String>,
    /// Feature overrides; a feature may appear at most once
    pub elements: Option<Vec<SearchProfileElement>>,
}

/// Adds a search profile row to CFG_SPROFILE, creating the section if absent.
/// The code is uppercased; the generic plan and element features are resolved to ids and the
/// next SPROFILE_ID is assigned. Throws AlreadyExists for a taken code, NotFound for an unknown
/// plan or feature, and ValidationErrors for a bad `candidates`/flag value or repeated feature.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Profile code, generic plan code, and optional candidates, description,
///   and per-feature overrides.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_search_profile(config_json: String, options: AddSearchProfileOptions) -> Result<String> {
    let elements: Vec<(&str, &str)> = options
        .elements
        .as_deref()
        .unwrap_or(&[])
        .iter()
        .map(|e| (e.feature.as_str(), e.flag.as_str()))
        .collect();
    let params = search_profiles::AddSearchProfileParams {
        code: &options.code,
        generic_plan: &options.plan,
        candidates: options.candidates.as_deref(),
        description: options.description.as_deref(),
        elements,
    };
    search_profiles::add_search_profile(&config_json, params).map_err(config_error_to_napi)
}

/// Gets one search profile from CFG_SPROFILE by code (case-insensitive).
/// Throws NotFound if it does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - SPROFILE_CODE of the profile.
/// @returns JSON string of the raw CFG_SPROFILE row as stored.
#[napi]
pub fn get_search_profile(config_json: String, code: String) -> Result<String> {
    let value =
        search_profiles::get_search_profile(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists search profiles in CFG_SPROFILE, sorted by id, with ids resolved to codes.
/// Returns an empty array if the section is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param filter - Optional case-insensitive substring matched against each raw row's JSON.
/// @returns JSON string of an array of objects with `id`, `profile`, `description`,
///   `genericPlan`, `candidates`, `overrides` (`[{ feature, flag }]`) and `overridesRaw`.
#[napi]
pub fn list_search_profiles(config_json: String, filter: Option<String>) -> Result<String> {
    let values = search_profiles::list_search_profiles(&config_json, filter.as_deref())
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Deletes a search profile from CFG_SPROFILE, matched by code (case-insensitive) or id.
/// Throws NotFound if nothing matches and InvalidInput for the reserved `INGEST`/`SEARCH`
/// profiles.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param searchValue - SPROFILE_CODE, or SPROFILE_ID as a string.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_search_profile(config_json: String, search_value: String) -> Result<String> {
    search_profiles::delete_search_profile(&config_json, &search_value)
        .map_err(config_error_to_napi)
}
