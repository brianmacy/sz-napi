use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::rules;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct SetRuleOptions {
    pub code: String,
    pub resolve: Option<String>,
    pub relate: Option<String>,
    pub rtype_id: Option<i64>,
    pub fragment: Option<String>,
    pub disqualifier: Option<String>,
    pub tier: Option<i64>,
}

#[napi]
pub fn add_rule(config_json: String, id: i64, rule_config: String) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&rule_config).map_err(json_serialize_error)?;
    let (config, _id) = rules::add_rule(&config_json, id, &value).map_err(config_error_to_napi)?;
    Ok(config)
}

#[napi]
pub fn delete_rule(config_json: String, rule_code: String) -> Result<String> {
    rules::delete_rule(&config_json, &rule_code).map_err(config_error_to_napi)
}

#[napi]
pub fn get_rule(config_json: String, code_or_id: String) -> Result<String> {
    let value = rules::get_rule(&config_json, &code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi]
pub fn list_rules(config_json: String) -> Result<String> {
    let values = rules::list_rules(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi]
pub fn set_rule(config_json: String, options: SetRuleOptions) -> Result<String> {
    let params = rules::SetRuleParams {
        code: &options.code,
        resolve: options.resolve.as_deref(),
        relate: options.relate.as_deref(),
        rtype_id: options.rtype_id,
        fragment: options.fragment.as_deref(),
        disqualifier: options.disqualifier.as_deref(),
        tier: options.tier,
    };
    rules::set_rule(&config_json, params).map_err(config_error_to_napi)
}
