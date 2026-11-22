//! NAPI wrapper for Senzing native logging (`SzLogging`, libSzLogging, Senzing 4.5.0).
//!
//! All logging state lives in native libSzLogging, exactly as in `sz-rust-sdk`: this module keeps
//! no registry, dispatcher or formatter. Each JS registration is one native registration whose
//! closure forwards records to a JS function through a napi `ThreadsafeFunction`:
//!
//! - **Non-blocking:** the closure runs on whichever thread logs (often an engine thread) and
//!   queues the record with `ThreadsafeFunctionCallMode::NonBlocking`, so a logging thread never
//!   waits for the JS event loop. The queue is unbounded unless the registration sets
//!   `maxQueued` ([`QueueLimit`]): then records over the cap are dropped and counted.
//! - **Asynchronous delivery:** the JS callback runs later, on the JS thread that registered it.
//! - **Weak:** the function is unref'd, so a registration never keeps the process alive; records
//!   still queued when the process exits are discarded.
//! - **Environment gone:** once the registering JS environment is torn down (a worker exited), the
//!   closure returns before copying the record. The native registration itself stays: removing it
//!   from an environment-teardown hook could race engine threads, which is unsafe on 4.5.0.

use std::num::NonZeroU32;
use std::sync::Arc;
use std::sync::atomic::{AtomicU64, AtomicUsize, Ordering};
use std::time::UNIX_EPOCH;

