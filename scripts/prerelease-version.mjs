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
