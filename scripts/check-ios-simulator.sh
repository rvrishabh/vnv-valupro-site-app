#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORKSPACE="$ROOT/ios/vnvsiteapp.xcworkspace"
SCHEME="vnvsiteapp"

if [[ ! -d "$WORKSPACE" ]]; then
  echo "error: iOS workspace not found at ios/vnvsiteapp.xcworkspace" >&2
  exit 1
fi

DESTINATIONS="$(xcodebuild -showdestinations \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" 2>&1 || true)"

if echo "$DESTINATIONS" | grep -q "platform:iOS Simulator"; then
  exit 0
fi

echo "error: No eligible iOS Simulator destinations for Xcode $(xcodebuild -version | head -1)." >&2
echo "" >&2

if echo "$DESTINATIONS" | grep -q "iOS 26.5 is not installed"; then
  echo "Xcode $(xcodebuild -version | awk 'NR==2{print $2}') requires the iOS 26.5 Simulator runtime." >&2
  echo "Installed simulator runtimes:" >&2
  xcrun simctl runtime list 2>/dev/null | sed 's/^/  /' >&2 || true
  echo "" >&2
  echo "Install the missing platform (~8.5 GB), then run pnpm run ios again:" >&2
  echo "  pnpm run ios:download-platform" >&2
  echo "" >&2
  echo "Or in Xcode: Settings → Components → iOS 26.5 Simulator → Download" >&2
else
  echo "$DESTINATIONS" | tail -20 >&2
fi

exit 1
