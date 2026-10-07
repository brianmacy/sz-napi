use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::calls::{self, CallSelector};
use sz_configtool_lib::error::SzConfigError;

use crate::error::{config_error_to_napi, json_serialize_error};

/// Map a JS `number | string` call address to the library's selector.
fn selector(call: &Either<i64, String>) -> CallSelector<'_> {
    match call {
        Either::A(id) => CallSelector::Id(*id),
        Either::B(feature) => CallSelector::Feature(feature.as_str()),
    }
}

/// Look up `code_key` of the row in `section` whose `id_key` equals `id`.
fn code_for_id(
    config: &serde_json::Value,
    section: &str,
    id_key: &str,
    code_key: &str,
    id: i64,
) -> std::result::Result<String, SzConfigError> {
    config["G2_CONFIG"][section]
        .as_array()
        .ok_or_else(|| SzConfigError::MissingSection(section.to_string()))?
        .iter()
        .find(|row| row[id_key].as_i64() == Some(id))
        .and_then(|row| row[code_key].as_str().map(str::to_string))
        .ok_or_else(|| SzConfigError::NotFound(format!("{id_key} {id} does not exist")))
}

/// Resolve a call-element delete target to `(element code, element feature code)`.
/// Codes win; the legacy numeric ids are translated to codes so the library
/// performs the actual lookup and delete.
fn resolve_element_target(
    config_json: &str,
    element: Option<String>,
    element_feature: Option<String>,
    felem_id: Option<i64>,
    ftype_id: Option<i64>,
) -> Result<(String, Option<String>)> {
    let needs_lookup =
        element.is_none() || (element_feature.is_none() && ftype_id.is_some_and(|id| id > 0));
    let config: Option<serde_json::Value> = if needs_lookup {
        Some(serde_json::from_str(config_json).map_err(json_serialize_error)?)
    } else {
        None
    };
    let element = match (element, felem_id, &config) {
        (Some(code), _, _) => code,
        (None, Some(id), Some(cfg)) => code_for_id(cfg, "CFG_FELEM", "FELEM_ID", "FELEM_CODE", id)
            .map_err(config_error_to_napi)?,
        _ => {
            return Err(config_error_to_napi(SzConfigError::MissingField(
                "element (or felemId)".to_string(),
            )));
        }
    };
    let element_feature = match (element_feature, ftype_id, &config) {
        (Some(code), _, _) => Some(code),
        (None, Some(id), Some(cfg)) if id > 0 => Some(
            code_for_id(cfg, "CFG_FTYPE", "FTYPE_ID", "FTYPE_CODE", id)
                .map_err(config_error_to_napi)?,
        ),
        _ => None,
    };
    Ok((element, element_feature))
}

// ============================================================================
// Standardize Calls
// ============================================================================