use napi::Status;
use napi::bindgen_prelude::{BigInt, Either, Function, Unknown};
use napi::threadsafe_function::{ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;
use sz_rust_sdk::core::environment::SzEnvironmentCore;
use sz_rust_sdk::error::SzError;
use sz_rust_sdk::logging::{
    SzLogCallback, SzLogCallbackOptions, SzLogEntry, SzLogFormat, SzLogLevel, SzLogOutput,
    SzLogRecord, SzLogRegistration,
};
use sz_rust_sdk::traits::{SzEnvironment, SzLogging};

use crate::error::sz_error_to_napi;

/// JS callback for log records: weak (unref'd), callee-unhandled, unbounded napi queue (the
/// optional cap is [`QueueLimit`]).
type LogFunction =
    ThreadsafeFunction<Queued, Unknown<'static>, JsLogRecord, Status, false, true, 0>;

/// The JS function a callback registration receives.
type JsLogFunction<'a> = Function<'a, JsLogRecord, Unknown<'static>>;

/// The `maxQueued` cap of one callback: records queued for JS but not yet delivered.
#[derive(Debug)]
struct QueueLimit {
    max: usize,
    in_flight: AtomicUsize,
    dropped: AtomicU64,
}

impl QueueLimit {
    fn new(max: NonZeroU32) -> Arc<Self> {
        Arc::new(Self {
            max: usize::try_from(max.get()).unwrap_or(usize::MAX),
            in_flight: AtomicUsize::new(0),
            dropped: AtomicU64::new(0),
        })
    }

    /// A slot for one more queued record, or `None` (counted as dropped) at the cap.
    fn acquire(self: &Arc<Self>) -> Option<InFlight> {
        if self.in_flight.fetch_add(1, Ordering::AcqRel) >= self.max {
            self.in_flight.fetch_sub(1, Ordering::AcqRel);
            self.dropped.fetch_add(1, Ordering::Relaxed);
            return None;
        }
        Some(InFlight(Arc::clone(self)))
    }

    fn dropped(&self) -> u64 {
        self.dropped.load(Ordering::Relaxed)
    }
}

/// One queued record's slot in a [`QueueLimit`], released when the record reaches the JS callback
/// or is discarded.
#[derive(Debug)]
struct InFlight(Arc<QueueLimit>);

impl Drop for InFlight {
    fn drop(&mut self) {
        self.0.in_flight.fetch_sub(1, Ordering::AcqRel);
    }
}

/// What the logging thread queues: the record and, with `maxQueued`, its slot.
struct Queued {
    record: JsLogRecord,
    _slot: Option<InFlight>,
}

/// One log record as delivered to JS.
#[napi(object, js_name = "SzLogRecord")]
pub struct JsLogRecord {
    /// The message's severity (never `'OFF'`).
    #[napi(ts_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'")]
    pub level: String,
    /// The module name: native's module up to its last `:` (for `szstatic:82eb15f5faba9bab`,
    /// `szstatic`).
    pub module: String,
    /// The thread hash after the last `:` of native's module, if present. The per-thread handle on
    /// Senzing 4.5.0: records from one thread share it.
    pub thread_hash: Option<String>,
    /// The message exactly as native formatted it for this registration.
    pub message: String,
    /// When native logged the message: UTC nanoseconds since the Unix epoch. `undefined` until
    /// Senzing >= 4.5.1 / 4.6.0 (the 4.5.0 callback does not receive the time).
    pub timestamp_ns: Option<BigInt>,
    /// OS id of the thread that logged the message. `undefined` until Senzing >= 4.5.1 / 4.6.0; use
    /// `threadHash` on 4.5.0.
    pub thread_id: Option<BigInt>,
}

impl JsLogRecord {
    /// An owned JS-ready copy of a native record (runs on the logging thread).
    fn from_record(record: &SzLogRecord<'_>) -> Self {
        Self {
            level: record.level().as_str().to_owned(),
            module: record.module().into_owned(),
            thread_hash: record.thread_hash().map(str::to_owned),
            message: record.message().into_owned(),
            timestamp_ns: record.timestamp_ns().map(BigInt::from),
            thread_id: record.thread_id().map(BigInt::from),
        }
    }

    /// A JS-ready copy of an owned entry (from a thread capture).
    fn from_entry(entry: SzLogEntry) -> Self {
        let timestamp_ns = entry
            .timestamp
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .and_then(|d| i64::try_from(d.as_nanos()).ok())
            .map(BigInt::from);
        Self {
            level: entry.level.as_str().to_owned(),
            module: entry.module,
            thread_hash: entry.thread_hash,
            message: entry.message,
            timestamp_ns,
            thread_id: entry.thread_id.map(BigInt::from),
        }
    }
}

/// Registration parameters: the callback's minimum level, the format native applies to the
/// record's message, and an optional cap on undelivered records. `format` defaults to `'BARE'`:
/// the record already carries the level and module, so `'LEGACY'` would stamp them a second time
/// when the record is forwarded.
#[napi(object, js_name = "SzLogCallbackOptions")]
pub struct JsLogCallbackOptions {
    /// Minimum level delivered to the callback (case-insensitive; `'warning'` is accepted).
    #[napi(ts_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
    pub min_level: String,
    /// Format native applies to the message (case-insensitive; `'json'` is accepted). Default
    /// `'BARE'`.
    #[napi(ts_type = "'LEGACY' | 'JSONL' | 'BARE' | 'DEFAULT'")]
    pub format: Option<String>,
    /// The most records queued for the callback but not yet delivered (an integer >= 1). Records
    /// logged while that many are waiting are dropped and counted (`SzLogRegistration.getDropped`).
    /// Default: unbounded. Ignored by `captureThreadLogs` (no queue).
    pub max_queued: Option<u32>,
}

/// Destination of native's default output.
///
/// `type` is `'STDERR'` (the native default), `'STDOUT'`, `'FILE'` (with `path`; `append: true`
/// needs Senzing >= 4.5.1 / 4.6.0), `'NULL'` (discard; only registered callbacks receive
/// messages) or `'CALLBACK'` (reported by `getDefaultOutput` only; install one with
/// `setDefaultCallback`).
#[napi(object, js_name = "SzLogOutput")]
pub struct JsLogOutput {
    /// The output kind (case-insensitive on input).
    #[napi(
        js_name = "type",
        ts_type = "'STDERR' | 'STDOUT' | 'FILE' | 'NULL' | 'CALLBACK'"
    )]
    pub kind: String,
    /// The file path, for `'FILE'`.
    pub path: Option<String>,
    /// For `'FILE'`: keep the existing content instead of truncating (Senzing >= 4.5.1 / 4.6.0).
    pub append: Option<bool>,
}

impl JsLogOutput {
    fn into_output(self) -> Result<SzLogOutput, SzError> {
        match self.kind.trim().to_ascii_uppercase().as_str() {
            "STDERR" => Ok(SzLogOutput::Stderr),
            "STDOUT" => Ok(SzLogOutput::Stdout),
            "NULL" => Ok(SzLogOutput::Null),
            "CALLBACK" => Ok(SzLogOutput::Callback),
            "FILE" => {
                let path = self
                    .path
                    .ok_or_else(|| SzError::bad_input("a 'FILE' log output needs a path"))?;
                Ok(if self.append.unwrap_or(false) {
                    SzLogOutput::append_file(path)
                } else {
                    SzLogOutput::file(path)
                })
            }
            _ => Err(SzError::bad_input(format!(
                "unknown log output type {:?}",
                self.kind
            ))),
        }
    }

