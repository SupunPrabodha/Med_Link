# Kubernetes (minimal)

This folder contains a minimal set of manifests to deploy the MediLink stack on Kubernetes.

**Note:** These manifests are intentionally simple for marking purposes.

## Contents
- `namespace.yml`
- `configmap.yml` (non-secret settings)
- `secrets.yml` (demo secrets)
- `postgres.yml` (StatefulSets)
- `rabbitmq.yml`
- `apps.yml` (Deployments + Services)
- `ingress.yml`

## Apply (local cluster)
### Option A: Docker Desktop Kubernetes (recommended on Windows)
1) Enable Kubernetes in Docker Desktop:
	- Docker Desktop → **Settings** → **Kubernetes** → **Enable Kubernetes** → Apply & Restart

2) Confirm `kubectl` sees the Docker Desktop context:
```bash
kubectl config get-contexts
kubectl config use-context docker-desktop
kubectl cluster-info
```

3) Ensure images exist locally.
	- These manifests use `imagePullPolicy: IfNotPresent` and images like `medilink/api-gateway:0.1.0`.
	- On Docker Desktop Kubernetes, locally built Docker images are usable by the cluster.

4) Deploy:
```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/rabbitmq.yml
kubectl apply -f k8s/apps.yml
```

5) Wait for readiness:
```bash
kubectl get pods -n medilink
kubectl rollout status deployment/api-gateway -n medilink
kubectl rollout status deployment/frontend -n medilink
```

6) Access the app (without ingress) via port-forward (works even if you don’t install an ingress controller):
```bash
kubectl -n medilink port-forward svc/frontend 8080:80
kubectl -n medilink port-forward svc/api-gateway 8090:8090
```
Then use:
- Frontend: http://localhost:8080
- Gateway: http://localhost:8090
- Gateway Swagger: http://localhost:8090/swagger

7) Optional: Ingress
	- `k8s/ingress.yml` requires an ingress controller (for example `ingress-nginx`).
	- If you install an ingress controller, add a host entry for `medilink.local` → ingress IP (often `127.0.0.1` on Docker Desktop) and then apply:
```bash
kubectl apply -f k8s/ingress.yml
```

Tip: there are helper scripts:
- `scripts/k8s-docker-desktop-deploy.ps1`
- `scripts/k8s-docker-desktop-clean.ps1`

1) Ensure the Docker images exist in your cluster (for example, build them locally and load them into Minikube/Kind). The manifests use `imagePullPolicy: IfNotPresent`.

2) Apply manifests:
```bash
kubectl apply -f k8s/namespace.yml
kubectl apply -f k8s/configmap.yml
kubectl apply -f k8s/secrets.yml
kubectl apply -f k8s/postgres.yml
kubectl apply -f k8s/rabbitmq.yml
kubectl apply -f k8s/apps.yml
kubectl apply -f k8s/ingress.yml
```

3) Ingress routes:
- Frontend: `/`
- API Gateway: `/api`
- Swagger UI: `/swagger`

