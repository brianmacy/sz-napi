use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::error::SzConfigError;
use sz_configtool_lib::{helpers, thresholds};

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddComparisonThresholdOptions {
    pub cfunc_code: Option<String>,
    pub ftype_code: Option<String>,
    pub cfunc_rtnval: Option<String>,
    pub exec_order: Option<i64>,
    pub same_score: Option<i64>,
    pub close_score: Option<i64>,
    pub likely_score: Option<i64>,
    pub plausible_score: Option<i64>,
    pub un_likely_score: Option<i64>,
}

#[napi(object)]
pub struct SetComparisonThresholdOptions {
    pub cfunc_code: Option<String>,
    pub ftype_code: Option<String>,
    pub cfunc_rtnval: Option<String>,
    pub exec_order: Option<i64>,
    pub same_score: Option<i64>,
    pub close_score: Option<i64>,
    pub likely_score: Option<i64>,
    pub plausible_score: Option<i64>,
    pub un_likely_score: Option<i64>,
}

#[napi(object)]
pub struct AddGenericThresholdOptions {
    pub plan: Option<String>,
    pub behavior: Option<String>,
    pub scoring_cap: Option<i64>,
    pub candidate_cap: Option<i64>,
    pub send_to_redo: Option<String>,
    pub feature: Option<String>,
}

#[napi(object)]
pub struct SetGenericThresholdOptions {
    pub plan: Option<String>,
    pub behavior: Option<String>,
    pub feature: Option<String>,
    pub candidate_cap: Option<i64>,
    pub scoring_cap: Option<i64>,
    pub send_to_redo: Option<String>,
}

#[napi(object)]
pub struct DeleteGenericThresholdOptions {
    pub plan: Option<String>,
    pub behavior: Option<String>,
    pub feature: Option<String>,
}

/// Add a comparison threshold (CFG_CFRTN row) giving the score bands for one comparison
/// function return value, optionally scoped to a feature. `cfuncCode`, `ftypeCode` (or `all`
/// for every feature), and `cfuncRtnval` are required (else `MissingField`); `cfuncRtnval` is
/// uppercased. EXEC_ORDER reuses the matching all-features row's order when one exists, else
/// honors `execOrder` or allocates the next. Throws `AlreadyExists` for a duplicate row.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - cfuncCode, ftypeCode, cfuncRtnval, and optional execOrder plus
///   sameScore/closeScore/likelyScore/plausibleScore/unLikelyScore (unset scores are null).
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_comparison_threshold(
    config_json: String,
    options: AddComparisonThresholdOptions,
) -> Result<String> {
    let params = thresholds::AddComparisonThresholdParams {
        cfunc_code: options.cfunc_code.as_deref(),
        ftype_code: options.ftype_code.as_deref(),
        cfunc_rtnval: options.cfunc_rtnval.as_deref(),
        exec_order: options.exec_order,
        same_score: options.same_score,
        close_score: options.close_score,
        likely_score: options.likely_score,
        plausible_score: options.plausible_score,
        un_likely_score: options.un_likely_score,
    };
    thresholds::add_comparison_threshold(&config_json, params).map_err(config_error_to_napi)
}

/// Delete one comparison threshold (CFG_CFRTN) row, identified by
/// `(cfuncCode, ftypeCode, cfuncRtnval)`; `ftypeCode` may be `all` (FTYPE_ID 0).
///
/// `cfuncRtnval` is optional for backward compatibility: when omitted, the
/// row is resolved from `(cfuncCode, ftypeCode)` alone and must be unique,
/// otherwise an `InvalidInput` error asks for `cfuncRtnval`.
#[napi]
pub fn delete_comparison_threshold(
    config_json: String,
    cfunc_code: String,
    ftype_code: String,
    cfunc_rtnval: Option<String>,
) -> Result<String> {
    let rtnval = match cfunc_rtnval {
        Some(v) => v,
        None => unique_cfrtn_value(&config_json, &cfunc_code, &ftype_code)
            .map_err(config_error_to_napi)?,
    };
    thresholds::delete_comparison_threshold(&config_json, &cfunc_code, &ftype_code, &rtnval)
        .map_err(config_error_to_napi)
}

