#!/usr/bin/env bash
set -euo pipefail

# uninstall.sh — remove RepoView installed by install.sh
#
# Usage:
#   ./uninstall.sh
#   curl -fsSL https://raw.githubusercontent.com/kittystrikeforce911/repoview-ksf911/master/uninstall.sh | bash
#
# Removes (mirroring install.sh and update.go):
#   - $HOME/.local/bin/repoview and any pending self-update leftover
#     (repoview.old, written by `repoview update` on Windows)
#   - RepoView's update state under the user config directory

INSTALL_DIR="${REPOVIEW_INSTALL_DIR:-$HOME/.local/bin}"
TARGET="$INSTALL_DIR/repoview"

# User config directory (matches os.UserConfigDir() in update.go:
# <config>/repoview/state.json)
case "$(uname -s)" in
  Linux*)  STATE_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/repoview" ;;
  Darwin*) STATE_DIR="$HOME/Library/Application Support/repoview" ;;
  *)
    echo "Error: unsupported operating system: $(uname -s)" >&2
    exit 1
    ;;
esac

found=0
for f in "$TARGET" "${TARGET}.old"; do
  if [ -f "$f" ]; then
    rm -f "$f"
    echo "Removed $f"
    found=1
  fi
done
if [ "$found" -eq 0 ]; then
  echo "No repoview binary found at $TARGET (nothing to remove)"
fi

# Remove the install directory only if the removal left it empty
if [ -d "$INSTALL_DIR" ] && [ -z "$(ls -A "$INSTALL_DIR")" ]; then
  rmdir "$INSTALL_DIR"
  echo "Removed empty directory $INSTALL_DIR"
fi

if [ -d "$STATE_DIR" ]; then
  rm -rf "$STATE_DIR"
  echo "Removed update state $STATE_DIR"
fi

echo "RepoView uninstalled."