    fn from_output(output: SzLogOutput) -> Result<Self, SzError> {
        let (kind, path, append) = match output {
            SzLogOutput::Stderr => ("STDERR", None, None),
            SzLogOutput::Stdout => ("STDOUT", None, None),
            SzLogOutput::File { path, append } => (
                "FILE",
                Some(path.to_string_lossy().into_owned()),
                Some(append),
            ),
            SzLogOutput::Null => ("NULL", None, None),
            SzLogOutput::Callback => ("CALLBACK", None, None),
            // SzLogOutput is #[non_exhaustive]: a future variant must not be misreported.
            other => {
                return Err(SzError::unhandled(format!(
                    "unsupported log output {other:?}: update @senzing/sdk"
                )));
            }
        };
        Ok(Self {
            kind: kind.to_owned(),
            path,
            append,
        })
    }
}

/// A level argument (case-insensitive) as `SzLogLevel`.
fn parse_level(level: &str) -> napi::Result<SzLogLevel> {
    level.parse().map_err(sz_error_to_napi)
}

/// A format argument (case-insensitive) as `SzLogFormat`.
fn parse_format(format: &str) -> napi::Result<SzLogFormat> {
    format.parse().map_err(sz_error_to_napi)
}

/// Parsed callback options: native's options and the optional `maxQueued` cap.
#[derive(Debug, PartialEq)]
struct ParsedOptions {
    native: SzLogCallbackOptions,
    max_queued: Option<NonZeroU32>,
}

/// A level name, or `{ minLevel, format?, maxQueued? }`, as [`ParsedOptions`] (default format
/// Bare, unbounded queue).
fn parse_options(options: Either<String, JsLogCallbackOptions>) -> napi::Result<ParsedOptions> {
    match options {
        Either::A(level) => Ok(ParsedOptions {
            native: SzLogCallbackOptions::new(parse_level(&level)?),
            max_queued: None,
        }),
        Either::B(options) => {
            let base = SzLogCallbackOptions::new(parse_level(&options.min_level)?);
            let native = match options.format.as_deref() {
                Some(format) => base.format(parse_format(format)?),
                None => base,
            };
            let max_queued = options
                .max_queued
                .map(|max| {
                    NonZeroU32::new(max).ok_or_else(|| {
                        sz_error_to_napi(SzError::bad_input("maxQueued must be at least 1"))
                    })
                })
                .transpose()?;
            Ok(ParsedOptions { native, max_queued })
        }
    }
}

/// A boxed native callback that queues each record for `callback` without blocking, and the
/// queue limit when `max_queued` is set.
fn forward_to(
    callback: &JsLogFunction<'_>,
    max_queued: Option<NonZeroU32>,
) -> napi::Result<(SzLogCallback, Option<Arc<QueueLimit>>)> {
    let function: LogFunction = callback
        .build_threadsafe_function::<Queued>()
        .weak::<true>()
        .callee_handled::<false>()
        // Runs on the JS thread; the slot is released here, as the record reaches JS.
        .build_callback(|ctx| Ok(ctx.value.record))?;
    let limit = max_queued.map(QueueLimit::new);
    let queue = limit.clone();
    let forward: SzLogCallback = Box::new(move |record: &SzLogRecord<'_>| {
        // The JS environment is gone (a worker exited, or the process is exiting): skip the copy
        // napi would only discard.
        if function.aborted() {
            return;
        }
        let slot = match &queue {
            Some(queue) => match queue.acquire() {
                Some(slot) => Some(slot),
                None => return,
            },
            None => None,
        };
        // Closing and every other status are ignored (napi drops the record, releasing its slot):
        // a logging thread can do nothing useful with them.
        let _ = function.call(
            Queued {
                record: JsLogRecord::from_record(record),
                _slot: slot,
            },
            ThreadsafeFunctionCallMode::NonBlocking,
        );
    });
    Ok((forward, limit))
}

/// The error for a registration used after `unregister()` or `leak()`.
fn released() -> napi::Error {
    sz_error_to_napi(SzError::bad_input(
        "the log registration was already unregistered or leaked",
    ))
}

/// Native logging: callbacks, levels, formats and the default output (process-global state).
#[napi(js_name = "SzLogging")]
pub struct SzLoggingWrapper {
    inner: Arc<dyn SzLogging>,
}