/// Resolve the single CFRTN_VALUE for `(cfunc, ftype)`, so the 3-arg JS call
/// keeps working when it is unambiguous. The library still performs the delete.
fn unique_cfrtn_value(
    config_json: &str,
    cfunc_code: &str,
    ftype_code: &str,
) -> std::result::Result<String, SzConfigError> {
    let cfunc_id = helpers::lookup_cfunc_id(config_json, cfunc_code)?;
    let ftype_id = if ftype_code.eq_ignore_ascii_case("all") {
        0
    } else {
        helpers::lookup_feature_id(config_json, ftype_code)?
    };
    let config: serde_json::Value =
        serde_json::from_str(config_json).map_err(|e| SzConfigError::JsonParse(e.to_string()))?;
    let values: Vec<String> = config["G2_CONFIG"]["CFG_CFRTN"]
        .as_array()
        .ok_or_else(|| SzConfigError::MissingSection("CFG_CFRTN".to_string()))?
        .iter()
        .filter(|row| {
            row["CFUNC_ID"].as_i64() == Some(cfunc_id) && row["FTYPE_ID"].as_i64() == Some(ftype_id)
        })
        .filter_map(|row| row["CFUNC_RTNVAL"].as_str().map(str::to_string))
        .collect();
    match values.as_slice() {
        [] => Err(SzConfigError::NotFound(format!(
            "Comparison threshold for cfunc='{cfunc_code}', ftype='{ftype_code}'"
        ))),
        [only] => Ok(only.clone()),
        _ => Err(SzConfigError::InvalidInput(format!(
            "{} comparison thresholds match cfunc='{cfunc_code}', ftype='{ftype_code}' ({}); pass cfuncRtnval",
            values.len(),
            values.join(", ")
        ))),
    }
}

/// Update an existing comparison threshold (CFG_CFRTN row) in place; only provided fields
/// change. The row is found by `(cfuncCode, ftypeCode, cfuncRtnval)`, all required; `ftypeCode`
/// may be `all` and `cfuncRtnval` matches case-insensitively. Throws `NotFound` if no row matches.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - cfuncCode, ftypeCode, cfuncRtnval identifying the row, plus optional
///   execOrder and sameScore/closeScore/likelyScore/plausibleScore/unLikelyScore.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_comparison_threshold(
    config_json: String,
    options: SetComparisonThresholdOptions,
) -> Result<String> {
    let params = thresholds::SetComparisonThresholdParams {
        cfunc_code: options.cfunc_code.as_deref(),
        ftype_code: options.ftype_code.as_deref(),
        cfunc_rtnval: options.cfunc_rtnval.as_deref(),
        exec_order: options.exec_order,
        same_score: options.same_score,
        close_score: options.close_score,
        likely_score: options.likely_score,
        plausible_score: options.plausible_score,
        un_likely_score: options.un_likely_score,
    };
    thresholds::set_comparison_threshold(&config_json, params).map_err(config_error_to_napi)
}

