use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::rules;

use crate::error::{config_error_to_napi, json_serialize_error};
use crate::field_update;

#[napi(object)]
pub struct SetRuleOptions {
    pub code: String,
    pub resolve: Option<String>,
    pub relate: Option<String>,
    pub rtype_id: Option<i64>,
    /// QUAL_ERFRAG_CODE: undefined = leave unchanged, null = clear, string = set.
    pub fragment: Option<Either<String, Null>>,
    /// DISQ_ERFRAG_CODE: undefined = leave unchanged, null = clear, string = set.
    pub disqualifier: Option<Either<String, Null>>,
    /// ERRULE_TIER: undefined = leave unchanged, null = clear, number = set.
    pub tier: Option<Either<i64, Null>>,
}

/// Adds a rule row to CFG_ERRULE.
/// `ruleConfig` must contain ERRULE_CODE (uppercased) and QUAL_ERFRAG_CODE; RESOLVE/RELATE
/// default to `No`, RTYPE_ID to 1. The row is validated: fragment/disqualifier must exist,
/// resolve and relate are exclusive, RESOLVE=Yes needs a non-zero ERRULE_TIER. Throws
/// AlreadyExists for a taken code or id.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param id - Desired ERRULE_ID; 0 or less auto-assigns the next id (seeded at 1000).
/// @param ruleConfig - JSON object string of CFG_ERRULE columns.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_rule(config_json: String, id: i64, rule_config: String) -> Result<String> {
    let value: serde_json::Value =
        serde_json::from_str(&rule_config).map_err(json_serialize_error)?;
    let (config, _id) = rules::add_rule(&config_json, id, &value).map_err(config_error_to_napi)?;
    Ok(config)
}

/// Deletes a rule from CFG_ERRULE by code (case-insensitive).
/// Throws NotFound if the rule does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param ruleCode - ERRULE_CODE of the rule to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_rule(config_json: String, rule_code: String) -> Result<String> {
    rules::delete_rule(&config_json, &rule_code).map_err(config_error_to_napi)
}

/// Gets one rule from CFG_ERRULE, matched by ERRULE_CODE (case-insensitive) first, then by
/// ERRULE_ID. Throws NotFound if neither matches.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param codeOrId - Rule code, or its numeric id as a string.
/// @returns JSON string of `{ id, rule, resolve, relate, rtype_id, fragment, disqualifier, tier }`;
///   `tier` is null unless RESOLVE is `Yes`.
#[napi]
pub fn get_rule(config_json: String, code_or_id: String) -> Result<String> {
    let value = rules::get_rule(&config_json, &code_or_id).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all rules in CFG_ERRULE, sorted by id. Returns an empty array if the section is absent.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an array of
///   `{ id, rule, resolve, relate, rtype_id, fragment, disqualifier, tier }` objects.
#[napi]
pub fn list_rules(config_json: String) -> Result<String> {
    let values = rules::list_rules(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing CFG_ERRULE row, matched by `options.code` (case-insensitive).
/// Omitted fields keep their stored values; `fragment`, `disqualifier` and `tier` also accept
/// null to clear. A newly set fragment/disqualifier must exist, and the merged row is validated
/// as in `addRule` (RESOLVE=Yes forces RTYPE_ID 1). Throws NotFound if the rule does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Rule code plus the fields to change.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_rule(config_json: String, options: SetRuleOptions) -> Result<String> {
    let params = rules::SetRuleParams {
        code: &options.code,
        resolve: options.resolve.as_deref(),
        relate: options.relate.as_deref(),
        rtype_id: options.rtype_id,
        fragment: field_update::str_from_js(&options.fragment),
        disqualifier: field_update::str_from_js(&options.disqualifier),
        tier: field_update::from_js(options.tier),
    };
    rules::set_rule(&config_json, params).map_err(config_error_to_napi)
}
