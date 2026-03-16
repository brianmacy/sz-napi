//! NAPI wrapper for SzProduct trait

use napi_derive::napi;
use sz_rust_sdk::traits::SzProduct;

use crate::error::sz_error_to_napi;

#[napi(js_name = "SzProduct")]
pub struct SzProductWrapper {
    inner: Box<dyn SzProduct>,
}

impl SzProductWrapper {
    /// Creates a new SzProductWrapper from a boxed SzProduct trait object.
    /// Called internally by SzEnvironmentWrapper::get_product().
    pub fn from_inner(inner: Box<dyn SzProduct>) -> Self {
        Self { inner }
    }
}

#[napi]
impl SzProductWrapper {
    /// Gets the product license details as a JSON string.
    #[napi]
    pub fn get_license(&self) -> napi::Result<String> {
        self.inner.get_license().map_err(sz_error_to_napi)
    }

    /// Gets the product version information as a JSON string.
    #[napi]
    pub fn get_version(&self) -> napi::Result<String> {
        self.inner.get_version().map_err(sz_error_to_napi)
    }
}
