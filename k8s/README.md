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

