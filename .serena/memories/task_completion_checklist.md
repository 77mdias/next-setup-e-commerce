# Task Completion Checklist
Before considering work done, run the local pipeline parity commands when relevant:
- `npm run prisma:generate`
- `npm run prisma:validate` (required if schema changed)
- `npm run typecheck`
- `npm run lint`
- `npm run format:check`
- `npm run build`
- `npm run test:unit:critical`
- `npm run test:integration:critical`
- `npm run test:e2e:critical:ci` when critical checkout/auth/webhook flows are affected

Additional completion rules:
- If Prisma schema changed, commit the migration directory under `prisma/migrations/`.
- If auth/security changed, verify neutral error messaging, deterministic token invalidation, and redacted logging.
- Update docs/tasks when behavior, architecture, schema, or env contracts change.
- Do not open PRs without reproducing the important CI gates locally.