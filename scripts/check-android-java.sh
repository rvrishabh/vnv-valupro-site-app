#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

java_major_version() {
  local home="$1"
  if [[ ! -x "$home/bin/java" ]]; then
    return 1
  fi
  "$home/bin/java" -version 2>&1 | sed -n 's/.*version "\([0-9]*\).*/\1/p' | head -1
}

candidate_is_jdk17() {
  local candidate="$1"
  [[ -n "$candidate" && -d "$candidate" ]] || return 1
  [[ "$(java_major_version "$candidate")" == "17" ]]
}

JDK17_CANDIDATES=(
  "${JAVA_HOME:-}"
  "/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
  "/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
)

if command -v /usr/libexec/java_home >/dev/null 2>&1; then
  JDK17_CANDIDATES+=("$(/usr/libexec/java_home -v 17 2>/dev/null || true)")
fi

RESOLVED_JDK17=""
for candidate in "${JDK17_CANDIDATES[@]}"; do
  if candidate_is_jdk17 "$candidate"; then
    RESOLVED_JDK17="$candidate"
    break
  fi
done

if [[ -z "$RESOLVED_JDK17" ]]; then
  echo "error: JDK 17 is required for Android builds (Gradle 9 and doctor require JDK <= 20)." >&2
  echo "" >&2
  echo "Install JDK 17, then retry:" >&2
  echo "  brew install openjdk@17" >&2
  echo "" >&2
  echo "Add to ~/.zshenv or ~/.zshrc:" >&2
  echo '  export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"' >&2
  echo '  export PATH="$JAVA_HOME/bin:$PATH"' >&2
  exit 1
fi

export JAVA_HOME="$RESOLVED_JDK17"
export PATH="$JAVA_HOME/bin:$PATH"

if [[ -x "$ROOT/android/gradlew" ]]; then
  (cd "$ROOT/android" && ./gradlew --stop >/dev/null 2>&1 || true)
fi
