# NPM Prerelease Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically publish an iterative `-rc.N` prerelease of `@reachfive/identity-ui` to npm (dist-tag `next`, never `latest`) on every push to a `release`-labelled PR, so releases can be tested on integration/staging before the final tag.

**Architecture:** A small, unit-tested Node ESM module (`scripts/prerelease-version.mjs`) computes the next release-candidate version from the registry's published-versions list and guards against an un-bumped base version. The existing CI `test` job (release-PRs only) computes + sets that version *before* build (so the build's version banner matches) and uploads the publishable output as an artifact. A new `publish-prerelease` job downloads that artifact and runs `npm publish --tag next`, then posts a sticky PR comment. The official release workflow gains one step so a final release claims both `latest` and `next`.

**Tech Stack:** GitHub Actions, npm CLI, Node 24 (CI) / Node's built-in `node:test` runner, `gh` CLI.

## Global Constraints

Every task's requirements implicitly include these:

- **Node version in CI:** `24` (matches existing workflows and `.nvmrc`).
- **Package name:** `@reachfive/identity-ui` (exact, used verbatim in all npm commands).
- **Action pinning:** every `uses:` MUST pin to a full commit SHA with the version in a trailing comment. Approved pins:
  - `actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 #v7.0.0`
  - `actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e #v6.4.0`
  - `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a #v7.0.1`
  - `actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c #v8.0.1`
- **Semver syntax:** prerelease identifiers use a hyphen — `2.0.2-rc.1`, never `2.0.2.rc.1`.
- **Fixed prerelease keyword:** always `rc` (never alpha/beta).
- **Dist-tag rules:** a prerelease is published to `next` only and MUST NOT touch `latest`. `next` always points at the most-recently-published version (prerelease or official). An official release claims both `latest` (npm default) and `next`.
- **Prefer the npm CLI** for all registry interactions (`npm view`, `npm pkg set`, `npm publish`, `npm dist-tag`).
- **Formatting:** `scripts/**` is NOT in `.prettierignore`, so `prettier --check .` (CI) will check new script files. Always run `npm run format` on new/edited files before committing, then confirm with `npm run format:check`. (`.github/**` and `*.md` ARE prettier-ignored, so workflow/doc edits need no formatting.)
- **Release branch context:** implemented on `release/v2.0.2`. Base version in `package.json` is `2.0.2`; it is not yet published (published versions top out at `2.0.1`; `latest` = `1.43.1`).

---

## Task 1: Version-computation logic (pure functions)

Pure, side-effect-free functions for parsing the registry version list, guarding an un-bumped base version, and computing the next `rc` number. Tested with Node's built-in `node:test` runner (no jest/babel involvement — the module is plain ESM run directly by `node`).

