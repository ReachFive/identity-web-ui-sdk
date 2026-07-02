# NPM Prerelease Publishing — Design

## Problem

The release workflow (`RELEASE.md`) has no way to get a candidate build onto the npm registry before the final release is merged and tagged. Testing a release on integration/staging environments today means either publishing early as `latest` (unacceptable — it would ship to production consumers) or manually packing/installing a tarball. We need an automatic, semver-correct prerelease published to npm for every `release`-labeled PR, updated on every push, without ever touching the `latest` dist-tag.

## Semver Corrections to the Original Request

Two points in the original ask don't match the semver spec (https://semver.org/) and are corrected here:

1. **Syntax**: prerelease identifiers are separated from the core version by a hyphen, not a dot — `2.0.2-rc.1`, not `2.0.2.rc.1`.
2. **Stability keyword semantics**: semver defines *precedence* between prerelease identifiers (`alpha` < `beta` < `rc` < release, by ASCII/numeric comparison) but does not define what they *mean*, and has no concept of "type of release" (major/minor/patch) determining which keyword to use. That mapping is a team convention, not a semver rule. Per discussion, this project uses a single fixed keyword — `rc` — for every prerelease published from a release PR, since a build from an open release PR is by definition a release candidate for the version about to ship. This sidesteps the undefined mapping entirely.

## Dist-Tag Rules

| Event | `latest` | `next` |
|---|---|---|
| Prerelease published from a release PR (e.g. `2.0.2-rc.1`) | untouched | moved to this version |
| Official release published (tag push, e.g. `2.0.2`) | moved to this version | moved to this version |

`next` always points at whatever was published most recently — prerelease or official — satisfying "the very last version published should be tagged `next`". `latest` only ever moves on an official release. This is a single global pointer per package (not scoped per PR): if two release PRs were ever open concurrently, whichever publishes last wins `next`. That's inherent to npm dist-tags and acceptable given this project runs one release branch at a time.

## Architecture

Two workflow files change:

### `.github/workflows/ci.yml` — new `publish-prerelease` job

Runs after the existing `test` job, in the same workflow run, gated so it only executes for release PRs:

```yaml
if: >
  github.event_name == 'pull_request' &&
  github.event.pull_request.base.ref == 'master' &&
  contains(github.event.pull_request.labels.*.name, 'release')
needs: test
```

No new trigger types are needed on the `pull_request` trigger — `RELEASE.md` already has the `release` label applied at PR creation time, so the existing `opened`/`synchronize`/`reopened` events cover both "PR created" and "PR updated".

**Build sharing**: the `test` job uploads its build output as an artifact (`package.json`, `cjs/`, `es/`, `umd/`, `types/`, `README.md`, `LICENSE` — the exact set npm would publish by default) with 1-day retention. `publish-prerelease` downloads it directly rather than re-running `npm install && npm run build`, since each GitHub Actions job runs on an isolated runner and doesn't otherwise share filesystem state with `needs` jobs.

**Steps in `publish-prerelease`**:
1. `actions/download-artifact` — pull the build output.
2. `actions/setup-node` — Node 24, registry-url set to the npm registry (no `npm install` needed; only `npm` CLI itself is required for the remaining steps).
3. **Version-bump guard**: `npm view @reachfive/identity-ui dist-tags.latest`, compare against the base version in the downloaded `package.json`. Fail with a clear message if the base version isn't strictly greater than the currently published `latest` (catches the case where the `release` label was added before the version was bumped per `RELEASE.md` step 3).
4. **Compute prerelease version**: `npm view @reachfive/identity-ui versions --json`, find the highest existing `<base>-rc.N` for this base version, publish `N+1` (or `1` if none exist). Querying the registry (rather than e.g. `github.run_number`) keeps the sequence correct even across retries or failed runs.
5. `npm pkg set version=<base>-rc.<N>` — set the computed version directly on the downloaded `package.json` (not `npm version`, since that assumes a `package-lock.json` we didn't upload, and we don't want any git tagging behavior).
6. `npm publish --tag next --provenance --access public` — publishing directly to the `next` tag (never the default `latest`) satisfies both dist-tag rules in one step.
7. **Sticky PR comment**: post or update (via a marker comment, matched and edited with `gh api`/`gh pr comment`) a single comment on the PR announcing the published version and install command, e.g. `npm install @reachfive/identity-ui@2.0.2-rc.3`. Updated in place on each new prerelease, not duplicated.

**Concurrency**: a job-level `concurrency` group scoped to the PR number (`prerelease-<PR#>`, `cancel-in-progress: false`) queues overlapping runs (e.g. two rapid pushes) instead of racing on the same rc number.

**Permissions**: `contents: read`, `id-token: write` (provenance, same as `deploy-release.yml`), `pull-requests: write` (PR comment).

### `.github/workflows/deploy-release.yml` — one new step

After the existing `npm publish --provenance --access public` (which sets `latest` by default), add:

```sh
npm dist-tag add @reachfive/identity-ui@<version> next
```

reading `<version>` from `package.json`. This ensures the final official release also claims `next`, so a release always ends with both `latest` and `next` pointing at it.

### New actions introduced (pinned per project convention)

- `actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c` (v8.0.1)
- Reuses existing `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (v7.0.1), already pinned in `ci.yml`.

## Error Handling & Edge Cases

- **Version not yet bumped**: guarded explicitly (step 3 above) — job fails loudly rather than publishing a prerelease with lower precedence than an already-published release.
- **Concurrent pushes**: queued via the concurrency group, not raced.
- **Duplicate version publish** (residual race): `npm publish` rejects re-publishing an existing version outright; the job fails visibly and the next push/retry recomputes a fresh number from the registry. No manual cleanup required.
- **PR closed/abandoned without merging**: no cleanup step exists or is needed — published prereleases remain on npm (consistent with npm's unpublish restrictions), and `next` simply gets overwritten by whatever is published after it.
- **`next` as a global (not per-PR) pointer**: documented above as expected behavior, not a defect.

## Testing Plan

This is CI/CD infrastructure with no unit-testable business logic; verification is manual/integration:

1. Lint the workflow YAML (`actionlint` if available).
2. Open a throwaway PR against `master` with the `release` label and an unpublished patch version bump. Confirm: CI runs → artifact uploads → prerelease publishes to npm tagged `next` (not `latest`) → PR comment appears with the correct install command.
3. Push a second commit to the same PR. Confirm the rc number increments (`.1` → `.2`) and the PR comment updates in place.
4. Open a `release`-labeled PR *without* bumping the version. Confirm the job fails on the version-bump guard rather than publishing.
5. Complete a real release afterward and confirm `deploy-release.yml` sets both `latest` and `next` on the final tag.

## Out of Scope

- Automatic cleanup/unpublishing of prerelease versions after a PR closes.
- A persistent `rc` dist-tag for "always install the latest candidate" (not requested; `next` already serves this for the very latest prerelease).
- Deriving the stability keyword (alpha/beta/rc) from release type — explicitly rejected in favor of a single fixed `rc` keyword.
