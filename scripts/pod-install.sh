#!/usr/bin/env bash
# pod install that tolerates Xcode living at a path with spaces.
#
# RN's glog pod runs autoconf with CC="$(xcrun -find cc) -isysroot $(xcrun --show-sdk-path)".
# When Xcode is at e.g. "/Volumes/RV other data/apps/Xcode.app" that string is
# split at the spaces and configure fails with "C compiler cannot create
# executables". xcrun always resolves symlinks, so this puts a thin xcrun
# wrapper first on PATH that rewrites the Xcode prefix to a space-free symlink.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export LANG="${LANG:-en_US.UTF-8}"

DEVELOPER_DIR_REAL="$(xcode-select -p)"
XCODE_APP="${DEVELOPER_DIR_REAL%/Contents/Developer}"

if [[ "$XCODE_APP" == *" "* ]]; then
  LINK="$HOME/.xcode-nospace.app"
  ln -sfn "$XCODE_APP" "$LINK"

  SHIM_DIR="$(mktemp -d /tmp/xcrun-shim.XXXXXX)"
  trap 'rm -rf "$SHIM_DIR"' EXIT
  cat >"$SHIM_DIR/xcrun" <<SHIM
#!/usr/bin/env bash
/usr/bin/xcrun "\$@" | sed "s|$XCODE_APP|$LINK|g"
exit \${PIPESTATUS[0]}
SHIM
  chmod +x "$SHIM_DIR/xcrun"
  export PATH="$SHIM_DIR:$PATH"
  echo "Xcode path has spaces — using $LINK for pod install"

  # A failed earlier attempt leaves a broken glog in the CocoaPods cache.
  rm -rf "$HOME/Library/Caches/CocoaPods/Pods/External/glog"
fi

cd "$ROOT/ios"
if bundle check >/dev/null 2>&1; then
  bundle exec pod install "$@"
else
  pod install "$@"
fi
