use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::features;

use crate::error::config_error_to_napi;

#[napi(object)]
pub struct AddFeatureOptions {
    pub feature: String,
    pub element_list: String,
    pub class: Option<String>,
    pub behavior: Option<String>,
    pub candidates: Option<String>,
    pub anonymize: Option<String>,
    pub derived: Option<String>,
    pub history: Option<String>,
    pub matchkey: Option<String>,
    pub standardize: Option<String>,
    pub expression: Option<String>,
    pub comparison: Option<String>,
    pub version: Option<i64>,
    pub rtype_id: Option<i64>,
}

#[napi(object)]
pub struct SetFeatureOptions {
    pub feature: String,
    pub candidates: Option<String>,
    pub anonymize: Option<String>,
    pub derived: Option<String>,
    pub history: Option<String>,
    pub matchkey: Option<String>,
    pub behavior: Option<String>,
    pub class: Option<String>,
    pub version: Option<i64>,
    pub rtype_id: Option<i64>,
}

#[napi(object)]
pub struct AddFeatureComparisonOptions {
    pub feature_code: String,
    pub element_code: String,
    pub exec_order: Option<i64>,
    pub display_level: Option<i64>,
    pub display_delim: Option<String>,
    pub derived: Option<String>,
}

#[napi(object)]
pub struct GetFeatureComparisonOptions {
    pub feature_code: String,
    pub element_code: String,
}

#[napi(object)]
pub struct AddFeatureDistinctCallElementOptions {
    pub feature_code: String,
    pub distinct_func_code: String,
    pub element_code: Option<String>,
    pub exec_order: Option<i64>,
}

#[napi]
pub fn add_feature(config_json: String, options: AddFeatureOptions) -> Result<String> {
    let element_list: serde_json::Value = serde_json::from_str(&options.element_list).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })?;
    let params = features::AddFeatureParams {
        feature: &options.feature,
        element_list: &element_list,
        class: options.class.as_deref(),
        behavior: options.behavior.as_deref(),
        candidates: options.candidates.as_deref(),
        anonymize: options.anonymize.as_deref(),
        derived: options.derived.as_deref(),
        history: options.history.as_deref(),
        matchkey: options.matchkey.as_deref(),
        standardize: options.standardize.as_deref(),
        expression: options.expression.as_deref(),
        comparison: options.comparison.as_deref(),
        version: options.version,
        rtype_id: options.rtype_id,
    };
    features::add_feature(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_feature(config_json: String, feature_code_or_id: String) -> Result<String> {
    features::delete_feature(&config_json, &feature_code_or_id).map_err(config_error_to_napi)
}

#[napi]
pub fn get_feature(config_json: String, feature_code_or_id: String) -> Result<String> {
    let value =
        features::get_feature(&config_json, &feature_code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn list_features(config_json: String) -> Result<String> {
    let values = features::list_features(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn set_feature(config_json: String, options: SetFeatureOptions) -> Result<String> {
    let params = features::SetFeatureParams {
        feature: &options.feature,
        candidates: options.candidates.as_deref(),
        anonymize: options.anonymize.as_deref(),
        derived: options.derived.as_deref(),
        history: options.history.as_deref(),
        matchkey: options.matchkey.as_deref(),
        behavior: options.behavior.as_deref(),
        class: options.class.as_deref(),
        version: options.version,
        rtype_id: options.rtype_id,
    };
    features::set_feature(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn add_feature_comparison(
    config_json: String,
    options: AddFeatureComparisonOptions,
) -> Result<String> {
    let params = features::AddFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    features::add_feature_comparison(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_feature_comparison(
    config_json: String,
    feature_code: String,
    element_code: String,
) -> Result<String> {
    features::delete_feature_comparison(&config_json, &feature_code, &element_code)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn get_feature_comparison(
    config_json: String,
    options: GetFeatureComparisonOptions,
) -> Result<String> {
    let params = features::GetFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
    };
    let value =
        features::get_feature_comparison(&config_json, params).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn list_feature_comparisons(config_json: String) -> Result<String> {
    let values =
        features::list_feature_comparisons(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn add_feature_comparison_element(
    config_json: String,
    options: AddFeatureComparisonOptions,
) -> Result<String> {
    let params = features::AddFeatureComparisonParams {
        feature_code: Some(options.feature_code.as_str()),
        element_code: Some(options.element_code.as_str()),
        exec_order: options.exec_order,
        display_level: options.display_level,
        display_delim: options.display_delim.as_deref(),
        derived: options.derived.as_deref(),
    };
    features::add_feature_comparison_element(&config_json, params).map_err(config_error_to_napi)
}

#[napi]
pub fn delete_feature_comparison_element(
    config_json: String,
    feature_code: String,
    element_code: String,
) -> Result<String> {
    features::delete_feature_comparison_element(&config_json, &feature_code, &element_code)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn add_feature_distinct_call_element(
    config_json: String,
    options: AddFeatureDistinctCallElementOptions,
) -> Result<String> {
    let params = features::AddFeatureDistinctCallElementParams {
        feature_code: Some(options.feature_code.as_str()),
        distinct_func_code: Some(options.distinct_func_code.as_str()),
        element_code: options.element_code.as_deref(),
        exec_order: options.exec_order,
    };
    features::add_feature_distinct_call_element(&config_json, params)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn list_feature_classes(config_json: String) -> Result<String> {
    let values =
        features::list_feature_classes(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn get_feature_class(config_json: String, fclass_id_or_code: String) -> Result<String> {
    let value = features::get_feature_class(&config_json, &fclass_id_or_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(|e| {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("[JsonParse] {e}"),
        )
    })
}

#[napi]
pub fn update_feature_version(config_json: String, version: String) -> Result<String> {
    features::update_feature_version(&config_json, &version).map_err(config_error_to_napi)
}
