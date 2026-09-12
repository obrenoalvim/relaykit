# TODO Improvements

### Update qs / express to fix moderate DoS/array-limit-bypass advisories
- **Category:** Dependency
- **What:** `qs` (transitive via `express`/`body-parser`) has two moderate advisories (array-limit bypass via bracket-key comma parsing, DoS via attacker-controlled `isBuffer`). `npm audit fix` alone won't resolve it without bumping `express` past the current semver range.
- **Where:** `services/gateway/package.json`, `services/*/package.json` (all use `express`)
- **Why:** Moderate severity, no non-breaking fix currently available within the declared `express` range — left out of this pass per the "only critical/high with a non-breaking fix" rule.
- **Risk:** Low-medium; requires a version bump and a re-test of all Express-based services.
- **Effort:** Low
