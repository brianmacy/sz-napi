// NAPI-RS exports are FFI-only; Rust's dead_code analysis cannot see them.
#![allow(dead_code)]

mod attributes;
mod behavior_overrides;
mod calls;
mod command_processor;
mod config_sections;
mod datasources;
mod elements;
mod error;
mod features;
mod fragments;
mod functions;
mod generic_plans;
mod hashes;
mod rules;
mod system_params;
mod thresholds;
mod versioning;

use napi_derive::napi;

/// Returns the version of the NAPI configtool bridge.
#[napi]
pub fn bridge_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
