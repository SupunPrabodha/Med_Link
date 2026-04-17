## patient-service

Patient management service.

Implemented features:
- Patient profile create/update + profile photo upload
- Medical report upload/list/download/delete
- Internal endpoints used by other services (report lookups/download)

Local dev defaults:
- HTTP port: `8086`
- DB: `postgres-patient` via [docker-compose.yml](docker-compose.yml)

Smoke endpoint:
- `GET /api/patients/ping`
