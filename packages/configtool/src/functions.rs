use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::functions;

use crate::error::config_error_to_napi;

// ============================================================================
// Helper for JSON serialization errors
// ============================================================================

fn json_serialize_error(e: serde_json::Error) -> napi::Error {
    napi::Error::new(
        napi::Status::GenericFailure,
        format!("[JsonParse] {e}"),
    )
}

// ============================================================================
// Standardize Functions
// ============================================================================

#[napi(object)]
pub struct AddStandardizeFunctionOptions {
    pub connect_str: String,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(object)]
pub struct SetStandardizeFunctionOptions {
    pub connect_str: Option<String>,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(js_name = "addStandardizeFunction")]
pub fn add_standardize_function(
    config_json: String,
    sfunc_code: String,
    options: AddStandardizeFunctionOptions,
) -> Result<String> {
    let params = functions::standardize::AddStandardizeFunctionParams {
        connect_str: &options.connect_str,
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::add_standardize_function(&config_json, &sfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteStandardizeFunction")]
pub fn delete_standardize_function(config_json: String, sfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_standardize_function(&config_json, &sfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getStandardizeFunction")]
pub fn get_standardize_function(config_json: String, sfunc_code: String) -> Result<String> {
    let value = functions::get_standardize_function(&config_json, &sfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listStandardizeFunctions")]
pub fn list_standardize_functions(config_json: String) -> Result<String> {
    let values = functions::list_standardize_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setStandardizeFunction")]
pub fn set_standardize_function(
    config_json: String,
    sfunc_code: String,
    options: SetStandardizeFunctionOptions,
) -> Result<String> {
    let params = functions::standardize::SetStandardizeFunctionParams {
        connect_str: options.connect_str.as_deref(),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::set_standardize_function(&config_json, &sfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Expression Functions
// ============================================================================

#[napi(object)]
pub struct AddExpressionFunctionOptions {
    pub connect_str: String,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(object)]
pub struct SetExpressionFunctionOptions {
    pub connect_str: Option<String>,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(js_name = "addExpressionFunction")]
pub fn add_expression_function(
    config_json: String,
    efunc_code: String,
    options: AddExpressionFunctionOptions,
) -> Result<String> {
    let params = functions::expression::AddExpressionFunctionParams {
        connect_str: &options.connect_str,
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::add_expression_function(&config_json, &efunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteExpressionFunction")]
pub fn delete_expression_function(config_json: String, efunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_expression_function(&config_json, &efunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getExpressionFunction")]
pub fn get_expression_function(config_json: String, efunc_code: String) -> Result<String> {
    let value = functions::get_expression_function(&config_json, &efunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listExpressionFunctions")]
pub fn list_expression_functions(config_json: String) -> Result<String> {
    let values = functions::list_expression_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setExpressionFunction")]
pub fn set_expression_function(
    config_json: String,
    efunc_code: String,
    options: SetExpressionFunctionOptions,
) -> Result<String> {
    let params = functions::expression::SetExpressionFunctionParams {
        connect_str: options.connect_str.as_deref(),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::set_expression_function(&config_json, &efunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Comparison Functions
// ============================================================================

#[napi(object)]
pub struct AddComparisonFunctionOptions {
    pub connect_str: String,
    pub description: Option<String>,
    pub language: Option<String>,
    pub anon_support: Option<String>,
}

#[napi(object)]
pub struct SetComparisonFunctionOptions {
    pub connect_str: Option<String>,
    pub description: Option<String>,
    pub language: Option<String>,
    pub anon_support: Option<String>,
}

#[napi(js_name = "addComparisonFunction")]
pub fn add_comparison_function(
    config_json: String,
    cfunc_code: String,
    options: AddComparisonFunctionOptions,
) -> Result<String> {
    let params = functions::comparison::AddComparisonFunctionParams {
        connect_str: &options.connect_str,
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::add_comparison_function(&config_json, &cfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteComparisonFunction")]
pub fn delete_comparison_function(config_json: String, cfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_comparison_function(&config_json, &cfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getComparisonFunction")]
pub fn get_comparison_function(config_json: String, cfunc_code: String) -> Result<String> {
    let value = functions::get_comparison_function(&config_json, &cfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listComparisonFunctions")]
pub fn list_comparison_functions(config_json: String) -> Result<String> {
    let values = functions::list_comparison_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setComparisonFunction")]
pub fn set_comparison_function(
    config_json: String,
    cfunc_code: String,
    options: SetComparisonFunctionOptions,
) -> Result<String> {
    let params = functions::comparison::SetComparisonFunctionParams {
        connect_str: options.connect_str.as_deref(),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::set_comparison_function(&config_json, &cfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "addComparisonFuncReturnCode")]
pub fn add_comparison_func_return_code(
    config_json: String,
    cfunc_code: String,
    cfrtn_code: String,
    cfrtn_desc: Option<String>,
) -> Result<String> {
    let (modified, _) = functions::add_comparison_func_return_code(
        &config_json,
        &cfunc_code,
        &cfrtn_code,
        cfrtn_desc.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Distinct Functions
// ============================================================================

#[napi(object)]
pub struct AddDistinctFunctionOptions {
    pub connect_str: String,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(object)]
pub struct SetDistinctFunctionOptions {
    pub connect_str: Option<String>,
    pub description: Option<String>,
    pub language: Option<String>,
}

#[napi(js_name = "addDistinctFunction")]
pub fn add_distinct_function(
    config_json: String,
    dfunc_code: String,
    options: AddDistinctFunctionOptions,
) -> Result<String> {
    let params = functions::distinct::AddDistinctFunctionParams {
        connect_str: &options.connect_str,
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::add_distinct_function(&config_json, &dfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteDistinctFunction")]
pub fn delete_distinct_function(config_json: String, dfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_distinct_function(&config_json, &dfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getDistinctFunction")]
pub fn get_distinct_function(config_json: String, dfunc_code: String) -> Result<String> {
    let value = functions::get_distinct_function(&config_json, &dfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listDistinctFunctions")]
pub fn list_distinct_functions(config_json: String) -> Result<String> {
    let values = functions::list_distinct_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setDistinctFunction")]
pub fn set_distinct_function(
    config_json: String,
    dfunc_code: String,
    options: SetDistinctFunctionOptions,
) -> Result<String> {
    let params = functions::distinct::SetDistinctFunctionParams {
        connect_str: options.connect_str.as_deref(),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::set_distinct_function(&config_json, &dfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Matching Functions (placeholder - not yet implemented upstream)
// ============================================================================

#[napi(js_name = "addMatchingFunction")]
pub fn add_matching_function(
    config_json: String,
    rtype_code: String,
    matching_func: String,
) -> Result<String> {
    let (modified, _) = functions::add_matching_function(&config_json, &rtype_code, &matching_func)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteMatchingFunction")]
pub fn delete_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getMatchingFunction")]
pub fn get_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let value = functions::get_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listMatchingFunctions")]
pub fn list_matching_functions(config_json: String) -> Result<String> {
    let values = functions::list_matching_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setMatchingFunction")]
pub fn set_matching_function(
    config_json: String,
    rtype_code: String,
    matching_func: Option<String>,
) -> Result<String> {
    let (modified, _) = functions::set_matching_function(
        &config_json,
        &rtype_code,
        matching_func.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "removeMatchingFunction")]
pub fn remove_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Scoring Functions (placeholder - not yet implemented upstream)
// ============================================================================

#[napi(js_name = "addScoringFunction")]
pub fn add_scoring_function(
    config_json: String,
    rtype_code: String,
    scoring_func: String,
) -> Result<String> {
    let (modified, _) = functions::add_scoring_function(&config_json, &rtype_code, &scoring_func)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteScoringFunction")]
pub fn delete_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_scoring_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getScoringFunction")]
pub fn get_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let value = functions::get_scoring_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listScoringFunctions")]
pub fn list_scoring_functions(config_json: String) -> Result<String> {
    let values = functions::list_scoring_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setScoringFunction")]
pub fn set_scoring_function(
    config_json: String,
    rtype_code: String,
    scoring_func: Option<String>,
) -> Result<String> {
    let (modified, _) = functions::set_scoring_function(
        &config_json,
        &rtype_code,
        scoring_func.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "removeScoringFunction")]
pub fn remove_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_scoring_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Candidate Functions (placeholder - not yet implemented upstream)
// ============================================================================

#[napi(js_name = "addCandidateFunction")]
pub fn add_candidate_function(
    config_json: String,
    rtype_code: String,
    candidate_func: String,
) -> Result<String> {
    let (modified, _) =
        functions::add_candidate_function(&config_json, &rtype_code, &candidate_func)
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteCandidateFunction")]
pub fn delete_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getCandidateFunction")]
pub fn get_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let value = functions::get_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listCandidateFunctions")]
pub fn list_candidate_functions(config_json: String) -> Result<String> {
    let values = functions::list_candidate_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setCandidateFunction")]
pub fn set_candidate_function(
    config_json: String,
    rtype_code: String,
    candidate_func: Option<String>,
) -> Result<String> {
    let (modified, _) = functions::set_candidate_function(
        &config_json,
        &rtype_code,
        candidate_func.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "removeCandidateFunction")]
pub fn remove_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Validation Functions (placeholder - not yet implemented upstream)
// ============================================================================

#[napi(js_name = "addValidationFunction")]
pub fn add_validation_function(
    config_json: String,
    attr_code: String,
    validation_func: String,
) -> Result<String> {
    let (modified, _) =
        functions::add_validation_function(&config_json, &attr_code, &validation_func)
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteValidationFunction")]
pub fn delete_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let (modified, _) = functions::delete_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "getValidationFunction")]
pub fn get_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let value = functions::get_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listValidationFunctions")]
pub fn list_validation_functions(config_json: String) -> Result<String> {
    let values = functions::list_validation_functions(&config_json)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setValidationFunction")]
pub fn set_validation_function(
    config_json: String,
    attr_code: String,
    validation_func: Option<String>,
) -> Result<String> {
    let (modified, _) = functions::set_validation_function(
        &config_json,
        &attr_code,
        validation_func.as_deref(),
    )
    .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "removeValidationFunction")]
pub fn remove_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let (modified, _) = functions::remove_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}
