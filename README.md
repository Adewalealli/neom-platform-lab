# NEOM Platform Lab — Project 1

A real Node.js HTTP API backed by PostgreSQL. This is a local learning workload, not production-ready SaaS.
The cohort Project 1 brief is the foundation. The API source and Compose checkpoint are supplied scaffold.
See docs/SOURCES.md for exact provenance and adaptations.

## First result

Create an item over HTTP, restart the API, and read the same item from PostgreSQL.
Then deploy these SAME images using raw Kubernetes manifests in project-01.
No new toy workload, no FAI Atlas production changes.

## Files that matter now

- api/app.js: handles HTTP and executes database queries.
- api/package.json: pins the direct pg dependency. Generate the lockfile before building.
- api/Dockerfile: dependency-install stage, then non-root runtime stage.
- db/init.sql: creates the items table and initial rows on an empty PostgreSQL data volume.
- db/Dockerfile: packages that initialization SQL with PostgreSQL.
- compose.yaml: connects the API and database on a project-specific network, stores data in a named volume.
- docs/PROGRESS.md: current checkpoint and remaining connected project path.

## Run from the user's existing Ubuntu/WSL shell using the working Windows Docker client

Extract the archive so this file exists at:
C:\Users\StarLord\Projects\neom-platform-lab\compose.yaml

Open Docker Desktop and leave existing containers alone. In Ubuntu run each block in sequence;
stop on an error rather than continuing into later steps.

```bash
cd /mnt/c/Users/StarLord/Projects/neom-platform-lab
```

```bash
# This creates a local-only .env once and defines the dc and lab_lock shortcuts.
# Read scripts/session.sh to see the exact commands; it does not alter infrastructure.
source ./scripts/session.sh

# Generate api/package-lock.json with Node in a temporary container.
lab_lock

# Read the Dockerfile before building it.
cat api/Dockerfile
```

```bash
dc up --build --wait --wait-timeout 120
dc ps
```

The build pulls base images/dependencies. It needs Internet access. The 120-second wait is for
service readiness; it is not a total image-download/build time limit.

From your Windows browser, open http://localhost:18080/items.
To keep WSL/Windows localhost forwarding from becoming a detour, these tests send requests
through the working Windows curl client from the same Ubuntu shell:

```bash
curl.exe -fsS --max-time 10 http://127.0.0.1:18080/health
curl.exe -fsS --max-time 10 http://127.0.0.1:18080/items
printf '{"name":"first-platform-record"}' > evidence/new-item.json
curl.exe -fsS --max-time 10 \
  -H 'Content-Type: application/json' \
  --data-binary "@$(wslpath -w "$PWD/evidence/new-item.json")" \
  http://127.0.0.1:18080/items

dc restart api
dc up --wait --wait-timeout 60
curl.exe -fsS --max-time 10 http://127.0.0.1:18080/items
```

The POST returns HTTP 201 plus a row. The final GET must still include first-platform-record.
Repeating POST creates another row; do not expect the command to be idempotent.
This demonstrates that an API restart does not erase the row. It is not yet proof of database
container replacement or disaster recovery; those are later tests.

## Failure output

On a startup error, paste only the error and:

```bash
dc ps -a
dc logs --tail=40 api db
```

Do not paste .env, docker inspect environment, or database passwords.
A missing /var/run/docker.sock from plain docker is the previously known WSL integration issue;
these instructions use docker.exe with its known working desktop-linux context instead.
If Windows Docker itself is unavailable, open Docker Desktop first. Do not reinstall Docker,
restart unrelated FAI containers, reset WSL, delete the cluster, or prune volumes.

## Stop without destroying data

```bash
dc stop
```

Later, return to this folder, source scripts/session.sh again, and run dc up --wait --wait-timeout 120.
Do NOT run dc down -v: the -v option deletes this project's database volume.
A named volume is persistent storage, not a backup. Do not change DB_PASS expecting existing PostgreSQL
credentials to update: the initialization variables apply when the data directory is first initialized.

## First Git checkpoint (after the HTTP evidence passes)

```bash
git init -b main
git add README.md api db scripts compose.yaml .gitignore .env.example docs evidence
git diff --cached --stat
git commit -m "Start Node and PostgreSQL platform lab"
```

.env is ignored. Do not force-add it. This creates only a LOCAL repository; no GitHub write or push has happened.
Record the supplied scaffold provenance when publishing a portfolio.

## Learning from the files

Read compose.yaml once after it runs. Find DB_HOST: db, then find the service named db.
That name is the connection between them; the API does not use your laptop's PostgreSQL port 5433.
Follow one POST request: HTTP handler -> parameterized INSERT -> PostgreSQL -> JSON row.
The API has no data volume. The database has pgdata. That is the distinction the restart test checks.

## Test scope

The included API tests use a mock database interface and exercise real local HTTP requests.
They are NOT a live PostgreSQL or Docker test. See docs/VALIDATION.md for the checks run during preparation.
Run Node tests locally with `cd api && node --test`, or use a Node container.
