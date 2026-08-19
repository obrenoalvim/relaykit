# Contributing

## Setup

```bash
npm install
```

## Before you open a PR

```bash
npm run typecheck
npm run lint
npm test
```

`npm test` runs unit tests for every service and the cross-service
integration suite. If you touched Docker files or the resilience behavior,
also run the full stack once:

```bash
docker compose up --build
```

## Project conventions

- TypeScript everywhere, strict mode on.
- Each service owns its dependencies in its own `package.json`. Do not rely
  on hoisting from the root; the Docker build for each service installs in
  isolation.
- Pure logic lives in its own module, separate from the Express routes, so it
  can be unit tested without spinning up an HTTP server.
- New network calls need a timeout and, if they cross a service boundary
  inside the gateway, a circuit breaker.

## Commit messages

Short, in the imperative mood, explaining why over what when the why is not
obvious from the diff.