impl SzLoggingWrapper {
    pub fn from_inner(inner: Arc<dyn SzLogging>) -> Self {
        Self { inner }
    }
}

#[napi]
impl SzLoggingWrapper {
    /// Registers a callback for log records from every thread.
    ///
    /// `options` is a level name or `{ minLevel, format?, maxQueued? }` (default format `'BARE'`,
    /// unbounded queue). Records are delivered asynchronously on this JS thread. The returned
    /// registration does not keep the process alive; call `unregister()` (or dispose it) to remove
    /// the callback. A registration that is garbage-collected without being unregistered stays
    /// registered for the rest of the process.
    #[napi(strict)]
    pub fn register_callback(
        &self,
        #[napi(
            ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF' | SzLogCallbackOptions"
        )]
        options: Either<String, JsLogCallbackOptions>,
        #[napi(ts_arg_type = "(record: SzLogRecord) => void")] callback: JsLogFunction<'_>,
    ) -> napi::Result<SzLogRegistrationWrapper> {
        let options = parse_options(options)?;
        let (forward, queue) = forward_to(&callback, options.max_queued)?;
        self.inner
            .register_callback(options.native, forward)
            .map(|registration| SzLogRegistrationWrapper::new(registration, queue))
            .map_err(sz_error_to_napi)
    }

    /// Registers a callback for records logged on the calling OS thread only.
    ///
    /// Requires Senzing >= 4.5.1 / 4.6.0: on 4.5.0 this throws `SzConfigurationError` (4.5.0
    /// accepts a thread-local registration but never delivers to it, GDEV-4960).
    #[napi(strict)]
    pub fn register_thread_local_callback(
        &self,
        #[napi(
            ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF' | SzLogCallbackOptions"
        )]
        options: Either<String, JsLogCallbackOptions>,
        #[napi(ts_arg_type = "(record: SzLogRecord) => void")] callback: JsLogFunction<'_>,
    ) -> napi::Result<SzLogRegistrationWrapper> {
        let options = parse_options(options)?;
        let (forward, queue) = forward_to(&callback, options.max_queued)?;
        self.inner
            .register_thread_local_callback(options.native, forward)
            .map(|registration| SzLogRegistrationWrapper::new(registration, queue))
            .map_err(sz_error_to_napi)
    }

    /// Captures the records logged on the calling thread until `finish()`.
    ///
    /// Requires Senzing >= 4.5.1 / 4.6.0 (thread-local delivery, GDEV-4960): on 4.5.0 this throws
    /// `SzConfigurationError`.
    #[napi]
    pub fn capture_thread_logs(
        &self,
        #[napi(
            ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF' | SzLogCallbackOptions"
        )]
        options: Either<String, JsLogCallbackOptions>,
    ) -> napi::Result<SzLogCaptureWrapper> {
        let options = parse_options(options)?;
        let entries = Arc::new(std::sync::Mutex::new(Vec::new()));
        let sink = Arc::clone(&entries);
        let registration = self
            .inner
            .register_thread_local_callback(
                options.native,
                Box::new(move |record: &SzLogRecord<'_>| {
                    sink.lock()
                        .unwrap_or_else(std::sync::PoisonError::into_inner)
                        .push(record.to_entry());
                }),
            )
            .map_err(sz_error_to_napi)?;
        Ok(SzLogCaptureWrapper {
            registration: Some(registration),
            entries,
        })
    }

    /// Makes `callback` the default output, at `options.minLevel` and in `options.format`.
    ///
    /// There is no handle: the callback stays until `setDefaultOutput` or another
    /// `setDefaultCallback` replaces it. On Senzing 4.5.0 a replaced callback is leaked (there is
    /// no release hook), so set it once. It does not keep the process alive. `options.maxQueued`
    /// caps its queue; the dropped count is not observable (there is no handle).
    #[napi(strict)]
    pub fn set_default_callback(
        &self,
        #[napi(
            ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF' | SzLogCallbackOptions"
        )]
        options: Either<String, JsLogCallbackOptions>,
        #[napi(ts_arg_type = "(record: SzLogRecord) => void")] callback: JsLogFunction<'_>,
    ) -> napi::Result<()> {
        let options = parse_options(options)?;
        let (forward, _queue) = forward_to(&callback, options.max_queued)?;
        self.inner
            .set_default_callback(options.native, forward)
            .map_err(sz_error_to_napi)
    }

    /// Sets the default output. On Senzing 4.5.0 the default format resets to `'LEGACY'`, so call
    /// `setDefaultFormat` after this. A `'FILE'` output is opened for append first (creating
    /// missing parent directories) and throws `SzBadInputError` if it cannot be opened.
    #[napi]
    pub fn set_default_output(&self, output: JsLogOutput) -> napi::Result<()> {
        let output = output.into_output().map_err(sz_error_to_napi)?;
        self.inner
            .set_default_output(output)
            .map_err(sz_error_to_napi)
    }

    /// The current default output. Requires Senzing >= 4.5.1 / 4.6.0 (throws
    /// `SzConfigurationError` on 4.5.0).
    #[napi]
    pub fn get_default_output(&self) -> napi::Result<JsLogOutput> {
        self.inner
            .get_default_output()
            .and_then(JsLogOutput::from_output)
            .map_err(sz_error_to_napi)
    }

    /// Sets the default output's format. Registered callbacks keep their own format.
    #[napi]
    pub fn set_default_format(
        &self,
        #[napi(ts_arg_type = "'LEGACY' | 'JSONL' | 'BARE' | 'DEFAULT'")] format: String,
    ) -> napi::Result<()> {
        let format = parse_format(&format)?;
        self.inner
            .set_default_format(format)
            .map_err(sz_error_to_napi)
    }

    /// The default output's format. Requires Senzing >= 4.5.1 / 4.6.0 (throws
    /// `SzConfigurationError` on 4.5.0).
    #[napi(ts_return_type = "'LEGACY' | 'JSONL' | 'BARE' | 'DEFAULT'")]
    pub fn get_default_format(&self) -> napi::Result<String> {
        self.inner
            .get_default_format()
            .map(|f| f.as_str().to_owned())
            .map_err(sz_error_to_napi)
    }

    /// Sets the default output's level. Registered callbacks keep their own levels. Safe at any
    /// time.
    #[napi]
    pub fn set_default_log_level(
        &self,
        #[napi(ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
        level: String,
    ) -> napi::Result<()> {
        let level = parse_level(&level)?;
        self.inner
            .set_default_log_level(level)
            .map_err(sz_error_to_napi)
    }

    /// The default output's level. Requires Senzing >= 4.5.1 / 4.6.0 (throws
    /// `SzConfigurationError` on 4.5.0).
    #[napi(ts_return_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
    pub fn get_default_log_level(&self) -> napi::Result<String> {
        self.inner
            .get_default_log_level()
            .map(|l| l.as_str().to_owned())
            .map_err(sz_error_to_napi)
    }

    /// The effective level: the minimum over the default output and every registered callback.
    /// Safe at any time.
    #[napi(ts_return_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
    pub fn get_effective_log_level(&self) -> napi::Result<String> {
        self.inner
            .get_effective_log_level()
            .map(|l| l.as_str().to_owned())
            .map_err(sz_error_to_napi)
    }
}

