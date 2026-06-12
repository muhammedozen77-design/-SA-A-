$ErrorActionPreference = "Stop"

if (-not $env:OPENAI_API_KEY) {
  Write-Host "OPENAI_API_KEY ortam degiskenini ayarla."
  Write-Host '$env:OPENAI_API_KEY="sk-proj-..."'
  exit 1
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if ($nodeCommand) {
  & $nodeCommand.Source server.js
  exit $LASTEXITCODE
}

if (Test-Path $bundledNode) {
  & $bundledNode server.js
  exit $LASTEXITCODE
}

Write-Host "Node.js bulunamadi. Node.js 18 veya daha yeni bir surum kur."
exit 1
