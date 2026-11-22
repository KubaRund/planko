#!/usr/bin/env bash
set -euo pipefail
APK="${1:-apk/app-debug.apk}"
mkdir -p test-results/android
adb wait-for-device
adb install -r "$APK"
adb shell am force-stop cz.altivox.planko
adb logcat -c
adb shell am start -W -n cz.altivox.planko/.MainActivity
ready=0
for attempt in $(seq 1 35); do
  if adb logcat -d -s PLANKO:I | grep -q 'GAME_READY canvas'; then ready=1; break; fi
  sleep 1
done
adb logcat -d -s PLANKO:V AndroidRuntime:E > test-results/android/logcat.txt
adb exec-out screencap -p > test-results/android/start-screen.png
if [[ "$ready" != 1 ]]; then
  echo 'PLANKO failed to report readiness in Android WebView'
  tail -100 test-results/android/logcat.txt
  exit 1
fi
adb shell pidof cz.altivox.planko
adb shell dumpsys window | grep -E 'mCurrentFocus.*cz.altivox.planko|mFocusedApp.*cz.altivox.planko'
echo 'PLANKO native startup verified: canvas renderer ready and activity focused'