/// A live native callback registration. `unregister()` removes it.
#[napi(js_name = "SzLogRegistration")]
pub struct SzLogRegistrationWrapper {
    inner: Option<SzLogRegistration>,
    /// The `maxQueued` limit; kept after `unregister()` / `leak()` so `getDropped` still works.
    queue: Option<Arc<QueueLimit>>,
}

impl SzLogRegistrationWrapper {
    fn new(inner: SzLogRegistration, queue: Option<Arc<QueueLimit>>) -> Self {
        Self {
            inner: Some(inner),
            queue,
        }
    }
}

impl Drop for SzLogRegistrationWrapper {
    /// Garbage collection never unregisters: GC runs at arbitrary times, and on Senzing 4.5.0
    /// unregistering while engine threads log is unsafe. An unreleased registration is leaked.
    fn drop(&mut self) {
        if let Some(registration) = self.inner.take() {
            registration.leak();
        }
    }
}

#[napi]
impl SzLogRegistrationWrapper {
    /// Unregisters the callback. Calling it again does nothing.
    ///
    /// On Senzing 4.5.0, call it only while no engine threads run (before the first engine
    /// initialization or after `destroy()`). Records already queued are still delivered.
    #[napi]
    pub fn unregister(&mut self) {
        drop(self.inner.take());
    }

    /// Keeps the callback registered for the rest of the process, with no way to remove it.
    #[napi]
    pub fn leak(&mut self) {
        if let Some(registration) = self.inner.take() {
            registration.leak();
        }
    }

