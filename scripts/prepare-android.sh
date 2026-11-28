#!/usr/bin/env bash
# Membuat proyek Android (Capacitor) dari hasil build web, lengkap dengan izin kamera & ikon.
set -euo pipefail
[ -d android ] || npx cap add android
npx cap sync android

MANIFEST=android/app/src/main/AndroidManifest.xml
for perm in CAMERA POST_NOTIFICATIONS USE_BIOMETRIC VIBRATE RECEIVE_BOOT_COMPLETED; do
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

# Ikon notifikasi (siluet putih) untuk pengingat lokal
DRAW=$RES/drawable
mkdir -p "$DRAW"
cat > "$DRAW/ic_stat_lifeos.xml" <<'XML'
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,2a10,10 0 1,0 0,20a10,10 0 1,0 0,-20zM12,6l1.6,4.4L18,12l-4.4,1.6L12,18l-1.6,-4.4L6,12l4.4,-1.6z"/>
</vector>
XML

# Android 7.0+ (API 24) diperlukan oleh plugin biometrik
VARS=android/variables.gradle
[ -f "$VARS" ] && sed -i -E 's/minSdkVersion = [0-9]+/minSdkVersion = 24/' "$VARS" || true
