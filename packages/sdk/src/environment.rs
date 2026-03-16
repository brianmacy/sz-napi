//! NAPI wrapper for SzEnvironment trait

use std::sync::Arc;

use napi_derive::napi;
use sz_rust_sdk::core::environment::SzEnvironmentCore;
use sz_rust_sdk::traits::SzEnvironment;

use crate::config_manager::SzConfigManagerWrapper;
use crate::diagnostic::SzDiagnosticWrapper;
use crate::engine::SzEngineWrapper;
use crate::error::sz_error_to_napi;
use crate::product::SzProductWrapper;

#[napi(js_name = "SzEnvironment")]
pub struct SzEnvironmentWrapper {
    inner: Option<Arc<SzEnvironmentCore>>,
}

#[napi]
impl SzEnvironmentWrapper {
    /// Creates a new SzEnvironment instance.
    ///
    /// Uses the singleton pattern via `SzEnvironmentCore::get_instance()`.
    #[napi(constructor)]
    pub fn new(
        module_name: String,
        settings: String,
        verbose_logging: Option<bool>,
    ) -> napi::Result<Self> {
        let verbose = verbose_logging.unwrap_or(false);
        let inner =
            SzEnvironmentCore::get_instance(&module_name, &settings, verbose)
                .map_err(sz_error_to_napi)?;
        Ok(Self {
            inner: Some(inner),
        })
    }

    /// Checks if the environment has been destroyed.
    #[napi]
    pub fn is_destroyed(&self) -> bool {
        match &self.inner {
            Some(env) => env.is_destroyed(),
            None => true,
        }
    }

    /// Destroys the environment and releases native resources.
    ///
    /// After calling destroy, this wrapper is no longer usable.
    #[napi]
    pub fn destroy(&mut self) -> napi::Result<()> {
        let env = self.inner.take().ok_or_else(|| {
            napi::Error::new(
                napi::Status::GenericFailure,
                "[SZ_ENVIRONMENT_DESTROYED] Environment has already been destroyed",
            )
        })?;
        env.destroy().map_err(sz_error_to_napi)
    }

    /// Reinitializes the environment with a different configuration.
    #[napi]
    pub fn reinitialize(&self, config_id: i64) -> napi::Result<()> {
        let env = self.get_inner()?;
        env.reinitialize(config_id).map_err(sz_error_to_napi)
    }

    /// Gets the currently active configuration ID.
    #[napi]
    pub fn get_active_config_id(&self) -> napi::Result<i64> {
        let env = self.get_inner()?;
        env.get_active_config_id().map_err(sz_error_to_napi)
    }

    /// Gets the engine interface for entity resolution operations.
    #[napi]
    pub fn get_engine(&self) -> napi::Result<SzEngineWrapper> {
        let env = self.get_inner()?;
        let engine = env.get_engine().map_err(sz_error_to_napi)?;
        Ok(SzEngineWrapper::from_inner(engine))
    }

    /// Gets the configuration manager interface.
    #[napi]
    pub fn get_config_manager(&self) -> napi::Result<SzConfigManagerWrapper> {
        let env = self.get_inner()?;
        let config_manager = env.get_config_manager().map_err(sz_error_to_napi)?;
        Ok(SzConfigManagerWrapper::from_inner(config_manager))
    }

    /// Gets the diagnostic interface for system monitoring.
    #[napi]
    pub fn get_diagnostic(&self) -> napi::Result<SzDiagnosticWrapper> {
        let env = self.get_inner()?;
        let diagnostic = env.get_diagnostic().map_err(sz_error_to_napi)?;
        Ok(SzDiagnosticWrapper::from_inner(diagnostic))
    }

    /// Gets the product interface for version and license information.
    #[napi]
    pub fn get_product(&self) -> napi::Result<SzProductWrapper> {
        let env = self.get_inner()?;
        let product = env.get_product().map_err(sz_error_to_napi)?;
        Ok(SzProductWrapper::from_inner(product))
    }
}

impl SzEnvironmentWrapper {
    /// Helper to get the inner Arc, returning an error if destroyed.
    fn get_inner(&self) -> napi::Result<&Arc<SzEnvironmentCore>> {
        self.inner.as_ref().ok_or_else(|| {
            napi::Error::new(
                napi::Status::GenericFailure,
                "[SZ_ENVIRONMENT_DESTROYED] Environment has been destroyed",
            )
        })
    }
}
