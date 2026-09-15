#!/usr/bin/env bash
# `pnpm ios` always targets a simulator, never a paired iPhone.
# Override the model with: IOS_SIMULATOR="iPhone 17" pnpm ios
set -euo pipefail

SIMULATOR="${IOS_SIMULATOR:-iPhone 17 Pro}"

UDID="$(xcrun simctl list devices available | grep -F "    $SIMULATOR (" | head -1 | sed -E 's/.*\(([0-9A-F-]{36})\).*/\1/')"
if [[ -z "$UDID" ]]; then
  echo "error: simulator \"$SIMULATOR\" not found. Available:" >&2
  xcrun simctl list devices available | grep -E "iPhone|iPad" >&2
  exit 1
fi

xcrun simctl boot "$UDID" 2>/dev/null || true   # already booted is fine
open -a Simulator --args -CurrentDeviceUDID "$UDID"

exec npx react-native run-ios --udid "$UDID" "$@"
