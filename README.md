<div align="center">

<img src=".github/logo.svg" alt="RelayKit logo" width="120" height="120">

# RelayKit

**A working microservices demo with a gateway that degrades gracefully.**<br>
A gateway fans text out to three specialist services, aggregates their answers, and keeps responding when one of them goes down. A live dashboard shows every node and circuit breaker.

[![CI](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml/badge.svg)](https://github.com/obrenoalvim/relaykit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/obrenoalvim/relaykit?style=flat&logo=github&color=38bdf8)](https://github.com/obrenoalvim/relaykit/stargazers)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](#run-it)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](#project-layout)

**English** · [Português](README.pt.md)

[What it does](#what-it-does) · [Architecture](#architecture) · [Run it](#run-it) · [API](#api) · [Testing](#testing) · [FAQ](#faq)

</div>

---

A working microservices demo. A gateway relays text to three specialist
services, aggregates their answers, and degrades gracefully when one of them
goes down. A dashboard shows the pipeline live: which node is up, which
circuit breaker tripped, what each specialist returned.

## What it does

Submit a paragraph and the gateway fans the request out to three independent
services:

- **stats-service** counts words, sentences and syllables, then scores
  readability with the Flesch Reading Ease formula.
- **lang-service** detects the language from stopword frequency across
  English, Portuguese, Spanish, French and German.
- **keyword-service** ranks terms by frequency after stripping stopwords.

The gateway calls all three in parallel, waits with a timeout, retries once
on failure, and trips a circuit breaker per service after repeated failures.
If a specialist is unreachable, the response still returns with the other
two results filled in and the failed one marked unavailable. The HTTP status
reflects this: `200` when every specialist answers, `207` when one or more
did not.

## Architecture

```
frontend (3000)
   |
   v
gateway (4000)  [per-service timeout, retry, circuit breaker]
   |-- stats-service   (4001)   word/sentence counts, Flesch score
   |-- lang-service    (4002)   stopword-frequency language detection
   |-- keyword-service (4003)   term-frequency keyword ranking
```

Each specialist is a small Express app with two routes: `POST /analyze` and
`GET /health`. The gateway holds no business logic of its own; it only
routes, aggregates and protects itself from slow or dead specialists.

## Run it

You need Docker.

```bash
docker compose up --build
```

Open `http://localhost:3000`. The gateway listens on `4000`, the specialists
on `4001`-`4003`.

To see the degradation in action, stop one specialist while the stack runs:

```bash
docker compose stop lang-service
```

Submit text again. The language card reports "unavailable" while stats and
keywords keep working.

## Local development without Docker

```bash
npm install
npm run dev:gateway    # terminal 1
npm run dev:stats      # terminal 2
npm run dev:lang       # terminal 3
npm run dev:keyword    # terminal 4
npm run dev:frontend   # terminal 5
```

The frontend reads the gateway URL from `NEXT_PUBLIC_GATEWAY_URL` (defaults
to `http://localhost:4000`).

## API

**POST /analyze**

```json
{ "text": "your paragraph here" }
```

Returns:

```json
{
  "status": "complete",
  "results": {
    "stats": { "status": "ok", "data": { "words": 12, "sentences": 1, "...": "..." } },
    "language": { "status": "ok", "data": { "language": "en", "confidence": "high" } },
    "keywords": { "status": "ok", "data": { "keywords": [{ "term": "example", "count": 2 }] } }
  }
}
```

When a specialist fails, its entry becomes
`{ "status": "unavailable", "reason": "circuit_open" }` (or the underlying
error message) and the top-level `status` switches to `"degraded"`.

**GET /health**

Returns the gateway's own status plus each specialist's reachability and
circuit breaker state (`closed`, `open`, `half-open`).

## Testing

The test suite runs at three levels.

```bash
npm run test:unit          # pure logic + HTTP routes, per service, mocked network
npm run test:integration   # gateway + real specialist servers, real HTTP, no Docker
npm test                   # both of the above
```

CI adds a fourth level: it builds every Docker image, boots the full stack
with `docker compose up`, hits the real gateway over HTTP, stops
`lang-service` mid-run to confirm the `207` degradation path, then restarts
it. See `.github/workflows/ci.yml`.

Unit tests cover the circuit breaker's state machine directly (closed, open,
half-open, recovery) with an injectable clock, so the tests run in
milliseconds instead of waiting on real timers.

## Project layout

```
services/
  gateway/           API gateway: circuit breaker, retry, timeout, aggregation
  stats-service/     text statistics and Flesch readability
  lang-service/      stopword-based language detection
  keyword-service/   term-frequency keyword extraction
frontend/            Next.js dashboard with a live pipeline diagram
tests/integration/   cross-service tests against real HTTP servers
docker-compose.yml   orchestrates all five containers with healthchecks
```

## Design choices

The circuit breaker and retry logic are hand-written rather than pulled from
a library. Both are small, and writing them out makes the resilience
behavior something you can read in one file (`services/gateway/src/circuitBreaker.ts`)
rather than something you configure through a dependency's options object.

Language detection uses stopword frequency instead of a statistical model.
It only needs to distinguish five languages for a demo, and a dependency-free
heuristic is deterministic, fast to test and has no external data file to
ship.

---

## FAQ

**What does the 207 status mean?**
The gateway returns `200` when every specialist answers and `207` when one or more did not. The response still carries the results that did come back.

**Do I need Docker?**
Docker runs the full stack with `docker compose up --build`. Without Docker, run the five processes with the npm scripts under [Local development](#local-development-without-docker).

**Are the circuit breaker and retry from a library?**
No. They are hand-written, and the circuit breaker lives in one file: `services/gateway/src/circuitBreaker.ts`.

**How does it detect the language?**
By stopword frequency across English, Portuguese, Spanish, French and German. It is a dependency-free heuristic, not a statistical model.

**How do I see the degradation?**
Run `docker compose stop lang-service` while the stack is up and submit text again. The language card reports "unavailable" while stats and keywords keep working.

## More from the same author

- [**status-hub**](https://github.com/obrenoalvim/status-hub): one grid for every status page you check.
- [**echoport**](https://github.com/obrenoalvim/echoport): a real-time localhost port scanner for developers.

## Contributing

Bug or idea? Open an issue or a PR. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [changelog](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

If RelayKit helped you understand circuit breakers, a ⭐ helps other people find it.

<sub>**Topics:** microservices · api-gateway · circuit-breaker · resilience · graceful-degradation · fault-tolerance · distributed-systems · docker-compose · nextjs · typescript</sub>

</div>
