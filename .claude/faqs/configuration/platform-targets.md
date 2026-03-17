## Platform Targets

Senzing v4 supports:

- **macOS**: arm64 ONLY (no x64, no universal/fat binaries)
- **Linux**: x86_64 AND arm64
- **Windows**: x86_64

The `@senzing/configtool` package has NO native Senzing dependency and could theoretically run on any platform, but we target the same platforms for consistency.

### napi-rs target triples

```
aarch64-apple-darwin
x86_64-unknown-linux-gnu
aarch64-unknown-linux-gnu
x86_64-pc-windows-msvc
```