**Files:**
- Create: `scripts/prerelease-version.mjs`
- Create: `scripts/prerelease-version.test.mjs`
- Modify: `package.json` (add a `test:scripts` script)

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces (named ESM exports, used by Task 2's CLI and by the tests):
  - `parseVersionsJson(jsonText: string): string[]`
  - `assertBaseNotPublished(baseVersion: string, publishedVersions: string[]): void` — throws `Error` when `baseVersion` is an exact member of `publishedVersions`.
  - `computeNextRcVersion(baseVersion: string, publishedVersions: string[]): string` — returns `"<baseVersion>-rc.<N>"`.

- [ ] **Step 1: Write the failing tests**

Create `scripts/prerelease-version.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    parseVersionsJson,
    assertBaseNotPublished,
    computeNextRcVersion,
} from './prerelease-version.mjs';

test('parseVersionsJson handles a JSON array', () => {
    assert.deepEqual(parseVersionsJson('["1.0.0","1.0.1"]'), ['1.0.0', '1.0.1']);
});

test('parseVersionsJson wraps a single bare string (npm one-version form)', () => {
    assert.deepEqual(parseVersionsJson('"1.0.0"'), ['1.0.0']);
});

test('parseVersionsJson returns [] for empty/blank input', () => {
    assert.deepEqual(parseVersionsJson(''), []);
    assert.deepEqual(parseVersionsJson('   '), []);
});

test('computeNextRcVersion starts at rc.1 when no rc exists for the base', () => {
    assert.equal(computeNextRcVersion('2.0.2', ['2.0.0', '2.0.1']), '2.0.2-rc.1');
});

test('computeNextRcVersion increments the highest existing rc', () => {
    assert.equal(
        computeNextRcVersion('2.0.2', ['2.0.2-rc.1', '2.0.2-rc.2']),
        '2.0.2-rc.3'
    );
});

test('computeNextRcVersion compares numerically, not lexically (rc.10 > rc.9)', () => {
    assert.equal(
        computeNextRcVersion('2.0.2', ['2.0.2-rc.9', '2.0.2-rc.10']),
        '2.0.2-rc.11'
    );
});

test('computeNextRcVersion ignores rc of other base versions', () => {
    assert.equal(
        computeNextRcVersion('2.0.2', ['2.0.1-rc.5', '1.9.9-rc.99']),
        '2.0.2-rc.1'
    );
});

test('computeNextRcVersion ignores malformed rc suffixes', () => {
    assert.equal(
        computeNextRcVersion('2.0.2', ['2.0.2-rc.abc', '2.0.2-rc.']),
        '2.0.2-rc.1'
    );
});

test('assertBaseNotPublished throws when the base version is already published', () => {
    assert.throws(
        () => assertBaseNotPublished('2.0.1', ['2.0.0', '2.0.1']),
        /already published/
    );
});

test('assertBaseNotPublished passes when the base version is unpublished', () => {
    assert.doesNotThrow(() =>
        assertBaseNotPublished('2.0.2', ['2.0.0', '2.0.1'])
    );
});
```

- [ ] **Step 2: Add the `test:scripts` npm script**

In `package.json`, add to the `scripts` block (after the existing `test:update` line):

```json
        "test:scripts": "node --test scripts/prerelease-version.test.mjs",
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run test:scripts`
Expected: FAIL — the run errors because `scripts/prerelease-version.mjs` does not exist yet (`Cannot find module`).

- [ ] **Step 4: Write the minimal implementation**

Create `scripts/prerelease-version.mjs`:

```js
/**
 * Normalise the output of `npm view <pkg> versions --json`.
 * npm prints a JSON array when multiple versions exist, a bare JSON string
 * when exactly one exists, and nothing when the package is unpublished.
 */
export function parseVersionsJson(jsonText) {
    if (!jsonText || jsonText.trim() === '') return [];
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') return [parsed];
    return [];
}

/**
 * Guard: a `<base>-rc.N` prerelease has LOWER semver precedence than `<base>`,
 * so publishing one only makes sense while `<base>` itself is unreleased.
 * Throws when the base version already exists on the registry (i.e. someone
 * opened a release PR without bumping the version first).
 */
export function assertBaseNotPublished(baseVersion, publishedVersions) {
    if (publishedVersions.includes(baseVersion)) {
        throw new Error(
            `Version ${baseVersion} is already published to npm. Bump the version ` +
                `in package.json before opening/updating a release PR (see RELEASE.md).`
        );
    }
}

/**
 * Compute the next iterative release-candidate version for `baseVersion`.
 * e.g. base "2.0.2" with existing "2.0.2-rc.1","2.0.2-rc.2" -> "2.0.2-rc.3".
 * Returns "<base>-rc.1" when no matching prerelease exists yet.
 */
export function computeNextRcVersion(baseVersion, publishedVersions) {
    const prefix = `${baseVersion}-rc.`;
    let maxN = 0;
    for (const version of publishedVersions) {
        if (!version.startsWith(prefix)) continue;
        const suffix = version.slice(prefix.length);
        if (/^\d+$/.test(suffix)) {
            const n = Number.parseInt(suffix, 10);
            if (n > maxN) maxN = n;
        }
    }
    return `${baseVersion}-rc.${maxN + 1}`;
}
```

- [ ] **Step 5: Format the new files**

Run: `npm run format`
Then: `npm run format:check`
Expected: `format:check` passes (exit 0, "All matched files use Prettier code style!").

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test:scripts`
Expected: PASS — `# tests 10`, `# pass 10`, `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add scripts/prerelease-version.mjs scripts/prerelease-version.test.mjs package.json
git commit -m "feat: add prerelease version-computation logic"
```

---

## Task 2: Version-computation CLI wrapper

Add a guarded CLI entrypoint to the same module so the workflow can call it: read the base version from `argv`, the published-versions JSON from stdin, print the next rc version to stdout, and exit non-zero (with a message on stderr) when the guard fails. The CLI block is guarded so importing the module (Task 1's tests) never executes it.

**Files:**
- Modify: `scripts/prerelease-version.mjs` (append CLI block)
- Modify: `scripts/prerelease-version.test.mjs` (append subprocess tests)

**Interfaces:**
- Consumes: `parseVersionsJson`, `assertBaseNotPublished`, `computeNextRcVersion` (from Task 1, same file).
- Produces: CLI contract — `printf '<versions-json>' | node scripts/prerelease-version.mjs <baseVersion>` prints `<baseVersion>-rc.<N>` (no trailing newline) on success; exits `1` with a stderr message when `<baseVersion>` is already published.

- [ ] **Step 1: Write the failing subprocess tests**

Append to `scripts/prerelease-version.test.mjs`:

```js
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('./prerelease-version.mjs', import.meta.url));