#[napi(object)]
pub struct AddStandardizeCallOptions {
    pub sfunc_code: String,
    pub ftype_code: Option<String>,
    pub felem_code: Option<String>,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct SetStandardizeCallOptions {
    pub sfcall_id: i64,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct AddStandardizeCallElementOptions {
    pub ftype_id: i64,
    pub sfunc_id: i64,
    pub felem_id: Option<i64>,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct DeleteStandardizeCallElementOptions {
    pub ftype_id: i64,
    pub sfunc_id: i64,
    pub felem_id: Option<i64>,
}

#[napi(object)]
pub struct SetStandardizeCallElementOptions {
    pub ftype_id: i64,
    pub sfunc_id: i64,
    pub felem_id: Option<i64>,
    pub updates: String,
}

#[napi(js_name = "addStandardizeCall")]
pub fn add_standardize_call(
    config_json: String,
    options: AddStandardizeCallOptions,
) -> Result<String> {
    let params = calls::standardize::AddStandardizeCallParams {
        sfunc_code: &options.sfunc_code,
        ftype_code: options.ftype_code.as_deref(),
        felem_code: options.felem_code.as_deref(),
        exec_order: options.exec_order,
    };
    let (modified, _) =
        calls::add_standardize_call(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteStandardizeCall")]
pub fn delete_standardize_call(config_json: String, sfcall_id: i64) -> Result<String> {
    calls::delete_standardize_call(&config_json, sfcall_id).map_err(config_error_to_napi)
}

/// Get a standardize call by its numeric call id, or by the feature code it is bound to.
#[napi(js_name = "getStandardizeCall")]
pub fn get_standardize_call(config_json: String, sfcall_id: Either<i64, String>) -> Result<String> {
    let value = calls::get_standardize_call(&config_json, selector(&sfcall_id))
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listStandardizeCalls")]
pub fn list_standardize_calls(config_json: String) -> Result<String> {
    let values = calls::list_standardize_calls(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setStandardizeCall")]
pub fn set_standardize_call(
    config_json: String,
    options: SetStandardizeCallOptions,
) -> Result<String> {
    let params = calls::standardize::SetStandardizeCallParams {
        sfcall_id: options.sfcall_id,
        exec_order: options.exec_order,
    };
    calls::set_standardize_call(&config_json, params).map_err(config_error_to_napi)
}

#[napi(js_name = "addStandardizeCallElement")]
pub fn add_standardize_call_element(
    config_json: String,
    options: AddStandardizeCallElementOptions,
) -> Result<String> {
    let params = calls::standardize::AddStandardizeCallElementParams {
        ftype_id: options.ftype_id,
        sfunc_id: options.sfunc_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    let (modified, _) =
        calls::add_standardize_call_element(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteStandardizeCallElement")]
pub fn delete_standardize_call_element(
    config_json: String,
    options: DeleteStandardizeCallElementOptions,
) -> Result<String> {
    let params = calls::standardize::DeleteStandardizeCallElementParams {
        ftype_id: options.ftype_id,
        sfunc_id: options.sfunc_id,
        felem_id: options.felem_id,
    };
    calls::delete_standardize_call_element(&config_json, params).map_err(config_error_to_napi)
}

#[napi(js_name = "setStandardizeCallElement")]
pub fn set_standardize_call_element(
    config_json: String,
    options: SetStandardizeCallElementOptions,
) -> Result<String> {
    let updates: serde_json::Value =
        serde_json::from_str(&options.updates).map_err(json_serialize_error)?;
    let params = calls::standardize::SetStandardizeCallElementParams {
        ftype_id: options.ftype_id,
        sfunc_id: options.sfunc_id,
        felem_id: options.felem_id,
        updates,
    };
    calls::set_standardize_call_element(&config_json, params).map_err(config_error_to_napi)
}

// ============================================================================
// Expression Calls
// ============================================================================

#[napi(object)]
pub struct ExpressionCallElementListItem {
    pub element: String,
    pub required: String,
    pub feature: Option<String>,
}

#[napi(object)]
pub struct AddExpressionCallOptions {
    pub efunc_code: String,
    pub element_list: Vec<ExpressionCallElementListItem>,
    pub ftype_code: Option<String>,
    pub felem_code: Option<String>,
    pub exec_order: Option<i64>,
    pub expression_feature: Option<String>,
    pub is_virtual: Option<String>,
}

#[napi(object)]
pub struct SetExpressionCallOptions {
    pub efcall_id: i64,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct AddExpressionCallElementOptions {
    pub efcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    /// Absent auto-allocates the next EXEC_ORDER on the call; a taken value is rejected.
    pub exec_order: Option<i64>,
    pub felem_req: String,
}

#[napi(object)]
pub struct DeleteExpressionCallElementOptions {
    pub efcall_id: i64,
    /// FELEM_CODE of the element to remove (preferred).
    pub element: Option<String>,
    /// FTYPE_CODE that disambiguates an element appearing under several features on one call.
    pub element_feature: Option<String>,
    /// Legacy addressing: FELEM_ID, used when `element` is absent.
    pub felem_id: Option<i64>,
    /// Legacy addressing: FTYPE_ID, used as `elementFeature` when that is absent and the id is > 0.
    pub ftype_id: Option<i64>,
    /// @deprecated Ignored since 0.10.0: the library derives the BOM row's EXEC_ORDER itself.
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct SetExpressionCallElementOptions {
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
    pub felem_req: String,
}

#[napi(js_name = "addExpressionCall")]
pub fn add_expression_call(
    config_json: String,
    options: AddExpressionCallOptions,
) -> Result<String> {
    let element_list: Vec<(String, String, Option<String>)> = options
        .element_list
        .into_iter()
        .map(|item| (item.element, item.required, item.feature))
        .collect();

    let params = calls::expression::AddExpressionCallParams {
        efunc_code: &options.efunc_code,
        element_list,
        ftype_code: options.ftype_code.as_deref(),
        felem_code: options.felem_code.as_deref(),
        exec_order: options.exec_order,
        expression_feature: options.expression_feature.as_deref(),
        is_virtual: options.is_virtual.as_deref().unwrap_or("No"),
    };
    let (modified, _) =
        calls::add_expression_call(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteExpressionCall")]
pub fn delete_expression_call(config_json: String, efcall_id: i64) -> Result<String> {
    calls::delete_expression_call(&config_json, efcall_id).map_err(config_error_to_napi)
}

/// Get an expression call by its numeric call id, or by the feature code it is bound to.
#[napi(js_name = "getExpressionCall")]
pub fn get_expression_call(config_json: String, efcall_id: Either<i64, String>) -> Result<String> {
    let value = calls::get_expression_call(&config_json, selector(&efcall_id))
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listExpressionCalls")]
pub fn list_expression_calls(config_json: String) -> Result<String> {
    let values = calls::list_expression_calls(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setExpressionCall")]
pub fn set_expression_call(
    config_json: String,
    options: SetExpressionCallOptions,
) -> Result<String> {
    let params = calls::expression::SetExpressionCallParams {
        efcall_id: options.efcall_id,
        exec_order: options.exec_order,
    };
    calls::set_expression_call(&config_json, params).map_err(config_error_to_napi)
}

#[napi(js_name = "addExpressionCallElement")]
pub fn add_expression_call_element(
    config_json: String,
    options: AddExpressionCallElementOptions,
) -> Result<String> {
    let params = calls::expression::ExpressionCallElementParams {
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
        felem_req: options.felem_req,
    };
    let (modified, _) = calls::add_expression_call_element(&config_json, options.efcall_id, params)
        .map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteExpressionCallElement")]
pub fn delete_expression_call_element(
    config_json: String,
    options: DeleteExpressionCallElementOptions,
) -> Result<String> {
    let (element, element_feature) = resolve_element_target(
        &config_json,
        options.element,
        options.element_feature,
        options.felem_id,
        options.ftype_id,
    )?;
    calls::delete_expression_call_element(
        &config_json,
        CallSelector::Id(options.efcall_id),
        &element,
        element_feature.as_deref(),
    )
    .map_err(config_error_to_napi)
}

#[napi(js_name = "setExpressionCallElement")]
pub fn set_expression_call_element(
    config_json: String,
    options: SetExpressionCallElementOptions,
) -> Result<String> {
    let params = calls::expression::ExpressionCallElementParams {
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: Some(options.exec_order),
        felem_req: options.felem_req,
    };
    calls::set_expression_call_element(&config_json, params).map_err(config_error_to_napi)
}

// ============================================================================
// Comparison Calls
// ============================================================================

#[napi(object)]
pub struct AddComparisonCallOptions {
    pub ftype_code: String,
    pub cfunc_code: String,
    pub element_list: Vec<String>,
    /// Explicit CFCALL_ID; absent or <= 0 auto-assigns. A taken id is rejected.
    pub id: Option<i64>,
}

#[napi(object)]
pub struct SetComparisonCallOptions {
    pub cfcall_id: i64,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct AddComparisonCallElementOptions {
    pub cfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    /// Absent auto-allocates the next EXEC_ORDER on the call; a taken value is rejected.
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct DeleteComparisonCallElementOptions {
    pub cfcall_id: i64,
    /// FELEM_CODE of the element to remove (preferred).
    pub element: Option<String>,
    /// FTYPE_CODE that disambiguates an element appearing under several features on one call.
    pub element_feature: Option<String>,
    /// Legacy addressing: FELEM_ID, used when `element` is absent.
    pub felem_id: Option<i64>,
    /// Legacy addressing: FTYPE_ID, used as `elementFeature` when that is absent and the id is > 0.
    pub ftype_id: Option<i64>,
    /// @deprecated Ignored since 0.10.0: the library derives the BOM row's EXEC_ORDER itself.
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct SetComparisonCallElementOptions {
    pub cfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
    pub updates: String,
}

#[napi(js_name = "addComparisonCall")]
pub fn add_comparison_call(
    config_json: String,
    options: AddComparisonCallOptions,
) -> Result<String> {
    let params = calls::comparison::AddComparisonCallParams {
        ftype_code: options.ftype_code,
        cfunc_code: options.cfunc_code,
        element_list: options.element_list,
        id: options.id,
    };
    let (modified, _) =
        calls::add_comparison_call(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteComparisonCall")]
pub fn delete_comparison_call(config_json: String, cfcall_id: i64) -> Result<String> {
    calls::delete_comparison_call(&config_json, cfcall_id).map_err(config_error_to_napi)
}

/// Get a comparison call by its numeric call id, or by the feature code it is bound to.
#[napi(js_name = "getComparisonCall")]
pub fn get_comparison_call(config_json: String, cfcall_id: Either<i64, String>) -> Result<String> {
    let value = calls::get_comparison_call(&config_json, selector(&cfcall_id))
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listComparisonCalls")]
pub fn list_comparison_calls(config_json: String) -> Result<String> {
    let values = calls::list_comparison_calls(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setComparisonCall")]
pub fn set_comparison_call(
    config_json: String,
    options: SetComparisonCallOptions,
) -> Result<String> {
    let params = calls::comparison::SetComparisonCallParams {
        cfcall_id: options.cfcall_id,
        exec_order: options.exec_order,
    };
    calls::set_comparison_call(&config_json, params).map_err(config_error_to_napi)
}

#[napi(js_name = "addComparisonCallElement")]
pub fn add_comparison_call_element(
    config_json: String,
    options: AddComparisonCallElementOptions,
) -> Result<String> {
    let params = calls::comparison::AddComparisonCallElementParams {
        cfcall_id: options.cfcall_id,
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    let (modified, _) =
        calls::add_comparison_call_element(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteComparisonCallElement")]
pub fn delete_comparison_call_element(
    config_json: String,
    options: DeleteComparisonCallElementOptions,
) -> Result<String> {
    let (element, element_feature) = resolve_element_target(
        &config_json,
        options.element,
        options.element_feature,
        options.felem_id,
        options.ftype_id,
    )?;
    calls::delete_comparison_call_element(
        &config_json,
        CallSelector::Id(options.cfcall_id),
        &element,
        element_feature.as_deref(),
    )
    .map_err(config_error_to_napi)
}

#[napi(js_name = "setComparisonCallElement")]
pub fn set_comparison_call_element(
    config_json: String,
    options: SetComparisonCallElementOptions,
) -> Result<String> {
    let updates: serde_json::Value =
        serde_json::from_str(&options.updates).map_err(json_serialize_error)?;
    let params = calls::comparison::SetComparisonCallElementParams {
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
        updates,
    };
    calls::set_comparison_call_element(&config_json, options.cfcall_id, params)
        .map_err(config_error_to_napi)
}

// ============================================================================
// Distinct Calls
// ============================================================================

#[napi(object)]
pub struct AddDistinctCallOptions {
    pub ftype_code: String,
    pub dfunc_code: String,
    pub element_list: Vec<String>,
}

#[napi(object)]
pub struct SetDistinctCallOptions {
    pub dfcall_id: i64,
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct AddDistinctCallElementOptions {
    pub dfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    /// Absent auto-allocates the next EXEC_ORDER on the call; a taken value is rejected.
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct DeleteDistinctCallElementOptions {
    pub dfcall_id: i64,
    /// FELEM_CODE of the element to remove (preferred).
    pub element: Option<String>,
    /// FTYPE_CODE that disambiguates an element appearing under several features on one call.
    pub element_feature: Option<String>,
    /// Legacy addressing: FELEM_ID, used when `element` is absent.
    pub felem_id: Option<i64>,
    /// Legacy addressing: FTYPE_ID, used as `elementFeature` when that is absent and the id is > 0.
    pub ftype_id: Option<i64>,
    /// @deprecated Ignored since 0.10.0: the library derives the BOM row's EXEC_ORDER itself.
    pub exec_order: Option<i64>,
}

#[napi(object)]
pub struct SetDistinctCallElementOptions {
    pub dfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
    pub updates: String,
}

#[napi(js_name = "addDistinctCall")]
pub fn add_distinct_call(config_json: String, options: AddDistinctCallOptions) -> Result<String> {
    let params = calls::distinct::AddDistinctCallParams {
        ftype_code: options.ftype_code,
        dfunc_code: options.dfunc_code,
        element_list: options.element_list,
    };
    let (modified, _) =
        calls::add_distinct_call(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteDistinctCall")]
pub fn delete_distinct_call(config_json: String, dfcall_id: i64) -> Result<String> {
    calls::delete_distinct_call(&config_json, dfcall_id).map_err(config_error_to_napi)
}

/// Get a distinct call by its numeric call id, or by the feature code it is bound to.
#[napi(js_name = "getDistinctCall")]
pub fn get_distinct_call(config_json: String, dfcall_id: Either<i64, String>) -> Result<String> {
    let value = calls::get_distinct_call(&config_json, selector(&dfcall_id))
        .map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

#[napi(js_name = "listDistinctCalls")]
pub fn list_distinct_calls(config_json: String) -> Result<String> {
    let values = calls::list_distinct_calls(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}

#[napi(js_name = "setDistinctCall")]
pub fn set_distinct_call(config_json: String, options: SetDistinctCallOptions) -> Result<String> {
    let params = calls::distinct::SetDistinctCallParams {
        dfcall_id: options.dfcall_id,
        exec_order: options.exec_order,
    };
    calls::set_distinct_call(&config_json, params).map_err(config_error_to_napi)
}

#[napi(js_name = "addDistinctCallElement")]
pub fn add_distinct_call_element(
    config_json: String,
    options: AddDistinctCallElementOptions,
) -> Result<String> {
    let params = calls::distinct::AddDistinctCallElementParams {
        dfcall_id: options.dfcall_id,
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    let (modified, _) =
        calls::add_distinct_call_element(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteDistinctCallElement")]
pub fn delete_distinct_call_element(
    config_json: String,
    options: DeleteDistinctCallElementOptions,
) -> Result<String> {
    let (element, element_feature) = resolve_element_target(
        &config_json,
        options.element,
        options.element_feature,
        options.felem_id,
        options.ftype_id,
    )?;
    calls::delete_distinct_call_element(
        &config_json,
        CallSelector::Id(options.dfcall_id),
        &element,
        element_feature.as_deref(),
    )
    .map_err(config_error_to_napi)
}

#[napi(js_name = "setDistinctCallElement")]
pub fn set_distinct_call_element(
    config_json: String,
    options: SetDistinctCallElementOptions,
) -> Result<String> {
    let updates: serde_json::Value =
        serde_json::from_str(&options.updates).map_err(json_serialize_error)?;
    let params = calls::distinct::SetDistinctCallElementParams {
        dfcall_id: options.dfcall_id,
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
        updates,
    };
    calls::set_distinct_call_element(&config_json, params).map_err(config_error_to_napi)
}
