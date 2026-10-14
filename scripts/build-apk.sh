#!/bin/zsh
set -eu
cd "${0:A:h}/.."
FOODLENS_BUNDLED_NODE="${FOODLENS_NODE_BIN:-$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin}"
if [[ -x "$FOODLENS_BUNDLED_NODE/node" ]]; then
  export PATH="$FOODLENS_BUNDLED_NODE:$PATH"
fi
node -e 'if(Number(process.versions.node.split(".")[0])<22){console.error("需要 Node.js 22.13+");process.exit(1)}'
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="$(/usr/libexec/java_home -v 17)"
FOODLENS_VERSION="$(node -p 'require("./package.json").version')"
node node_modules/expo/bin/cli prebuild --platform android --no-install
(cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a --max-workers=4 --console=plain -Dorg.gradle.jvmargs='-Xmx4096m -XX:MaxMetaspaceSize=1024m')
mkdir -p outputs
cp android/app/build/outputs/apk/release/app-release.apk outputs/FoodLens-${FOODLENS_VERSION}-preview.apk
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify outputs/FoodLens-${FOODLENS_VERSION}-preview.apk
shasum -a 256 outputs/FoodLens-${FOODLENS_VERSION}-preview.apk > outputs/FoodLens-${FOODLENS_VERSION}-preview.apk.sha256
