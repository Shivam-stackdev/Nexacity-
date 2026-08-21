#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GODOT_BIN="${GODOT_BIN:-/home/ubuntu/.local/bin/godot4}"
ANDROID_SDK="${ANDROID_SDK_ROOT:-/home/ubuntu/android-sdk}"
TEMPLATE_DIR="${GODOT_TEMPLATE_DIR:-/home/ubuntu/.local/share/godot/export_templates/4.4.1.stable}"
KEYSTORE="${GODOT_DEBUG_KEYSTORE:-/home/ubuntu/.android/debug.keystore}"
OUTPUT_DIR="$PROJECT_DIR/build"
WORK_DIR="$OUTPUT_DIR/apk_assets"
PCK="$OUTPUT_DIR/compact-city.pck"
UNSIGNED="$OUTPUT_DIR/apk_unsigned.apk"
ALIGNED="$OUTPUT_DIR/apk_aligned.apk"
APK="$OUTPUT_DIR/compact-city-debug.apk"

export ANDROID_SDK_ROOT="$ANDROID_SDK"
export ANDROID_HOME="$ANDROID_SDK"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"

mkdir -p "$OUTPUT_DIR"
rm -rf "$WORK_DIR" "$UNSIGNED" "$ALIGNED" "$APK"

"$GODOT_BIN" --headless --path "$PROJECT_DIR" --export-pack "Android Debug APK" "$PCK"
mkdir -p "$WORK_DIR/assets"
cp "$PCK" "$WORK_DIR/assets/data.pck"
python3 "$PROJECT_DIR/tools/write_command_line.py" "$WORK_DIR/assets/_cl_" \
  --main-pack assets://data.pck \
  --xr_mode_regular \
  --xr-mode off \
  --fullscreen

cp "$TEMPLATE_DIR/android_debug.apk" "$UNSIGNED"
(
  cd "$WORK_DIR"
  zip -q -r "$UNSIGNED" assets
)

"$ANDROID_SDK/build-tools/34.0.0/zipalign" -f 4 "$UNSIGNED" "$ALIGNED"
"$ANDROID_SDK/build-tools/34.0.0/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --ks-key-alias androiddebugkey \
  --out "$APK" "$ALIGNED"
"$ANDROID_SDK/build-tools/34.0.0/apksigner" verify --verbose "$APK" >/dev/null

printf 'APK_READY=%s\n' "$APK"
printf 'APK_SIZE_BYTES=%s\n' "$(stat -c '%s' "$APK")"
