use napi::bindgen_prelude::*;
use napi_derive::napi;
use sz_configtool_lib::command_processor::CommandProcessor;

use crate::error::config_error_to_napi;

/// Runs a configuration command script (.gtc format) against the configuration.
/// Each non-blank line not starting with `#` is `commandName {json params}`; `save` is a
/// no-op. Execution stops at the first failing line, which throws InvalidConfig naming the
/// line number and underlying error.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param script - The script text.
/// @returns The configuration JSON string after all commands have been applied.
#[napi]
pub fn process_script(config_json: String, script: String) -> Result<String> {
    let mut processor = CommandProcessor::new(config_json);
    processor
        .process_script(&script)
        .map_err(config_error_to_napi)
}

/// Reads a configuration command script (.gtc) from disk and runs it like `processScript`.
/// Throws InvalidConfig if the file cannot be read or any line fails.
///
/// @param configJson - The current Senzing configuration as a JSON string.
/// @param filePath - Path to the script file.
/// @returns The configuration JSON string after all commands have been applied.
#[napi]
pub fn process_file(config_json: String, file_path: String) -> Result<String> {
    let mut processor = CommandProcessor::new(config_json);
    processor
        .process_file(&file_path)
        .map_err(config_error_to_napi)
}
