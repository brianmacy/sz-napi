//! Error mapping from sz_configtool_lib SzConfigError to napi::Error
//!
//! The Rust side encodes a structured error type prefix in the error message.
//! Format: "[ErrorType] Original error message"
//!
//! For `ValidationErrors` the structured failures are appended after a
//! `FAILURES_MARKER` line as JSON (`[{field, reasonCode, offendingValue}]`).
//!
//! The JS wrapper reads the prefix (and marker) and re-throws as SzConfigError
//! with the correct `errorType` / `failures` properties.

use sz_configtool_lib::error::SzConfigError;

/// Separates the human message from the JSON-encoded validation failures.
/// Must match `FAILURES_MARKER` in `js/errors.js`.
const FAILURES_MARKER: &str = "\n@failures:";

/// Maps an SzConfigError to a napi::Error with an error type prefix in the message.
pub fn config_error_to_napi(err: SzConfigError) -> napi::Error {
    let error_type = match &err {
        SzConfigError::JsonParse(_) => "JsonParse",
        SzConfigError::NotFound(_) => "NotFound",
        SzConfigError::NotOnCall(_) => "NotOnCall",
        SzConfigError::NotInFeature(_) => "NotInFeature",
        SzConfigError::AlreadyExists(_) => "AlreadyExists",
        SzConfigError::AlreadyPresent(_) => "AlreadyPresent",
        SzConfigError::InvalidInput(_) => "InvalidInput",
        SzConfigError::MissingSection(_) => "MissingSection",
        SzConfigError::InvalidStructure(_) => "InvalidStructure",
        SzConfigError::MissingField(_) => "MissingField",
        SzConfigError::InvalidConfig(_) => "InvalidConfig",
        SzConfigError::NotImplemented(_) => "NotImplemented",
        SzConfigError::ValidationErrors(_) => "ValidationErrors",
    };

    let mut message = format!("[{error_type}] {err}");
    if let Some(failures) = err.validation_failures() {
        let encoded: Vec<serde_json::Value> = failures
            .iter()
            .map(|f| {
                serde_json::json!({
                    "field": f.field,
                    "reasonCode": f.reason_code.as_str(),
                    "offendingValue": f.offending_value,
                })
            })
            .collect();
        message.push_str(FAILURES_MARKER);
        message.push_str(&serde_json::Value::Array(encoded).to_string());
    }
    napi::Error::new(napi::Status::GenericFailure, message)
}

/// Maps a serde_json serialization error to a napi::Error with [JsonParse] prefix.
pub fn json_serialize_error(e: serde_json::Error) -> napi::Error {
    napi::Error::new(napi::Status::GenericFailure, format!("[JsonParse] {e}"))
}
