#!/usr/bin/env bash
# Compila y firma el APK con las herramientas del SDK de Android (sin Gradle).
# Variables: APK (nombre del archivo), VC (número de versión), KS_B64 y KS_PASS (clave de firma).
set -euo pipefail
cd "$(dirname "$0")"

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[ -d "$SDK" ] || { echo "No encuentro el SDK de Android (ANDROID_HOME)"; exit 1; }
BT="$SDK/build-tools/$(ls "$SDK/build-tools" | sort -V | tail -1)"
PLAT_DIR="$SDK/platforms/android-34"
[ -d "$PLAT_DIR" ] || PLAT_DIR="$SDK/platforms/$(ls "$SDK/platforms" | grep -E '^android-[0-9]+$' | sort -V | tail -1)"
PLAT="$PLAT_DIR/android.jar"
VC="${VC:-1}"
APK="${APK:-app.apk}"
echo "build-tools: $BT"
echo "plataforma:  $PLAT"
echo "versión:     $VC"

B=build OUT=../out
rm -rf "$B" "$OUT"
mkdir -p "$B/gen" "$B/classes" "$OUT"

"$BT/aapt2" compile --dir res -o "$B/res.zip"
"$BT/aapt2" link -I "$PLAT" --manifest AndroidManifest.xml -o "$B/base.apk" "$B/res.zip" --java "$B/gen" \
  --min-sdk-version 26 --target-sdk-version 34 --version-code "$VC" --version-name "1.$VC" --auto-add-overlay

javac -encoding UTF-8 --release 8 -nowarn -Xlint:-options -classpath "$PLAT" \
  -d "$B/classes" $(find java "$B/gen" -name '*.java')
"$BT/d8" --release --min-api 26 --lib "$PLAT" --output "$B" $(find "$B/classes" -name '*.class')

cp "$B/base.apk" "$B/unsigned.apk"
(cd "$B" && zip -q -j unsigned.apk classes.dex)
"$BT/zipalign" -p -f 4 "$B/unsigned.apk" "$B/aligned.apk"

if [ -n "${KS_B64:-}" ]; then
  echo "$KS_B64" | base64 -d > "$B/key.p12"
  "$BT/apksigner" sign --ks "$B/key.p12" --ks-type PKCS12 --ks-pass env:KS_PASS --ks-key-alias app --out "$OUT/$APK" "$B/aligned.apk"
  rm -f "$B/key.p12"
else
  echo "Sin clave (KS_B64): no se firma"; cp "$B/aligned.apk" "$OUT/$APK"
fi

"$BT/apksigner" verify --print-certs "$OUT/$APK" | grep -v -i 'warning' || true
"$BT/aapt2" dump badging "$OUT/$APK" | grep -E "^(package|sdkVersion|targetSdkVersion|application-label|launchable)" || true
ls -l "$OUT/$APK"