    /// Changes this callback's minimum level. Requires Senzing >= 4.5.1 / 4.6.0 (throws
    /// `SzConfigurationError` on 4.5.0).
    #[napi]
    pub fn set_level(
        &self,
        #[napi(ts_arg_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
        min_level: String,
    ) -> napi::Result<()> {
        let level = parse_level(&min_level)?;
        let registration = self.inner.as_ref().ok_or_else(released)?;
        registration.set_level(level).map_err(sz_error_to_napi)
    }

    /// This callback's current minimum level. Requires Senzing >= 4.5.1 / 4.6.0 (throws
    /// `SzConfigurationError` on 4.5.0).
    #[napi(ts_return_type = "'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL' | 'OFF'")]
    pub fn get_level(&self) -> napi::Result<String> {
        let registration = self.inner.as_ref().ok_or_else(released)?;
        registration
            .level()
            .map(|l| l.as_str().to_owned())
            .map_err(sz_error_to_napi)
    }

    /// How many records were dropped because `maxQueued` records were already waiting for the
    /// callback. Always 0 without `maxQueued`. Still readable after `unregister()` / `leak()`.
    #[napi]
    pub fn get_dropped(&self) -> f64 {
        // An f64 is exact up to 2^53 records.
        self.queue
            .as_ref()
            .map_or(0.0, |queue| queue.dropped() as f64)
    }
}

/// Collects the records logged on the thread that created it until `finish()` (Senzing >= 4.5.1 /
/// 4.6.0).
#[napi(js_name = "SzLogCapture")]
pub struct SzLogCaptureWrapper {
    registration: Option<SzLogRegistration>,
    entries: Arc<std::sync::Mutex<Vec<SzLogEntry>>>,
}

impl Drop for SzLogCaptureWrapper {
    /// As for `SzLogRegistration`: garbage collection leaks rather than unregisters.
    fn drop(&mut self) {
        if let Some(registration) = self.registration.take() {
            registration.leak();
        }
    }
}

#[napi]
impl SzLogCaptureWrapper {
    /// Unregisters, then returns everything captured (an empty array when called again).
    #[napi]
    pub fn finish(&mut self) -> Vec<JsLogRecord> {
        drop(self.registration.take());
        let entries = std::mem::take(
            &mut *self
                .entries
                .lock()
                .unwrap_or_else(std::sync::PoisonError::into_inner),
        );
        entries.into_iter().map(JsLogRecord::from_entry).collect()
    }
}

/// Gets the logging interface without an `SzEnvironment`.
///
/// Logging is process-global native state that needs no engine initialization, so this neither
/// creates nor touches the environment singleton: it works before any environment exists and
/// after `destroy()`, and holding the result never makes `destroy()` fail. Equivalent to
/// `env.getLogging()`.
///
/// ```typescript
/// import { getLogging } from "@senzing/sdk";
///
/// const logging = getLogging(); // before any SzEnvironment exists
/// logging.setDefaultOutput({ type: "FILE", path: "/var/log/senzing/sz.log" });
/// ```
#[napi(js_name = "getLogging")]
pub fn get_logging() -> napi::Result<SzLoggingWrapper> {
    // A plain `SzEnvironmentCore` value (not `get_instance`): no singleton, no native call. Its
    // `get_logging` returns sz-rust-sdk's stateless `SzLoggingCore`.
    let env = SzEnvironmentCore::new("sz-napi-logging", "{}", false).map_err(sz_error_to_napi)?;
    let logging = env.get_logging().map_err(sz_error_to_napi)?;
    Ok(SzLoggingWrapper::from_inner(Arc::from(logging)))
}

/// A named log constant (`name` is the Rust variant name, `value` the canonical string).
#[napi(object)]
pub struct LogConstantEntry {
    pub name: String,
    pub value: String,
}

/// Returns every log level, most verbose first, as `{ name, value }` (`{ name: 'Warn', value:
/// 'WARN' }`). The JS wrapper builds the frozen `SzLogLevel` object from it.
#[napi]
pub fn get_log_levels() -> Vec<LogConstantEntry> {
    SzLogLevel::ALL
        .iter()
        .map(|l| LogConstantEntry {
            name: format!("{l:?}"),
            value: l.as_str().to_owned(),
        })
        .collect()
}

