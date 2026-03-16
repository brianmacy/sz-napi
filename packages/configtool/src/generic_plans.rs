use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::generic_plans;

use crate::error::config_error_to_napi;

#[napi]
pub fn clone_generic_plan(
    config_json: String,
    source_gplan_code: String,
    new_gplan_code: String,
    new_gplan_desc: Option<String>,
) -> Result<String> {
    let (config, _id) = generic_plans::clone_generic_plan(
        &config_json,
        &source_gplan_code,
        &new_gplan_code,
        new_gplan_desc.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(config)
}

#[napi]
pub fn delete_generic_plan(config_json: String, gplan_code: String) -> Result<String> {
    generic_plans::delete_generic_plan(&config_json, &gplan_code).map_err(config_error_to_napi)
}

#[napi]
pub fn list_generic_plans(config_json: String, filter: Option<String>) -> Result<String> {
    let values = generic_plans::list_generic_plans(&config_json, filter.as_deref())
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn set_generic_plan(
    config_json: String,
    gplan_code: String,
    gplan_desc: String,
) -> Result<String> {
    let (config, _id, _was_created) =
        generic_plans::set_generic_plan(&config_json, &gplan_code, &gplan_desc)
            .map_err(config_error_to_napi)?;
    Ok(config)
}
