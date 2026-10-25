use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::functions;

use crate::error::{config_error_to_napi, json_serialize_error};
use crate::field_update;

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
    /// CONNECT_STR: undefined = leave unchanged, null = clear, string = set.
    pub connect_str: Option<Either<String, Null>>,
    pub description: Option<String>,
    pub language: Option<String>,
}

/// Adds a standardize function row to CFG_SFUNC.
/// The code is uppercased and SFUNC_ID is auto-assigned as the current maximum plus one.
/// Throws SzConfigError (errorType InvalidInput) if the code already exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - `connectStr` (required), plus optional `description` (SFUNC_DESC)
///   and `language`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "addStandardizeFunction")]
pub fn add_standardize_function(
    config_json: String,
    sfunc_code: String,
    options: AddStandardizeFunctionOptions,
) -> Result<String> {
    let params = functions::standardize::AddStandardizeFunctionParams {
        connect_str: Some(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::add_standardize_function(&config_json, &sfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Deletes a standardize function row from CFG_SFUNC by code.
/// Only the function row is removed; calls that reference it are not deleted. Throws
/// SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns The updated configuration JSON string.
#[napi(js_name = "deleteStandardizeFunction")]
pub fn delete_standardize_function(config_json: String, sfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_standardize_function(&config_json, &sfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Gets a single standardize function row from CFG_SFUNC by code.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns A JSON object string of the stored CFG_SFUNC row with its raw keys
///   (SFUNC_ID, SFUNC_CODE, SFUNC_DESC, CONNECT_STR, LANGUAGE).
#[napi(js_name = "getStandardizeFunction")]
pub fn get_standardize_function(config_json: String, sfunc_code: String) -> Result<String> {
    let value = functions::get_standardize_function(&config_json, &sfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all standardize functions in CFG_SFUNC.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys
///   `id`, `function`, `connectStr`, `language`;
///   empty when CFG_SFUNC is absent. Nullable stored values are returned as `null`.
#[napi(js_name = "listStandardizeFunctions")]
pub fn list_standardize_functions(config_json: String) -> Result<String> {
    let values =
        functions::list_standardize_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing standardize function row in CFG_SFUNC by code.
/// `connectStr`: undefined leaves it unchanged, `null` clears it, a string sets it. Other
/// provided options overwrite their fields; omitted ones are left unchanged.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param sfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - Optional `connectStr`, `description` (SFUNC_DESC) and `language`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "setStandardizeFunction")]
pub fn set_standardize_function(
    config_json: String,
    sfunc_code: String,
    options: SetStandardizeFunctionOptions,
) -> Result<String> {
    let params = functions::standardize::SetStandardizeFunctionParams {
        connect_str: field_update::str_from_js(&options.connect_str),
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
    /// CONNECT_STR: undefined = leave unchanged, null = clear, string = set.
    pub connect_str: Option<Either<String, Null>>,
    pub description: Option<String>,
    pub language: Option<String>,
}

/// Adds a expression function row to CFG_EFUNC.
/// The code is uppercased and EFUNC_ID is auto-assigned as the current maximum plus one.
/// Throws SzConfigError (errorType InvalidInput) if the code already exists.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param efuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - `connectStr` (required), plus optional `description` (EFUNC_DESC)
///   and `language`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "addExpressionFunction")]
pub fn add_expression_function(
    config_json: String,
    efunc_code: String,
    options: AddExpressionFunctionOptions,
) -> Result<String> {
    let params = functions::expression::AddExpressionFunctionParams {
        connect_str: Some(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
    };
    let (modified, _) = functions::add_expression_function(&config_json, &efunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Deletes a expression function row from CFG_EFUNC by code.
/// Only the function row is removed; calls that reference it are not deleted. Throws
/// SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param efuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns The updated configuration JSON string.
#[napi(js_name = "deleteExpressionFunction")]
pub fn delete_expression_function(config_json: String, efunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_expression_function(&config_json, &efunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Gets a single expression function row from CFG_EFUNC by code.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param efuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns A JSON object string of the stored CFG_EFUNC row with its raw keys
///   (EFUNC_ID, EFUNC_CODE, EFUNC_DESC, CONNECT_STR, LANGUAGE).
#[napi(js_name = "getExpressionFunction")]
pub fn get_expression_function(config_json: String, efunc_code: String) -> Result<String> {
    let value = functions::get_expression_function(&config_json, &efunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all expression functions in CFG_EFUNC.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys
///   `id`, `function`, `connectStr`, `language`;
///   empty when CFG_EFUNC is absent. Nullable stored values are returned as `null`.
#[napi(js_name = "listExpressionFunctions")]
pub fn list_expression_functions(config_json: String) -> Result<String> {
    let values =
        functions::list_expression_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing expression function row in CFG_EFUNC by code.
/// `connectStr`: undefined leaves it unchanged, `null` clears it, a string sets it. Other
/// provided options overwrite their fields; omitted ones are left unchanged.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param efuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - Optional `connectStr`, `description` (EFUNC_DESC) and `language`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "setExpressionFunction")]
pub fn set_expression_function(
    config_json: String,
    efunc_code: String,
    options: SetExpressionFunctionOptions,
) -> Result<String> {
    let params = functions::expression::SetExpressionFunctionParams {
        connect_str: field_update::str_from_js(&options.connect_str),
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
    /// CONNECT_STR: undefined = leave unchanged, null = clear, string = set.
    pub connect_str: Option<Either<String, Null>>,
    pub description: Option<String>,
    pub language: Option<String>,
    pub anon_support: Option<String>,
}

/// Adds a comparison function row to CFG_CFUNC.
/// The code is uppercased and CFUNC_ID is auto-assigned as the current maximum plus one.
/// Throws SzConfigError (errorType InvalidInput) if the code already exists.
/// `anonSupport` must be `Yes` or `No` (case-insensitive, default `No`); any
/// other value throws InvalidInput.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param cfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - `connectStr` (required), plus optional `description` (CFUNC_DESC),
///   `language` and `anonSupport`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "addComparisonFunction")]
pub fn add_comparison_function(
    config_json: String,
    cfunc_code: String,
    options: AddComparisonFunctionOptions,
) -> Result<String> {
    let params = functions::comparison::AddComparisonFunctionParams {
        connect_str: Some(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::add_comparison_function(&config_json, &cfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Deletes a comparison function row from CFG_CFUNC by code.
/// Only the function row is removed; calls that reference it are not deleted. Throws
/// SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param cfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns The updated configuration JSON string.
#[napi(js_name = "deleteComparisonFunction")]
pub fn delete_comparison_function(config_json: String, cfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_comparison_function(&config_json, &cfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Gets a single comparison function row from CFG_CFUNC by code.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param cfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns A JSON object string of the stored CFG_CFUNC row with its raw keys
///   (CFUNC_ID, CFUNC_CODE, CFUNC_DESC, CONNECT_STR, LANGUAGE, ANON_SUPPORT).
#[napi(js_name = "getComparisonFunction")]
pub fn get_comparison_function(config_json: String, cfunc_code: String) -> Result<String> {
    let value = functions::get_comparison_function(&config_json, &cfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all comparison functions in CFG_CFUNC.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys
///   `id`, `function`, `description`, `connectStr`, `anonSupport`, `language`;
///   empty when CFG_CFUNC is absent. Nullable stored values are returned as `null`.
#[napi(js_name = "listComparisonFunctions")]
pub fn list_comparison_functions(config_json: String) -> Result<String> {
    let values =
        functions::list_comparison_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing comparison function row in CFG_CFUNC by code.
/// `connectStr`: undefined leaves it unchanged, `null` clears it, a string sets it. Other
/// provided options overwrite their fields; omitted ones are left unchanged.
/// Unlike add, `anonSupport` is stored as given (not validated).
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param cfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - Optional `connectStr`, `description` (CFUNC_DESC), `language`
///   and `anonSupport`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "setComparisonFunction")]
pub fn set_comparison_function(
    config_json: String,
    cfunc_code: String,
    options: SetComparisonFunctionOptions,
) -> Result<String> {
    let params = functions::comparison::SetComparisonFunctionParams {
        connect_str: field_update::str_from_js(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::set_comparison_function(&config_json, &cfunc_code, params)
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
    /// ANON_SUPPORT: `Yes` or `No` (default `No` on add)
    pub anon_support: Option<String>,
}

#[napi(object)]
pub struct SetDistinctFunctionOptions {
    /// CONNECT_STR: undefined = leave unchanged, null = clear, string = set.
    pub connect_str: Option<Either<String, Null>>,
    pub description: Option<String>,
    pub language: Option<String>,
    /// ANON_SUPPORT: `Yes` or `No` (default `No` on add)
    pub anon_support: Option<String>,
}

/// Adds a distinct function row to CFG_DFUNC.
/// The code is uppercased and DFUNC_ID is auto-assigned as the current maximum plus one.
/// Throws SzConfigError (errorType InvalidInput) if the code already exists.
/// `anonSupport` must be `Yes` or `No` (case-insensitive, default `No`); any
/// other value throws InvalidInput.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param dfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - `connectStr` (required), plus optional `description` (DFUNC_DESC),
///   `language` and `anonSupport`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "addDistinctFunction")]
pub fn add_distinct_function(
    config_json: String,
    dfunc_code: String,
    options: AddDistinctFunctionOptions,
) -> Result<String> {
    let params = functions::distinct::AddDistinctFunctionParams {
        connect_str: Some(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::add_distinct_function(&config_json, &dfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Deletes a distinct function row from CFG_DFUNC by code.
/// Only the function row is removed; calls that reference it are not deleted. Throws
/// SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param dfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns The updated configuration JSON string.
#[napi(js_name = "deleteDistinctFunction")]
pub fn delete_distinct_function(config_json: String, dfunc_code: String) -> Result<String> {
    let (modified, _) = functions::delete_distinct_function(&config_json, &dfunc_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Gets a single distinct function row from CFG_DFUNC by code.
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param dfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @returns A JSON object string of the stored CFG_DFUNC row with its raw keys
///   (DFUNC_ID, DFUNC_CODE, DFUNC_DESC, CONNECT_STR, LANGUAGE, ANON_SUPPORT).
#[napi(js_name = "getDistinctFunction")]
pub fn get_distinct_function(config_json: String, dfunc_code: String) -> Result<String> {
    let value = functions::get_distinct_function(&config_json, &dfunc_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Lists all distinct functions in CFG_DFUNC.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns A JSON array string of objects with keys
///   `id`, `function`, `connectStr`, `anonSupport`, `language`;
///   empty when CFG_DFUNC is absent. Nullable stored values are returned as `null`.
#[napi(js_name = "listDistinctFunctions")]
pub fn list_distinct_functions(config_json: String) -> Result<String> {
    let values = functions::list_distinct_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Updates an existing distinct function row in CFG_DFUNC by code.
/// `connectStr`: undefined leaves it unchanged, `null` clears it, a string sets it. Other
/// provided options overwrite their fields; omitted ones are left unchanged.
/// Unlike add, `anonSupport` is stored as given (not validated).
/// Throws SzConfigError (errorType NotFound) if the code does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param dfuncCode - The function code (matched case-insensitively; stored uppercased).
/// @param options - Optional `connectStr`, `description` (DFUNC_DESC), `language`
///   and `anonSupport`.
/// @returns The updated configuration JSON string.
#[napi(js_name = "setDistinctFunction")]
pub fn set_distinct_function(
    config_json: String,
    dfunc_code: String,
    options: SetDistinctFunctionOptions,
) -> Result<String> {
    let params = functions::distinct::SetDistinctFunctionParams {
        connect_str: field_update::str_from_js(&options.connect_str),
        description: options.description.as_deref(),
        language: options.language.as_deref(),
        anon_support: options.anon_support.as_deref(),
    };
    let (modified, _) = functions::set_distinct_function(&config_json, &dfunc_code, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Matching Functions
// ============================================================================

/// Placeholder for adding a matching function to a CFG_RTYPE entry; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param matchingFunc - The matching function code (currently unused).
/// @returns Never returns; the call always throws.
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

/// Placeholder for deleting a matching function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "deleteMatchingFunction")]
pub fn delete_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for getting the matching function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "getMatchingFunction")]
pub fn get_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let value = functions::get_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Placeholder for listing matching functions in CFG_RTYPE; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns Never returns; the call always throws.
#[napi(js_name = "listMatchingFunctions")]
pub fn list_matching_functions(config_json: String) -> Result<String> {
    let values = functions::list_matching_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Placeholder for setting the matching function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param matchingFunc - The matching function code, or null (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "setMatchingFunction")]
pub fn set_matching_function(
    config_json: String,
    rtype_code: String,
    matching_func: Option<String>,
) -> Result<String> {
    let (modified, _) =
        functions::set_matching_function(&config_json, &rtype_code, matching_func.as_deref())
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for removing the matching function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "removeMatchingFunction")]
pub fn remove_matching_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_matching_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Scoring Functions
// ============================================================================

/// Placeholder for adding a scoring function to a CFG_RTYPE entry; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param scoringFunc - The scoring function code (currently unused).
/// @returns Never returns; the call always throws.
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

/// Placeholder for deleting a scoring function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "deleteScoringFunction")]
pub fn delete_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_scoring_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for getting the scoring function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "getScoringFunction")]
pub fn get_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let value =
        functions::get_scoring_function(&config_json, &rtype_code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Placeholder for listing scoring functions in CFG_RTYPE; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns Never returns; the call always throws.
#[napi(js_name = "listScoringFunctions")]
pub fn list_scoring_functions(config_json: String) -> Result<String> {
    let values = functions::list_scoring_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Placeholder for setting the scoring function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param scoringFunc - The scoring function code, or null (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "setScoringFunction")]
pub fn set_scoring_function(
    config_json: String,
    rtype_code: String,
    scoring_func: Option<String>,
) -> Result<String> {
    let (modified, _) =
        functions::set_scoring_function(&config_json, &rtype_code, scoring_func.as_deref())
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for removing the scoring function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "removeScoringFunction")]
pub fn remove_scoring_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_scoring_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Candidate Functions
// ============================================================================

/// Placeholder for adding a candidate function to a CFG_RTYPE entry; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param candidateFunc - The candidate function code (currently unused).
/// @returns Never returns; the call always throws.
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

/// Placeholder for deleting a candidate function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "deleteCandidateFunction")]
pub fn delete_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::delete_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for getting the candidate function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "getCandidateFunction")]
pub fn get_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let value = functions::get_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Placeholder for listing candidate functions in CFG_RTYPE; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns Never returns; the call always throws.
#[napi(js_name = "listCandidateFunctions")]
pub fn list_candidate_functions(config_json: String) -> Result<String> {
    let values = functions::list_candidate_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Placeholder for setting the candidate function of a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @param candidateFunc - The candidate function code, or null (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "setCandidateFunction")]
pub fn set_candidate_function(
    config_json: String,
    rtype_code: String,
    candidate_func: Option<String>,
) -> Result<String> {
    let (modified, _) =
        functions::set_candidate_function(&config_json, &rtype_code, candidate_func.as_deref())
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for removing the candidate function from a CFG_RTYPE entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param rtypeCode - The CFG_RTYPE code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "removeCandidateFunction")]
pub fn remove_candidate_function(config_json: String, rtype_code: String) -> Result<String> {
    let (modified, _) = functions::remove_candidate_function(&config_json, &rtype_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

// ============================================================================
// Validation Functions
// ============================================================================

/// Placeholder for adding a validation function to a CFG_ATTR entry; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param attrCode - The CFG_ATTR attribute code (currently unused).
/// @param validationFunc - The validation function code (currently unused).
/// @returns Never returns; the call always throws.
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

/// Placeholder for deleting a validation function from a CFG_ATTR entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param attrCode - The CFG_ATTR attribute code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "deleteValidationFunction")]
pub fn delete_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let (modified, _) = functions::delete_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for getting the validation function of a CFG_ATTR entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param attrCode - The CFG_ATTR attribute code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "getValidationFunction")]
pub fn get_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let value = functions::get_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Placeholder for listing validation functions in CFG_ATTR; not yet implemented.
/// Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns Never returns; the call always throws.
#[napi(js_name = "listValidationFunctions")]
pub fn list_validation_functions(config_json: String) -> Result<String> {
    let values =
        functions::list_validation_functions(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

/// Placeholder for setting the validation function of a CFG_ATTR entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param attrCode - The CFG_ATTR attribute code (currently unused).
/// @param validationFunc - The validation function code, or null (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "setValidationFunction")]
pub fn set_validation_function(
    config_json: String,
    attr_code: String,
    validation_func: Option<String>,
) -> Result<String> {
    let (modified, _) =
        functions::set_validation_function(&config_json, &attr_code, validation_func.as_deref())
            .map_err(config_error_to_napi)?;
    Ok(modified)
}

/// Placeholder for removing the validation function from a CFG_ATTR entry; not yet
/// implemented. Always throws SzConfigError (errorType NotImplemented).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param attrCode - The CFG_ATTR attribute code (currently unused).
/// @returns Never returns; the call always throws.
#[napi(js_name = "removeValidationFunction")]
pub fn remove_validation_function(config_json: String, attr_code: String) -> Result<String> {
    let (modified, _) = functions::remove_validation_function(&config_json, &attr_code)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}
