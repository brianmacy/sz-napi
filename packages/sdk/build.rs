use std::env;

fn main() {
    napi_build::setup();

    // Embed rpath so the .node cdylib can find libSz at runtime without
    // DYLD_LIBRARY_PATH (macOS SIP strips it) or LD_LIBRARY_PATH (Linux).
    let senzing_lib_path = detect_senzing_lib_path();
    println!("cargo:rustc-cdylib-link-arg=-Wl,-rpath,{senzing_lib_path}");
}

fn detect_senzing_lib_path() -> String {
    if let Ok(path) = env::var("SENZING_LIB_PATH") {
        return path;
    }

    #[cfg(target_os = "macos")]
    {
        use std::path::Path;
        let homebrew_path = "/opt/homebrew/opt/senzing/runtime/er/lib";
        if Path::new(homebrew_path).join("libSz.dylib").exists() {
            return homebrew_path.to_string();
        }
        let intel_homebrew_path = "/usr/local/opt/senzing/runtime/er/lib";
        if Path::new(intel_homebrew_path).join("libSz.dylib").exists() {
            return intel_homebrew_path.to_string();
        }
    }

    if cfg!(target_os = "windows") {
        "C:\\Program Files\\Senzing\\er\\lib".to_string()
    } else {
        "/opt/senzing/er/lib".to_string()
    }
}
