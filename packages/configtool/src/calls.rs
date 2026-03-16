use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::calls;

use crate::error::{config_error_to_napi, json_serialize_error};

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

#[napi(js_name = "getStandardizeCall")]
pub fn get_standardize_call(config_json: String, sfcall_id: i64) -> Result<String> {
    let value =
        calls::get_standardize_call(&config_json, sfcall_id).map_err(config_error_to_napi)?;
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
    pub exec_order: i64,
    pub felem_req: String,
}

#[napi(object)]
pub struct DeleteExpressionCallElementOptions {
    pub efcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
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

#[napi(js_name = "getExpressionCall")]
pub fn get_expression_call(config_json: String, efcall_id: i64) -> Result<String> {
    let value =
        calls::get_expression_call(&config_json, efcall_id).map_err(config_error_to_napi)?;
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
    let key = calls::expression::ExpressionCallElementKey {
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    calls::delete_expression_call_element(&config_json, options.efcall_id, key)
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
        exec_order: options.exec_order,
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
    pub exec_order: i64,
}

#[napi(object)]
pub struct DeleteComparisonCallElementOptions {
    pub cfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
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
    };
    let (modified, _) =
        calls::add_comparison_call(&config_json, params).map_err(config_error_to_napi)?;
    Ok(modified)
}

#[napi(js_name = "deleteComparisonCall")]
pub fn delete_comparison_call(config_json: String, cfcall_id: i64) -> Result<String> {
    calls::delete_comparison_call(&config_json, cfcall_id).map_err(config_error_to_napi)
}

#[napi(js_name = "getComparisonCall")]
pub fn get_comparison_call(config_json: String, cfcall_id: i64) -> Result<String> {
    let value =
        calls::get_comparison_call(&config_json, cfcall_id).map_err(config_error_to_napi)?;
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
    let params = calls::comparison::DeleteComparisonCallElementParams {
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    calls::delete_comparison_call_element(&config_json, options.cfcall_id, params)
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
    pub exec_order: i64,
}

#[napi(object)]
pub struct DeleteDistinctCallElementOptions {
    pub dfcall_id: i64,
    pub ftype_id: i64,
    pub felem_id: i64,
    pub exec_order: i64,
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

#[napi(js_name = "getDistinctCall")]
pub fn get_distinct_call(config_json: String, dfcall_id: i64) -> Result<String> {
    let value = calls::get_distinct_call(&config_json, dfcall_id).map_err(config_error_to_napi)?;
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
    let params = calls::distinct::DeleteDistinctCallElementParams {
        dfcall_id: options.dfcall_id,
        ftype_id: options.ftype_id,
        felem_id: options.felem_id,
        exec_order: options.exec_order,
    };
    calls::delete_distinct_call_element(&config_json, params).map_err(config_error_to_napi)
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
