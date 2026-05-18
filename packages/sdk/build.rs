use std::env;

fn main() {
    napi_build::setup();

    let senzing_lib_path = detect_senzing_lib_path();
    println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,{senzing_lib_path}");

    // The official Senzing cask (4.3+) is missing rpath entries for its
    // OpenSSL and SQLite transitive dependencies.  Add Homebrew's lib dirs
    // so dlopen() inside libSz can resolve them without DYLD_LIBRARY_PATH
    // (which macOS SIP strips).
    #[cfg(target_os = "macos")]
    for candidate in [
        "/opt/homebrew/lib",
        "/usr/local/lib",
        "/opt/homebrew/opt/openssl@3/lib",
        "/opt/homebrew/opt/sqlite/lib",
    ] {
        if std::path::Path::new(candidate).exists() {
            println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,{candidate}");
        }
    }
}

fn detect_senzing_lib_path() -> String {
    if let Ok(path) = env::var("SENZING_LIB_PATH") {
        return path;
    }

    #[cfg(target_os = "macos")]
    {
        use std::path::Path;
        // Official Senzing cask (senzingsdk): er/lib
        for prefix in [
            "/opt/homebrew/opt/senzing/er/lib",
            "/usr/local/opt/senzing/er/lib",
        ] {
            if Path::new(prefix).join("libSz.dylib").exists()
                || Path::new(prefix).join("libSz.so").exists()
            {
                return prefix.to_string();
            }
        }
    }

    if cfg!(target_os = "windows") {
        "C:\\Program Files\\Senzing\\er\\lib".to_string()
    } else {
        "/opt/senzing/er/lib".to_string()
    }
}
