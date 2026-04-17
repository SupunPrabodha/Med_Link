Param(
  [string]$Namespace = "medilink",
  [switch]$WithIngress,
  [switch]$Wait
)

$ErrorActionPreference = "Stop"

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Missing required command '$name'."
  }
}

Assert-Command kubectl

# Ensure Docker Desktop context exists
$contexts = (kubectl config get-contexts -o name 2>$null)
if (-not $contexts) {
  throw "No kubectl contexts configured. Enable Kubernetes in Docker Desktop (Settings → Kubernetes → Enable), then retry."
}

if ($contexts -notcontains "docker-desktop") {
  throw "Kubernetes context 'docker-desktop' not found. Enable Kubernetes in Docker Desktop, then retry."
}

Write-Host "Using kubectl context: docker-desktop"
kubectl config use-context docker-desktop | Out-Null

Write-Host "Applying manifests to namespace '$Namespace'..."
$manifests = @(
  "k8s/namespace.yml",
  "k8s/configmap.yml",
  "k8s/secrets.yml",
  "k8s/postgres.yml",
  "k8s/rabbitmq.yml",
  "k8s/apps.yml"
)
foreach ($m in $manifests) {
  kubectl apply -f $m
}

if ($WithIngress) {
  Write-Host "Applying ingress manifest..."
  kubectl apply -f "k8s/ingress.yml"
  Write-Host "Note: ingress requires an ingress controller (e.g., ingress-nginx)."
}

if ($Wait) {
  Write-Host "Waiting for core deployments to become available..."
  $deployments = @(
    "service-discovery",
    "api-gateway",
    "auth-service",
    "doctor-service",
    "patient-service",
    "appointment-service",
    "payment-service",
    "telemedicine-service",
    "notification-service",
    "prescription-service",
    "symptom-checker-service",
    "ai-symptom-service",
    "frontend"
  )

  foreach ($d in $deployments) {
    kubectl rollout status deployment/$d -n $Namespace --timeout=300s
  }
}

Write-Host "Done."
Write-Host "Quick checks:"
Write-Host "  kubectl get pods -n $Namespace"
Write-Host "  kubectl get svc -n $Namespace"
Write-Host "Access without ingress (port-forward):"
Write-Host "  kubectl -n $Namespace port-forward svc/frontend 8080:80"
Write-Host "  kubectl -n $Namespace port-forward svc/api-gateway 8090:8090"
