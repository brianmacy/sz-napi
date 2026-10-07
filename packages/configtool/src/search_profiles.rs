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

#[napi]
pub fn get_search_profile(config_json: String, code: String) -> Result<String> {
    let value =
        search_profiles::get_search_profile(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi]
pub fn list_search_profiles(config_json: String, filter: Option<String>) -> Result<String> {
    let values = search_profiles::list_search_profiles(&config_json, filter.as_deref())
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi]
pub fn delete_search_profile(config_json: String, search_value: String) -> Result<String> {
    search_profiles::delete_search_profile(&config_json, &search_value)
        .map_err(config_error_to_napi)
}