/// Returns every log format as `{ name, value }` (`{ name: 'Jsonl', value: 'JSONL' }`). The JS
/// wrapper builds the frozen `SzLogFormat` object from it.
#[napi]
pub fn get_log_formats() -> Vec<LogConstantEntry> {
    SzLogFormat::ALL
        .iter()
        .map(|f| LogConstantEntry {
            name: format!("{f:?}"),
            value: f.as_str().to_owned(),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    //! The JS <-> sz-rust-sdk conversions. Native delivery, the stubs and the default output are
    //! covered against the real engine by `__tests__/logging.test.ts`.

    use super::*;

    fn output(kind: &str, path: Option<&str>, append: Option<bool>) -> JsLogOutput {
        JsLogOutput {
            kind: kind.to_owned(),
            path: path.map(str::to_owned),
            append,
        }
    }

    #[test]
    fn test_constants_mirror_upstream() {
        let levels: Vec<_> = get_log_levels()
            .into_iter()
            .map(|e| (e.name, e.value))
            .collect();
        assert_eq!(levels.len(), SzLogLevel::ALL.len());
        assert_eq!(levels[3], ("Warn".to_owned(), "WARN".to_owned()));
        let formats: Vec<_> = get_log_formats().into_iter().map(|e| e.value).collect();
        assert_eq!(formats, ["LEGACY", "JSONL", "BARE", "DEFAULT"]);
    }

    #[test]
    fn test_options_default_to_bare() {
        let from_level = parse_options(Either::A("warning".to_owned())).unwrap();
        assert_eq!(
            from_level.native,
            SzLogCallbackOptions::new(SzLogLevel::Warn)
        );
        assert_eq!(from_level.native.format, SzLogFormat::Bare);
        assert_eq!(from_level.max_queued, None);

        let object = |format: Option<&str>, max_queued: Option<u32>| {
            parse_options(Either::B(JsLogCallbackOptions {
                min_level: "debug".to_owned(),
                format: format.map(str::to_owned),
                max_queued,
            }))
        };
        assert_eq!(object(None, None).unwrap().native.format, SzLogFormat::Bare);
        assert_eq!(
            object(Some("json"), None).unwrap().native.format,
            SzLogFormat::Jsonl
        );
        assert!(object(Some("xml"), None).is_err());
        assert!(parse_options(Either::A("loud".to_owned())).is_err());
        assert_eq!(
            object(None, Some(5)).unwrap().max_queued,
            NonZeroU32::new(5)
        );
        assert!(object(None, Some(0)).is_err());
    }

    #[test]
    fn test_module_get_logging_needs_no_environment() {
        // No native call: the effective-level query below is the first one, and it needs no init.
        let logging = get_logging().unwrap();
        assert!(SzEnvironmentCore::try_get_instance().is_none());
        assert!(logging.get_effective_log_level().is_ok());
    }

    #[test]
    fn test_queue_limit_caps_and_counts() {
        let limit = QueueLimit::new(NonZeroU32::new(2).unwrap());
        let first = limit.acquire().unwrap();
        let second = limit.acquire().unwrap();
        assert!(limit.acquire().is_none());
        assert!(limit.acquire().is_none());
        assert_eq!(limit.dropped(), 2);
        drop(first);
        let third = limit.acquire().unwrap();
        assert_eq!(limit.in_flight.load(Ordering::Relaxed), 2);
        drop((second, third));
        assert_eq!(limit.in_flight.load(Ordering::Relaxed), 0);
        assert_eq!(limit.dropped(), 2);
    }

    #[test]
    fn test_output_round_trips() {
        let cases = [
            (output("stderr", None, None), SzLogOutput::Stderr),
            (output("STDOUT", None, None), SzLogOutput::Stdout),
            (output(" Null ", None, None), SzLogOutput::Null),
            (output("CALLBACK", None, None), SzLogOutput::Callback),
            (
                output("FILE", Some("a.log"), None),
                SzLogOutput::file("a.log"),
            ),
            (
                output("file", Some("a.log"), Some(true)),
                SzLogOutput::append_file("a.log"),
            ),
        ];
        for (js, expected) in cases {
            let converted = js.into_output().unwrap();
            assert_eq!(converted, expected);
            let back = JsLogOutput::from_output(converted)
                .unwrap()
                .into_output()
                .unwrap();
            assert_eq!(back, expected);
        }
        assert!(output("FILE", None, None).into_output().is_err());
        assert!(output("SYSLOG", None, None).into_output().is_err());
    }
}
