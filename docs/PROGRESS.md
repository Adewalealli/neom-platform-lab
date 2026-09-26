# Training checkpoint — October 30 assessment target

## Prior evidence from the current training conversation

- Demonstrated a ReplicaSet replacing a deleted nginx drill Pod.
- Created a bad-image Deployment rollout and diagnosed ImagePullBackOff using events.
- Rolled back and verified that the original ReplicaSet was reused.
- Created drill-svc and verified matching EndpointSlice addresses.
- HTTP traffic through that Service and the broken-selector exercise are NOT yet evidenced.

## Current project

Project 1: Containerize & Deploy a Multi-Tier App, using the cohort brief.
This archive supplies the API source and a local Compose checkpoint; it is not a completed portfolio.

First checkpoint: build two images, start the API and database, create a database row through HTTP,
then read it after restarting only the API. Mark complete only after actual command output confirms it.

Next checkpoint: use these images in a dedicated project-01 Kubernetes namespace, with raw manifests,
ConfigMap, Secret, API Deployment, database StatefulSet, Services, PVC, and separate health/readiness probes.
Use explicit --context kind-neom-k8s and -n project-01. Do not reuse default/drill for this project.

## Connected build path

1. Working application and database, images, configuration, network, persisted data.
2. Same application on Kubernetes; prove HTTP read/write, API Pod replacement, PVC data retention.
3. Registry + CI, then Helm + Argo CD; each addition must serve this application.
4. Metrics/logs, a meaningful alert, backup/restore, and a written failure report.
5. Terraform infrastructure slice and, when the base is stable, a sanitized FAI Atlas capstone.

Apply for suitable roles using demonstrated evidence, not inflated seniority or uncompleted milestones.
October 30 is an assessment checkpoint, not a guarantee of employment or a reason to postpone applying.

## Teaching rules

One useful change -> run it -> inspect its effect -> explain the relevant mechanism.
No long quiz gates. No unrelated tooling detours. No production data, secrets, payments, or FAI Atlas changes.
At the end of each session record: changed files, observed result, skill still needing practice, next exact step.
