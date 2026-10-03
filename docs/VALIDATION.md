# Preparation validation

Executed in the assistant workspace on 2026-09-26:

- `node --check api/app.js`: passed.
- `node --test` in api/: 10/10 passed on Node 22.16.0.
- Tests use an injected mock database interface and real localhost HTTP requests.
- `bash -n scripts/session.sh`: passed.
- compose.yaml parsed successfully with a YAML parser; checked build paths, localhost-only API port,
  absence of a published DB port, project name, named volume, and health-based startup dependency.

Not executed here:

- Live PostgreSQL connectivity or SQL initialization.
- Docker image builds or Docker Compose runtime validation.
- Windows/WSL interoperability on the user's machine.
- Node 24 runtime validation.

The workspace has no Docker engine or PostgreSQL server and cannot resolve the npm registry.
Therefore no fabricated package-lock.json is included. `lab_lock` generates it using npm on the user's
network before the Dockerfile uses `npm ci`. Direct dependency pg is pinned to 8.16.3.

The first user checkpoint must supply the Docker/PostgreSQL/HTTP evidence above before marking it complete.

## Kubernetes API Replica Failure Test

Tested application availability while deliberately deleting one API Pod.

- API replicas before test: 2
- Traffic path: nginx Ingress -> api-service -> API Pods
- Deleted one API Pod during active HTTP traffic
- 15/15 requests returned HTTP 200
- ReplicaSet automatically created a replacement Pod
- Deployment returned to 2/2 Ready
- PostgreSQL remained available throughout

Result: application remained available during a single API replica failure.

## Security Boundary Validation

- API and PostgreSQL use dedicated ServiceAccounts
- Service account token automount disabled
- Verified API Pod has no mounted Kubernetes API token
- Added NetworkPolicy allowing PostgreSQL ingress only from Pods labeled app=api on TCP 5432
- Test intruder Pod could not reach postgres-service
- API Pod continued to query PostgreSQL successfully

Result: Kubernetes API credentials were reduced and database network access was restricted without breaking the application.
