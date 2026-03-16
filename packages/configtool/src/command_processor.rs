use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::command_processor::CommandProcessor;

use crate::error::config_error_to_napi;

#[napi]
pub fn process_script(config_json: String, script: String) -> Result<String> {
    let mut processor = CommandProcessor::new(config_json);
    processor
        .process_script(&script)
        .map_err(config_error_to_napi)
}

#[napi]
pub fn process_file(config_json: String, file_path: String) -> Result<String> {
    let mut processor = CommandProcessor::new(config_json);
    processor
        .process_file(&file_path)
        .map_err(config_error_to_napi)
}
