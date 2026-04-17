Param(
  [string]$Namespace = "medilink"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
  throw "Missing required command 'kubectl'."
}

$contexts = (kubectl config get-contexts -o name 2>$null)
if ($contexts -and ($contexts -contains "docker-desktop")) {
  kubectl config use-context docker-desktop | Out-Null
}

Write-Host "Deleting namespace '$Namespace' (this removes all MediLink resources)..."
kubectl delete namespace $Namespace --ignore-not-found=true

Write-Host "Done."
