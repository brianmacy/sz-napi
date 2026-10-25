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

#[napi]
pub fn list_comparison_thresholds(config_json: String) -> Result<String> {
    let values =
        thresholds::list_comparison_thresholds(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

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

#[napi]
pub fn list_generic_thresholds(config_json: String) -> Result<String> {
    let values = thresholds::list_generic_thresholds(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi]
pub fn get_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let value =
        thresholds::get_threshold(&config_json, threshold_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi]
pub fn set_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let params = thresholds::SetThresholdParams { threshold_id };
    thresholds::set_threshold(&config_json, params).map_err(config_error_to_napi)
}
