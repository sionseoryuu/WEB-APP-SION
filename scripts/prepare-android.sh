#!/usr/bin/env bash
# Membuat proyek Android (Capacitor) dari hasil build web, lengkap dengan izin kamera & ikon.
set -euo pipefail
[ -d android ] || npx cap add android
npx cap sync android

MANIFEST=android/app/src/main/AndroidManifest.xml
for perm in CAMERA POST_NOTIFICATIONS; do
  grep -q "android.permission.$perm" "$MANIFEST" || \
    sed -i "s#<application#<uses-permission android:name=\"android.permission.$perm\" />\n    <application#" "$MANIFEST"
done
grep -q "android.hardware.camera" "$MANIFEST" || \
  sed -i 's#<application#<uses-feature android:name="android.hardware.camera" android:required="false" />\n    <application#' "$MANIFEST"

# Ikon launcher dari public/icons
RES=android/app/src/main/res
rm -rf "$RES"/mipmap-anydpi-v26
for d in mdpi hdpi xhdpi xxhdpi xxxhdpi; do
  cp public/icons/icon-192.png "$RES/mipmap-$d/ic_launcher.png"
  cp public/icons/icon-192.png "$RES/mipmap-$d/ic_launcher_round.png"
  cp public/icons/icon-192.png "$RES/mipmap-$d/ic_launcher_foreground.png"
done
