use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::thresholds;

use crate::error::config_error_to_napi;

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

#[napi]
pub fn delete_comparison_threshold(
    config_json: String,
    cfunc_code: String,
    ftype_code: String,
) -> Result<String> {
    thresholds::delete_comparison_threshold(&config_json, &cfunc_code, &ftype_code)
        .map_err(config_error_to_napi)
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
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
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
    let values =
        thresholds::list_generic_thresholds(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn get_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let value =
        thresholds::get_threshold(&config_json, threshold_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn set_threshold(config_json: String, threshold_id: i64) -> Result<String> {
    let params = thresholds::SetThresholdParams { threshold_id };
    thresholds::set_threshold(&config_json, params).map_err(config_error_to_napi)
}
