# Provenance and deliberate teaching adaptations

Cohort source:
https://github.com/Adewalealli/kubernetes-january-2026-cohort/blob/main/projects/01-containerize-multi-tier-app/README.md
Read from main at repository commit a2e6b98303580cb1d47d660e4191af3c775fe7a1.
README blob: 1c3b49208c9a9660c6fb25252c7efce9f4f59489.

The source requires a Node.js API + PostgreSQL app, container images, raw Kubernetes YAML,
Deployment/StatefulSet, Services, configuration, credentials, persistent storage, and Ingress.
Its directory contains the brief, not a complete API implementation.

This starter is newly supplied scaffold, NOT claimed to be downloaded course application code.
The cohort's items table and apple/banana/cherry seed shape are retained.
Deliberate additions/adaptations:
- Supplied Node HTTP API and tests; POST /items (an extension in the brief) is included for write/persistence evidence.
- Local Compose checkpoint before Kubernetes. Compose is not required by the course brief.
- Node 24 instead of the brief's Node 20, which the official release page now lists as EOL.
- PostgreSQL 16 instead of PostgreSQL 15. This creates a NEW local lab database, not an upgrade of any existing database.
- /health checks the API process; /ready checks database access and table availability.
- Explicit localhost binding on host port 18080; no published database port.
- The initial database account is a lab superuser created by POSTGRES_USER, not a production least-privilege account.
  Before public deployment, introduce a separate restricted application role and address authentication/TLS.
- Image major tags are chosen for this first local step; pin digests before the reproducible CI/registry milestone.
- Generate and commit package-lock.json locally before building; use npm ci in the Dockerfile.

Official references consulted:
https://nodejs.org/en/about/previous-releases
https://docs.docker.com/build/building/multi-stage/
https://docs.docker.com/compose/how-tos/project-name/
https://docs.docker.com/compose/how-tos/startup-order/
https://docs.docker.com/reference/cli/docker/compose/
https://docs.docker.com/reference/cli/docker/compose/up/
https://node-postgres.com/features/queries

Portfolio attribution: describe the application as supplied starter code based on the cohort brief.
Claim only the infrastructure changes, operation, diagnoses, and explanations you actually perform.