/// List all comparison thresholds (CFG_CFRTN) with function and feature codes resolved,
/// sorted by CFUNC_ID then CFRTN_ID. A FTYPE_ID of 0 is reported as feature `all`.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys `id`, `function`, `returnOrder`,
///   `scoreName`, `feature`, `sameScore`, `closeScore`, `likelyScore`, `plausibleScore`,
///   `unlikelyScore` (missing scores reported as 0).
#[napi]
pub fn list_comparison_thresholds(config_json: String) -> Result<String> {
    let values =
        thresholds::list_comparison_thresholds(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Add a generic threshold (CFG_GENERIC_THRESHOLD row) setting candidate/scoring caps for a
/// generic plan and behavior, optionally per feature (default `all`). plan, behavior,
/// scoringCap, candidateCap, and sendToRedo are required (one `MissingField` lists all absent).
/// Throws `NotFound` for an unknown plan or feature, `AlreadyExists` for a duplicate
/// (plan, behavior, feature), and `ValidationErrors` for an unknown behavior or a sendToRedo
/// other than Yes/No.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - plan, behavior, scoringCap, candidateCap, sendToRedo, and optional feature.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_generic_threshold(
    config_json: String,
    options: AddGenericThresholdOptions,
) -> Result<String> {
    let params = thresholds::AddGenericThresholdParams {
        plan: options.plan.as_deref(),
        behavior: options.behavior.as_deref(),
        scoring_cap: options.scoring_cap,
        candidate_cap: options.candidate_cap,
        send_to_redo: options.send_to_redo.as_deref(),
        feature: options.feature.as_deref(),
    };
    thresholds::add_generic_threshold(&config_json, params).map_err(config_error_to_napi)
}

/// Delete a generic threshold (CFG_GENERIC_THRESHOLD row) identified by plan, behavior, and
/// feature (default `all`). plan and behavior are required (else `MissingField`).
/// Throws `NotFound` if the plan, feature, or row does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - plan, behavior, and optional feature identifying the row.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_generic_threshold(
    config_json: String,
    options: DeleteGenericThresholdOptions,
) -> Result<String> {
    let params = thresholds::DeleteGenericThresholdParams {
        plan: options.plan.as_deref(),
        behavior: options.behavior.as_deref(),
        feature: options.feature.as_deref(),
    };
    thresholds::delete_generic_threshold(&config_json, params).map_err(config_error_to_napi)
}

/// Update an existing generic threshold (CFG_GENERIC_THRESHOLD row) in place; only provided
/// caps/flags change. The row is found by plan, behavior, and feature (default `all`; used only
/// as a lookup key). Throws `MissingField` without plan/behavior, `NotFound` if no row matches,
/// and `ValidationErrors` for a sendToRedo other than Yes/No.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - plan, behavior, optional feature, plus optional candidateCap, scoringCap,
///   and sendToRedo.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_generic_threshold(
    config_json: String,
    options: SetGenericThresholdOptions,
) -> Result<String> {
    let params = thresholds::SetGenericThresholdParams {
        plan: options.plan.as_deref(),
        behavior: options.behavior.as_deref(),
        feature: options.feature.as_deref(),
        candidate_cap: options.candidate_cap,
        scoring_cap: options.scoring_cap,
        send_to_redo: options.send_to_redo.as_deref(),
    };
    thresholds::set_generic_threshold(&config_json, params).map_err(config_error_to_napi)
}

/// List all generic thresholds (CFG_GENERIC_THRESHOLD) with plan and feature codes resolved,
/// sorted by GPLAN_ID then canonical behavior order. A FTYPE_ID of 0 is reported as `all`.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys `id` (the GPLAN_ID), `plan`, `behavior`,
///   `feature`, `candidateCap`, `scoringCap`, `sendToRedo`.
#[napi]
pub fn list_generic_thresholds(config_json: String) -> Result<String> {
    let values = thresholds::list_generic_thresholds(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Not implemented: the underlying library is a placeholder and always throws `InvalidInput`
/// ("get_threshold not yet implemented").
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param thresholdId - Threshold id (unused).
/// @returns Never returns; always throws.
#[napi]
pub fn get_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let value =
        thresholds::get_threshold(&config_json, threshold_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Not implemented: the underlying library is a placeholder and always throws `InvalidInput`
/// ("set_threshold not yet implemented").
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param thresholdId - Threshold id (unused).
/// @returns Never returns; always throws.
#[napi]
pub fn set_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let params = thresholds::SetThresholdParams { threshold_id };
    thresholds::set_threshold(&config_json, params).map_err(config_error_to_napi)
}
