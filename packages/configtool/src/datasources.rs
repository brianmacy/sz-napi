use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::datasources;

use crate::error::{config_error_to_napi, json_serialize_error};

#[napi(object)]
pub struct AddDataSourceOptions {
    pub code: String,
    pub retention_level: Option<String>,
    /// @deprecated Ignored since 0.10.0: no longer part of the Senzing data source schema; never written.
    pub conversational: Option<String>,
    /// @deprecated Ignored since 0.10.0: no longer part of the Senzing data source schema; never written.
    pub reliability: Option<i64>,
    /// Explicit DSRC_ID; absent or <= 0 auto-assigns (seeded at 1000). A taken id is rejected.
    pub id: Option<i64>,
}

#[napi(object)]
pub struct SetDataSourceOptions {
    pub retention_level: Option<String>,
    /// @deprecated Ignored since 0.10.0: no longer part of the Senzing data source schema; never written.
    pub conversational: Option<String>,
    /// @deprecated Ignored since 0.10.0: no longer part of the Senzing data source schema; never written.
    pub reliability: Option<i64>,
}

/// Adds a data source row to CFG_DSRC.
/// The code is uppercased and also used as DSRC_DESC. `retentionLevel` must be `Remember` or
/// `Forget` (case-insensitive; default `Remember`). `id` absent or <= 0 auto-assigns the next
/// DSRC_ID (seeded at 1000). Throws AlreadyExists if the code or requested id is taken.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param options - Data source options: `code` (required), `retentionLevel`, `id`.
/// @returns The updated configuration JSON string.
#[napi]
pub fn add_data_source(config_json: String, options: AddDataSourceOptions) -> Result<String> {
    let params = datasources::AddDataSourceParams {
        code: &options.code,
        retention_level: options.retention_level.as_deref(),
        id: options.id,
    };
    datasources::add_data_source(&config_json, params).map_err(config_error_to_napi)
}

/// Updates an existing CFG_DSRC row, matched by uppercased code.
/// Only `retentionLevel` is written when provided; other columns are left unchanged.
/// Throws NotFound if the data source does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - DSRC_CODE of the data source to update (case-insensitive).
/// @param options - Fields to update; only `retentionLevel` is applied.
/// @returns The updated configuration JSON string.
#[napi]
pub fn set_data_source(
    config_json: String,
    code: String,
    options: SetDataSourceOptions,
) -> Result<String> {
    let params = datasources::SetDataSourceParams {
        code: &code,
        retention_level: options.retention_level.as_deref(),
    };
    datasources::set_data_source(&config_json, params).map_err(config_error_to_napi)
}

/// Gets one data source from CFG_DSRC by code (case-insensitive).
/// Throws NotFound if the data source does not exist.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - DSRC_CODE of the data source.
/// @returns JSON string of the raw CFG_DSRC row (DSRC_ID, DSRC_CODE, DSRC_DESC, RETENTION_LEVEL).
#[napi]
pub fn get_data_source(config_json: String, code: String) -> Result<String> {
    let value = datasources::get_data_source(&config_json, &code).map_err(config_error_to_napi)?;
    serde_json::to_string(&value).map_err(json_serialize_error)
}

/// Deletes a data source from CFG_DSRC by code (case-insensitive).
/// Throws NotFound if it does not exist and InvalidInput for system data sources (DSRC_ID <= 2).
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param code - DSRC_CODE of the data source to delete.
/// @returns The updated configuration JSON string.
#[napi]
pub fn delete_data_source(config_json: String, code: String) -> Result<String> {
    datasources::delete_data_source(&config_json, &code).map_err(config_error_to_napi)
}

/// Lists all data sources in CFG_DSRC.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @returns JSON string of an array of `{ id, dataSource }` objects (DSRC_ID, DSRC_CODE).
#[napi]
pub fn list_data_sources(config_json: String) -> Result<String> {
    let values = datasources::list_data_sources(&config_json).map_err(config_error_to_napi)?;
    serde_json::to_string(&values).map_err(json_serialize_error)
}
