# RepoView uninstaller for Windows (PowerShell)
# Usage: irm https://raw.githubusercontent.com/kittystrikeforce911/repoview-ksf911/master/uninstall.ps1 | iex
#   or:  ./uninstall.ps1  (if blocked, run: powershell -ExecutionPolicy Bypass -File .\uninstall.ps1)

 $ErrorActionPreference = "Stop"

 $installDir = "$env:LOCALAPPDATA\Programs\repoview"
 $binary = Join-Path $installDir "repoview.exe"

# Binary and pending self-update leftover (repoview.exe.old)
 $found = $false
foreach ($f in @($binary, "$binary.old")) {
    if (Test-Path $f) {
        Remove-Item -Force $f
        Write-Host "Removed $f"
        $found = $true
    }
}
if (-not $found) {
    Write-Host "No repoview.exe found at $binary (nothing to remove)"
}

# Remove the install directory only if the removal left it empty
if ((Test-Path $installDir) -and -not (Get-ChildItem $installDir)) {
    Remove-Item -Force $installDir
    Write-Host "Removed empty directory $installDir"
}

# Update state (matches os.UserConfigDir() in update.go: <config>\repoview\state.json)
 $stateDir = Join-Path $env:APPDATA "repoview"
if (Test-Path $stateDir) {
    Remove-Item -Recurse -Force $stateDir
    Write-Host "Removed update state $stateDir"
}

# Drop the install directory from the user PATH if it was added manually
# (install.ps1's final printout invites doing so)
 $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath) {
    $kept = $userPath -split ';' | Where-Object { $_ -and ($_.TrimEnd('\') -ne $installDir.TrimEnd('\')) }
    $newPath = $kept -join ';'
    if ($newPath -ne $userPath) {
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Host "Removed $installDir from your user PATH"
    }
}

Write-Host "RepoView uninstalled."
