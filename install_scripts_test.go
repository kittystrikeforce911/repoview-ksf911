package main

import (
	"os"
	"strings"
	"testing"
)

// tFile reads a repo-root file for the contract assertions below.
func tFile(t *testing.T, name string) string {
	t.Helper()
	b, err := os.ReadFile(name)
	if err != nil {
		t.Fatalf("read %s: %v", name, err)
	}
	return string(b)
}

// TestUninstallScriptsMatchInstallTargets is a contract check: the
// uninstallers must clean up exactly what the installers put down, and
// what update.go actually writes. The scripts are inherently platform
// specific and are not executed here (PowerShell is not installed on
// this device); instead their cleanup targets are pinned so the installer
// pair and the update-state layout cannot silently drift apart.
func TestUninstallScriptsMatchInstallTargets(t *testing.T) {
	installSh := tFile(t, "install.sh")
	uninstallSh := tFile(t, "uninstall.sh")
	installPs1 := tFile(t, "install.ps1")
	uninstallPs1 := tFile(t, "uninstall.ps1")
	updateGo := tFile(t, "update.go")

	// install.sh owns the Unix install location; uninstall.sh defaults
	// to the same directory.
	if !strings.Contains(installSh, `INSTALL_DIR="$HOME/.local/bin"`) {
		t.Error(`install.sh should set INSTALL_DIR="$HOME/.local/bin"` +
			"; update uninstall.sh and this test if that changes")
	}
	for _, want := range []string{
		`$HOME/.local/bin`, // removal matches installer target
		`repoview.old`,     // pending self-update leftover (execPath + ".old")
		`${XDG_CONFIG_HOME:-$HOME/.config}/repoview`, // Linux user config state (os.UserConfigDir)
		`Application Support/repoview`,               // macOS user config state
	} {
		if !strings.Contains(uninstallSh, want) {
			t.Errorf("uninstall.sh should mention %q", want)
		}
	}

	// Windows: install.ps1 owns %LOCALAPPDATA%\Programs\repoview;
	// uninstall.ps1 removes the same tree plus the user PATH entry the
	// installer's printout invites.
	for _, want := range []string{`$env:LOCALAPPDATA\Programs\repoview`} {
		if !strings.Contains(installPs1, want) {
			t.Errorf("install.ps1 should mention %q", want)
		}
		if !strings.Contains(uninstallPs1, want) {
			t.Errorf("uninstall.ps1 should mention %q", want)
		}
	}
	for _, want := range []string{
		`repoview.exe.old`,                  // pending self-update leftover
		`Join-Path $env:APPDATA "repoview"`, // state dir (os.UserConfigDir on Windows)
		`"Path", "User"`,                    // user PATH cleanup
	} {
		if !strings.Contains(uninstallPs1, want) {
			t.Errorf("uninstall.ps1 should mention %q", want)
		}
	}

	// The update state layout both uninstallers rely on: update.go must
	// keep state.json under the "repoview" directory of os.UserConfigDir.
	if !strings.Contains(updateGo, `"repoview", "state.json"`) {
		t.Error(`update.go should write state to <UserConfigDir>/repoview/state.json` +
			"; update the uninstallers and this test if that changes")
	}
}