function runCli(baseVersion, stdin) {
    return spawnSync(process.execPath, [SCRIPT, baseVersion], {
        input: stdin,
        encoding: 'utf8',
    });
}

test('CLI prints the next rc version from a piped version list', () => {
    const result = runCli('2.0.2', '["2.0.2-rc.1"]');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '2.0.2-rc.2');
});

test('CLI treats empty stdin as no published versions -> rc.1', () => {
    const result = runCli('2.0.2', '');
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), '2.0.2-rc.1');
});

test('CLI exits 1 with a message when the base version is already published', () => {
    const result = runCli('2.0.1', '["2.0.0","2.0.1"]');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /already published/);
});

test('CLI exits 1 when no base version argument is given', () => {
    const result = runCli(undefined, '[]');
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Usage/);
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npm run test:scripts`
Expected: FAIL — the four CLI tests fail (the script currently produces no stdout and exits 0 because there is no CLI block yet).

- [ ] **Step 3: Append the CLI block to the module**

Add to the end of `scripts/prerelease-version.mjs`:

```js
// --- CLI -------------------------------------------------------------------
// Usage: npm view <pkg> versions --json | node scripts/prerelease-version.mjs <baseVersion>
// Prints "<baseVersion>-rc.<N>" to stdout. Exits 1 (message on stderr) when the
// base version is already published or when no base version is supplied.
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const isMain =
    process.argv[1] &&
    fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
    const baseVersion = process.argv[2];
    if (!baseVersion) {
        console.error(
            'Usage: <versions-json-on-stdin> | node scripts/prerelease-version.mjs <baseVersion>'
        );
        process.exit(1);
    }
    const stdin = process.stdin.isTTY ? '' : readFileSync(0, 'utf8');
    const versions = parseVersionsJson(stdin);
    try {
        assertBaseNotPublished(baseVersion, versions);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
    process.stdout.write(computeNextRcVersion(baseVersion, versions));
}
```

- [ ] **Step 4: Format**

Run: `npm run format && npm run format:check`
Expected: `format:check` passes.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test:scripts`
Expected: PASS — `# tests 14`, `# pass 14`, `# fail 0`.

- [ ] **Step 6: Smoke-test the CLI by hand**

Run: `printf '["2.0.2-rc.1","2.0.2-rc.2"]' | node scripts/prerelease-version.mjs 2.0.2; echo " (exit $?)"`
Expected: `2.0.2-rc.3 (exit 0)`

Run: `printf '["2.0.2"]' | node scripts/prerelease-version.mjs 2.0.2; echo " (exit $?)"`
Expected: stderr shows `Version 2.0.2 is already published...` and `(exit 1)`

- [ ] **Step 7: Commit**

```bash
git add scripts/prerelease-version.mjs scripts/prerelease-version.test.mjs
git commit -m "feat: add CLI wrapper for prerelease version computation"
```

---

## Task 3: CI `test` job — compute version, build, upload package artifact

Extend the existing `test` job so that, **only for `release`-labelled PRs targeting `master`**, it runs the script unit tests, computes + sets the rc version *before* build (so the version banner in the bundle matches), and uploads the publishable output as an artifact for the publish job to consume.

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `scripts/prerelease-version.mjs` CLI (Task 2).
- Produces: an artifact named `npm-package` containing `package.json` (version already set to `<base>-rc.<N>`), `README.md`, `LICENSE`, `cjs/`, `es/`, `umd/`, `types/`. Consumed by Task 4.

- [ ] **Step 1: Rewrite `.github/workflows/ci.yml`**

Replace the entire file with (note: this task adds everything except the `publish-prerelease` job, which Task 4 appends):

```yaml
name: Continuous Integration

on:
  push:
    branches:
      - main
      - master
      - develop
  pull_request:
    branches:
      - main
      - master
      - develop

jobs:
  test:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@9c091bb21b7c1c1d1991bb908d89e4e9dddfe3e0 #v7.0.0

      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e #v6.4.0
        with:
          node-version: 24
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Run linter
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: Run script unit tests
        run: npm run test:scripts

      - name: Install JUnit coverage reporter
        run: npm install --save-dev jest-junit

      - name: Run tests
        run: npm test -- --ci --reporters=default --reporters=jest-junit

      - name: Compute and set prerelease version
        if: >
          github.event_name == 'pull_request' &&
          github.event.pull_request.base.ref == 'master' &&
          contains(github.event.pull_request.labels.*.name, 'release')
        run: |
          BASE=$(node -p "require('./package.json').version")
          VERSIONS=$(npm view @reachfive/identity-ui versions --json 2>/dev/null || echo '')
          RC=$(printf '%s' "$VERSIONS" | node scripts/prerelease-version.mjs "$BASE")
          echo "Prerelease version: $RC"
          npm pkg set version="$RC"

      - name: Build
        run: npm run build

      - uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a #v7.0.1
        if: ${{ !cancelled() }}
        with:
          name: test-results
          path: jest-junit.xml
        env:
          JEST_JUNIT_OUTPUT_NAME: jest-junit.xml

      - name: Upload npm package artifact
        if: >
          github.event_name == 'pull_request' &&
          github.event.pull_request.base.ref == 'master' &&
          contains(github.event.pull_request.labels.*.name, 'release')
        uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a #v7.0.1
        with:
          name: npm-package
          retention-days: 1
          path: |
            package.json
            README.md
            LICENSE
            cjs
            es
            umd
            types
```

- [ ] **Step 2: Validate the YAML is well-formed**

Run: `npx --yes js-yaml .github/workflows/ci.yml > /dev/null && echo "YAML OK"`
Expected: `YAML OK` (any syntax error prints a parse exception and non-zero exit).

- [ ] **Step 3: Verify the gating expression is present on both release-only steps**

Run: `grep -c "contains(github.event.pull_request.labels.\*.name, 'release')" .github/workflows/ci.yml`
Expected: `2` (the compute step and the upload step).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: compute prerelease version and upload package artifact on release PRs"
```

---

## Task 4: CI `publish-prerelease` job — publish to `next` + sticky PR comment

Add a second job that runs after `test`, only for `release`-labelled PRs, downloads the `npm-package` artifact, publishes it to the `next` dist-tag, and posts/updates a single sticky PR comment with the install command.

**Files:**
- Modify: `.github/workflows/ci.yml` (append the `publish-prerelease` job)

**Interfaces:**
- Consumes: the `npm-package` artifact from Task 3; secret `NODE_AUTH_TOKEN` (npm automation token, already used by `deploy-release.yml`); built-in `secrets.GITHUB_TOKEN`.
- Produces: a published `@reachfive/identity-ui@<base>-rc.<N>` on npm tagged `next`; a sticky PR comment.

- [ ] **Step 1: Append the `publish-prerelease` job**

Add to the end of `.github/workflows/ci.yml` (as a sibling of the `test` job, under `jobs:`):

```yaml
  publish-prerelease:
    name: Publish Prerelease
    needs: test
    if: >
      github.event_name == 'pull_request' &&
      github.event.pull_request.base.ref == 'master' &&
      contains(github.event.pull_request.labels.*.name, 'release')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
      pull-requests: write
    concurrency:
      group: prerelease-${{ github.event.pull_request.number }}
      cancel-in-progress: false
    steps:
      - uses: actions/setup-node@48b55a011bda9f5d6aeb4c2d9c7362e8dae4041e #v6.4.0
        with:
          node-version: 24
          registry-url: 'https://registry.npmjs.org'

      - uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c #v8.0.1
        with:
          name: npm-package
          path: .

      - name: Publish prerelease to NPM (next tag)
        run: npm publish --tag next --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}

      - name: Comment prerelease version on PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          REPO: ${{ github.repository }}
        run: |
          VERSION=$(node -p "require('./package.json').version")
          MARKER="<!-- prerelease-publish -->"
          BODY="$MARKER
          📦 Published prerelease \`$VERSION\` to npm on dist-tag \`next\`.

          Install it with:
          \`\`\`sh
          npm install @reachfive/identity-ui@$VERSION
          \`\`\`
          This prerelease is **not** tagged \`latest\` and will not affect production consumers."
          COMMENT_ID=$(gh api "repos/$REPO/issues/$PR_NUMBER/comments" \
            --jq ".[] | select(.body | startswith(\"$MARKER\")) | .id" | head -n1)
          if [ -n "$COMMENT_ID" ]; then
            gh api --method PATCH "repos/$REPO/issues/comments/$COMMENT_ID" -f body="$BODY"
          else
            gh api --method POST "repos/$REPO/issues/$PR_NUMBER/comments" -f body="$BODY"
          fi
```

