mod config_manager;
mod diagnostic;
mod engine;
mod environment;
mod error;
mod flags;
mod product;

use napi_derive::napi;

/// Returns the version of the NAPI bridge itself.
#[napi]
pub fn bridge_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
