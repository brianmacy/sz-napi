use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::generic_plans;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Clones a generic plan in CFG_GPLAN, copying all of its CFG_GENERIC_THRESHOLD rows.
/// Codes are uppercased; the new GPLAN_ID is max + 1. Throws NotFound if the source plan does
/// not exist and AlreadyExists if the new code is taken.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sourceGplanCode - GPLAN_CODE of the plan to copy.
/// @param newGplanCode - GPLAN_CODE for the new plan.
/// @param newGplanDesc - GPLAN_DESC for the new plan; defaults to the new code.
/// @returns The updated configuration JSON string.
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

/// Deletes a generic plan from CFG_GPLAN and its CFG_GENERIC_THRESHOLD rows, by code
/// (case-insensitive). Throws NotFound if it does not exist and InvalidInput for system plans
/// (GPLAN_ID <= 2).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param gplanCode - GPLAN_CODE of the plan to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_generic_plan(config_json: String, gplan_code: String) -> Result<String> {
    generic_plans::delete_generic_plan(&config_json, &gplan_code).map_err(config_error_to_napi)
}

/// Lists generic plans in CFG_GPLAN, sorted by id.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param filter - Optional case-insensitive substring matched against each raw row's JSON.
/// @returns JSON string of an array of `{ id, plan, description }` objects.
#[napi]
pub fn list_generic_plans(config_json: String, filter: Option<String>) -> Result<String> {
    let values = generic_plans::list_generic_plans(&config_json, filter.as_deref())
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Creates or updates a generic plan in CFG_GPLAN, matched by code (case-insensitive).
/// An existing plan gets the new GPLAN_DESC; otherwise a new plan is added with GPLAN_ID max + 1.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param gplanCode - GPLAN_CODE of the plan.
/// @param gplanDesc - GPLAN_DESC to write.
/// @returns The updated configuration JSON string.
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