- [ ] **Step 2: Validate the YAML is well-formed**

Run: `npx --yes js-yaml .github/workflows/ci.yml > /dev/null && echo "YAML OK"`
Expected: `YAML OK`

- [ ] **Step 3: Verify the publish uses the `next` tag and never a default publish**

Run: `grep -n "npm publish" .github/workflows/ci.yml`
Expected: exactly one match, and it includes `--tag next` (confirming no prerelease is published to the default `latest` tag).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: publish prerelease to next tag and comment on release PRs"
```

---

## Task 5: Official release — also claim the `next` tag

After the official release is published (which sets `latest` by default), point `next` at it too, so the final release ends up tagged both `latest` and `next`.

**Files:**
- Modify: `.github/workflows/deploy-release.yml`

**Interfaces:**
- Consumes: the just-published `@reachfive/identity-ui@<version>`; secret `NODE_AUTH_TOKEN`.
- Produces: `next` dist-tag moved to the official release version.

- [ ] **Step 1: Add the dist-tag step**

In `.github/workflows/deploy-release.yml`, after the existing `Publish to NPM` step (currently the last step), append:

```yaml
      - name: Point next tag at the release
        run: npm dist-tag add "@reachfive/identity-ui@$(node -p "require('./package.json').version")" next
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NODE_AUTH_TOKEN }}
```

- [ ] **Step 2: Validate the YAML is well-formed**

Run: `npx --yes js-yaml .github/workflows/deploy-release.yml > /dev/null && echo "YAML OK"`
Expected: `YAML OK`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-release.yml
git commit -m "ci: tag official release with next in addition to latest"
```

