$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$reportHtml = Join-Path $repoRoot "report.html"
$outPdf = Join-Path $repoRoot "report.pdf"

if (-not (Test-Path $reportHtml)) {
  throw "Missing report source: $reportHtml"
}

$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
  $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}
if (-not (Test-Path $edge)) {
  throw "Microsoft Edge not found. Install Edge or export report.html to PDF manually."
}

# Edge requires a file:// URL
$fileUrl = (New-Object System.Uri($reportHtml)).AbsoluteUri

# Ensure old PDF isn't locked/open
if (Test-Path $outPdf) {
  try { Remove-Item $outPdf -Force } catch { }
}

Write-Host "Generating report.pdf from report.html ..."
& $edge --headless --disable-gpu --no-first-run --no-default-browser-check --print-to-pdf="$outPdf" "$fileUrl" | Out-Null

if (-not (Test-Path $outPdf)) {
  throw "Failed to generate report.pdf (Edge did not produce output)."
}

Write-Host "OK: $outPdf"
