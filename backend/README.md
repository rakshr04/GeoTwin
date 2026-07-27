# GeoTwin Backend v3

Actual backend code for the final GeoTwin architecture:

- NestJS + Fastify modular monolith
- PostgreSQL on port 5433
- exactly five human roles
- deterministic workflow and decision gates
- Evidence Debt rules
- append-only evidence corrections and audit events
- immutable approved plan versions
- optional AI adapters; manual workflow remains available
- no RAG, VLM, fine-tuning, PostGIS or AI-controlled approvals

## Install and run

```powershell
cd "C:\Users\nidheesh\Desktop\PROJECT FILES\GeoTwin\backend"
npm install
npm run db:up
npm run migration:run
npm run seed
npm run start:dev
```

URLs:

- API: http://localhost:4000/api/v1
- Swagger: http://localhost:4000/docs
- Health: http://localhost:4000/api/v1/health

All seeded users use `GeoTwinDemo@2026`:

- admin@geotwin.local
- state@geotwin.local
- district@geotwin.local
- technical@geotwin.local
- field@geotwin.local

## Important

Only `WorkflowService` changes case status. Plan approval occurs inside that workflow transaction. The Agentic Assistant cannot approve, close, archive, delete evidence, change roles or modify approved plans.

## Validation commands

```powershell
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

This bundle has not had dependencies installed or tests executed in this environment. Run the commands above locally and fix any reported TypeScript/package compatibility issues before treating it as demo-ready.