---

## Task 6: Document the prerelease flow

Document the new behaviour in `RELEASE.md` so the team understands when prereleases publish and what the dist-tags mean. (`RELEASE.md` is prettier-ignored — no formatting needed.)

**Files:**
- Modify: `RELEASE.md`

- [ ] **Step 1: Add a prerelease section**

In `RELEASE.md`, insert the following after step 4 (the "Create a pull request named `Release vx.y.z`..." step) and before the current step 5:

```markdown
   > **Automatic prereleases.** As soon as the PR carries the `release` label,
   > every push publishes a release-candidate build to npm — `vx.y.z-rc.1`,
   > `vx.y.z-rc.2`, … — under the `next` dist-tag. Install a candidate with
   > `npm install @reachfive/identity-ui@<version>` (the exact version is posted
   > as a comment on the PR). Prereleases are **never** tagged `latest`, so they
   > cannot reach production consumers who track `latest`. The base version in
   > `package.json` must already be bumped (step 3) or the CI job fails: an
   > `x.y.z-rc.N` prerelease has lower precedence than an existing `x.y.z`.
```

Then add a short note about dist-tags after the final step (step 7):

```markdown
## Dist-tags

- `latest` — the current official release (what `npm install @reachfive/identity-ui` resolves to). Only ever moved by an official release.
- `next` — the most recently published version, whether an official release or a prerelease. Use it to try the newest candidate: `npm install @reachfive/identity-ui@next`.

Publishing an official release (tag push) moves **both** `latest` and `next` to it.
```

