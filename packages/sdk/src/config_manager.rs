//! NAPI wrapper for SzConfigManager trait

use napi_derive::napi;
use sz_rust_sdk::traits::SzConfigManager;

use crate::error::sz_error_to_napi;

#[napi(js_name = "SzConfigManager")]
pub struct SzConfigManagerWrapper {
    inner: Box<dyn SzConfigManager>,
}

impl SzConfigManagerWrapper {
    /// Creates a new SzConfigManagerWrapper from a boxed SzConfigManager trait object.
    /// Called internally by SzEnvironmentWrapper::get_config_manager().
    pub fn from_inner(inner: Box<dyn SzConfigManager>) -> Self {
        Self { inner }
    }
}

#[napi]
impl SzConfigManagerWrapper {
    /// Creates a new configuration from the default template and exports it as JSON.
    #[napi]
    pub fn create_config(&self) -> napi::Result<String> {
        self.inner
            .create_config()
            .map_err(sz_error_to_napi)?
            .export()
            .map_err(sz_error_to_napi)
    }

    /// Creates a configuration from a registered configuration ID and exports it as JSON.
    #[napi]
    pub fn create_config_from_id(&self, config_id: i64) -> napi::Result<String> {
        self.inner
            .create_config_from_id(config_id)
            .map_err(sz_error_to_napi)?
            .export()
            .map_err(sz_error_to_napi)
    }

    /// Creates a configuration from a JSON definition string and exports it as JSON.
    #[napi]
    pub fn create_config_from_definition(&self, config_definition: String) -> napi::Result<String> {
        self.inner
            .create_config_from_definition(&config_definition)
            .map_err(sz_error_to_napi)?
            .export()
            .map_err(sz_error_to_napi)
    }

    /// Gets information about all registered configuration versions as a JSON string.
    #[napi]
    pub fn get_config_registry(&self) -> napi::Result<String> {
        self.inner.get_config_registry().map_err(sz_error_to_napi)
    }

    /// Gets the currently active default configuration ID.
    #[napi]
    pub fn get_default_config_id(&self) -> napi::Result<i64> {
        self.inner.get_default_config_id().map_err(sz_error_to_napi)
    }

    /// Registers a new configuration version and returns the assigned configuration ID.
    #[napi]
    pub fn register_config(
        &self,
        config_definition: String,
        config_comment: Option<String>,
    ) -> napi::Result<i64> {
        self.inner
            .register_config(&config_definition, config_comment.as_deref())
            .map_err(sz_error_to_napi)
    }

    /// Atomically replaces the default configuration ID (optimistic locking).
    #[napi]
    pub fn replace_default_config_id(
        &self,
        current_default_config_id: i64,
        new_default_config_id: i64,
    ) -> napi::Result<()> {
        self.inner
            .replace_default_config_id(current_default_config_id, new_default_config_id)
            .map_err(sz_error_to_napi)
    }

    /// Registers and activates a configuration in one operation, returning the assigned ID.
    #[napi]
    pub fn set_default_config(
        &self,
        config_definition: String,
        config_comment: Option<String>,
    ) -> napi::Result<i64> {
        self.inner
            .set_default_config(&config_definition, config_comment.as_deref())
            .map_err(sz_error_to_napi)
    }

    /// Sets the active configuration by ID.
    #[napi]
    pub fn set_default_config_id(&self, config_id: i64) -> napi::Result<()> {
        self.inner
            .set_default_config_id(config_id)
            .map_err(sz_error_to_napi)
    }
}
