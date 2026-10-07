//! JS -> `FieldUpdate<T>` tri-state mapping for `set*` options.
//!
//! Tri-state option fields are declared as `Option<Either<T, Null>>` (spelled out,
//! not via the `TriState` alias: `#[napi(object)]` only treats a literal `Option<..>`
//! as an optional field):
//!
//! | JS value            | FieldUpdate |
//! |---------------------|-------------|
//! | absent / undefined  | `Leave`     |
//! | `null`              | `Clear`     |
//! | a value             | `Set(v)`    |

use napi::bindgen_prelude::{Either, Null};
use sz_configtool_lib::FieldUpdate;

/// A JS option field that distinguishes undefined (leave), null (clear) and a value (set).
pub type TriState<T> = Option<Either<T, Null>>;

/// Map a tri-state JS field to the library's `FieldUpdate`.
pub fn from_js<T>(value: TriState<T>) -> FieldUpdate<T> {
    match value {
        None => FieldUpdate::Leave,
        Some(Either::B(Null)) => FieldUpdate::Clear,
        Some(Either::A(v)) => FieldUpdate::Set(v),
    }
}

/// Borrow a string tri-state field as the `FieldUpdate<&str>` the library takes.
pub fn str_from_js(value: &TriState<String>) -> FieldUpdate<&str> {
    match value {
        None => FieldUpdate::Leave,
        Some(Either::B(Null)) => FieldUpdate::Clear,
        Some(Either::A(v)) => FieldUpdate::Set(v.as_str()),
    }
}