- [ ] **Step 2: Commit**

```bash
git add RELEASE.md
git commit -m "docs: document automatic prerelease publishing and dist-tags"
```

---

## Task 7: Manual integration verification

Workflow behaviour against the live npm registry and GitHub cannot be unit-tested; verify it end-to-end on the real release PR. No code changes — this is a verification checklist. Record results as you go.

**Preconditions:** Tasks 1–6 committed and pushed to `release/v2.0.2`; the PR for this branch carries the `release` label and targets `master`; the `NODE_AUTH_TOKEN` secret is configured (it already is, per `deploy-release.yml`).

- [ ] **Step 1: Confirm the base version is unpublished**

Run: `npm view @reachfive/identity-ui versions --json | grep -c '"2.0.2"' || echo 0`
Expected: `0` (so the guard will pass and rc numbering starts at 1).

- [ ] **Step 2: Trigger a run and watch CI**

Push a commit to the PR branch (or re-run CI). Then:
Run: `gh run watch $(gh run list --branch release/v2.0.2 --workflow "Continuous Integration" --limit 1 --json databaseId --jq '.[0].databaseId')`
Expected: both `Build & Test` and `Publish Prerelease` jobs succeed.

- [ ] **Step 3: Confirm the prerelease published to `next`, not `latest`**

Run: `npm view @reachfive/identity-ui dist-tags --json`
Expected: `latest` is still `1.43.1`; `next` is `2.0.2-rc.1`.

Run: `npm view @reachfive/identity-ui versions --json | tail -5`
Expected: `2.0.2-rc.1` is present.

- [ ] **Step 4: Confirm the sticky PR comment**

Run: `gh pr view --json comments --jq '.comments[].body' | grep -A2 'Published prerelease'`
Expected: a comment naming `2.0.2-rc.1` with the `npm install @reachfive/identity-ui@2.0.2-rc.1` command.

- [ ] **Step 5: Confirm iteration + comment update**

Push a second commit. After CI:
Run: `npm view @reachfive/identity-ui dist-tags.next`
Expected: `2.0.2-rc.2`.
Run: `gh pr view --json comments --jq '[.comments[].body | select(startswith("<!-- prerelease-publish -->"))] | length'`
Expected: `1` (the comment was updated in place, not duplicated).

- [ ] **Step 6: (Post-release, informational) Confirm the official release claims both tags**

After the PR is merged and the `v2.0.2` tag is pushed and `Deploy Release` completes:
Run: `npm view @reachfive/identity-ui dist-tags --json`
Expected: both `latest` and `next` equal `2.0.2`.

---

## Self-Review Notes

- **Spec coverage:** prerelease-per-push (Tasks 3–4) · iterative `rc.N` from registry (Tasks 1–2) · fixed `rc` keyword + hyphen syntax (Global Constraints, Task 1) · never `latest` / `next` = newest (Task 4 `--tag next`, Task 5) · official release claims both (Task 5) · CI-gated via `needs: test` (Task 4) · GitHub Action, SHA-pinned latest actions (Global Constraints) · npm CLI throughout · sticky PR comment (Task 4). All spec sections map to a task.
- **Deliberate spec refinements (flagged during planning):**
  1. **Guard** checks "base not already published" (from the `versions` list) rather than the spec's "base > `latest`" — the live registry (`latest`=1.43.1 while `2.0.1` is published) proves the latter is insufficient, and it needs no extra `dist-tags.latest` call.
  2. **Version is set in the `test` job before build**, not in the publish job — the build embeds the version in a banner (`rollup.config.js:31`), so setting it post-build would mismatch. Still honors the artifact-sharing decision.
  3. **Version logic is a `.mjs` module tested with `node:test`**, not jest — the repo has no babel config, so ESM JS wouldn't transform cleanly under jest; `node:test` runs it natively with zero config.
- **Placeholder scan:** none — every code/YAML block is complete and every command has an expected result.
- **Type/name consistency:** `parseVersionsJson`, `assertBaseNotPublished`, `computeNextRcVersion` used identically in Tasks 1, 2. Artifact name `npm-package` matches between Task 3 (upload) and Task 4 (download). `test:scripts` script name consistent across Tasks 1–3.
