//! Error mapping from sz_configtool_lib SzConfigError to napi::Error
//!
//! The Rust side encodes a structured error type prefix in the error message.
//! Format: "[ErrorType] Original error message"
//!
//! The JS wrapper reads this prefix and re-throws as SzConfigError
//! with the correct `errorType` property.

use sz_configtool_lib::error::SzConfigError;

/// Maps an SzConfigError to a napi::Error with an error type prefix in the message.
pub fn config_error_to_napi(err: SzConfigError) -> napi::Error {
    let error_type = match &err {
        SzConfigError::JsonParse(_) => "JsonParse",
        SzConfigError::NotFound(_) => "NotFound",
        SzConfigError::AlreadyExists(_) => "AlreadyExists",
        SzConfigError::InvalidInput(_) => "InvalidInput",
        SzConfigError::MissingSection(_) => "MissingSection",
        SzConfigError::InvalidStructure(_) => "InvalidStructure",
        SzConfigError::MissingField(_) => "MissingField",
        SzConfigError::InvalidConfig(_) => "InvalidConfig",
        SzConfigError::NotImplemented(_) => "NotImplemented",
    };

    let message = format!("[{error_type}] {err}");
    napi::Error::new(napi::Status::GenericFailure, message)
}
