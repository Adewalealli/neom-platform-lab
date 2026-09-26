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
