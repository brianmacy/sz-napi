//! NAPI wrapper for SzDiagnostic trait

use napi_derive::napi;
use sz_rust_sdk::traits::SzDiagnostic;

use crate::error::sz_error_to_napi;

#[napi(js_name = "SzDiagnostic")]
pub struct SzDiagnosticWrapper {
    inner: Box<dyn SzDiagnostic>,
}

impl SzDiagnosticWrapper {
    /// Creates a new SzDiagnosticWrapper from a boxed SzDiagnostic trait object.
    /// Called internally by SzEnvironmentWrapper::get_diagnostic().
    pub fn from_inner(inner: Box<dyn SzDiagnostic>) -> Self {
        Self { inner }
    }
}

#[napi]
impl SzDiagnosticWrapper {
    /// Runs a performance benchmark on the repository for the specified duration.
    ///
    /// Returns a JSON string with performance metrics including operations per second.
    #[napi]
    pub fn check_repository_performance(&self, seconds_to_run: i64) -> napi::Result<String> {
        self.inner
            .check_repository_performance(seconds_to_run)
            .map_err(sz_error_to_napi)
    }

    /// Gets detailed information about a specific feature by its internal ID.
    ///
    /// Returns a JSON string with feature details including type, value, and usage statistics.
    #[napi]
    pub fn get_feature(&self, feature_id: i64) -> napi::Result<String> {
        self.inner.get_feature(feature_id).map_err(sz_error_to_napi)
    }

    /// Gets repository statistics and information as a JSON string.
    #[napi]
    pub fn get_repository_info(&self) -> napi::Result<String> {
        self.inner.get_repository_info().map_err(sz_error_to_napi)
    }

    /// Purges all entity data from the repository while preserving configuration.
    ///
    /// Warning: This permanently deletes all entity resolution data.
    #[napi]
    pub fn purge_repository(&self) -> napi::Result<()> {
        self.inner.purge_repository().map_err(sz_error_to_napi)
    }
}
