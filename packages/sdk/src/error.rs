//! Error mapping from sz-rust-sdk SzError to napi::Error
//!
//! The Rust side encodes a structured error code prefix in the error message.
//! Format: "[SZ_ERROR_CODE] Original error message"
//!
//! The JS wrapper (`index.js`) parses this prefix and re-throws as the correct
//! SzError subclass for full `instanceof` support.

use sz_rust_sdk::error::SzError;

/// Maps an SzError to a napi::Error with an error code prefix in the message.
///
/// The JS wrapper layer parses the `[CODE]` prefix to construct the correct
/// SzError subclass (e.g., SzNotFoundError, SzRetryableError).
pub fn sz_error_to_napi(err: SzError) -> napi::Error {
    let code = match &err {
        SzError::BadInput(_) => "SZ_BAD_INPUT",
        SzError::Configuration(_) => "SZ_CONFIGURATION",
        SzError::Database(_) => "SZ_DATABASE",
        SzError::License(_) => "SZ_LICENSE",
        SzError::NotFound(_) => "SZ_NOT_FOUND",
        SzError::Retryable(_) => "SZ_RETRYABLE",
        SzError::Unrecoverable(_) => "SZ_UNRECOVERABLE",
        SzError::Unknown(_) => "SZ_UNKNOWN",
        SzError::NotInitialized(_) => "SZ_NOT_INITIALIZED",
        SzError::DatabaseConnectionLost(_) => "SZ_DB_CONNECTION_LOST",
        SzError::DatabaseTransient(_) => "SZ_DB_TRANSIENT",
        SzError::ReplaceConflict(_) => "SZ_REPLACE_CONFLICT",
        SzError::RetryTimeoutExceeded(_) => "SZ_RETRY_TIMEOUT",
        SzError::Unhandled(_) => "SZ_UNHANDLED",
        SzError::UnknownDataSource(_) => "SZ_UNKNOWN_DATA_SOURCE",
        SzError::EnvironmentDestroyed(_) => "SZ_ENVIRONMENT_DESTROYED",
        SzError::Ffi(_) => "SZ_UNHANDLED",
        SzError::Json(_) => "SZ_UNHANDLED",
        SzError::StringConversion(_) => "SZ_UNHANDLED",
        _ => "SZ_UNKNOWN",
    };

    let message = format!("[{code}] {err}");
    napi::Error::new(napi::Status::GenericFailure, message)
}
