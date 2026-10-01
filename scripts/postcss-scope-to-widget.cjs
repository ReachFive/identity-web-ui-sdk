/**
 * Prefixes every selector that is not already scoped to `.r5-widget`.
 *
 * Tailwind v3 emits its `--tw-*` defaults on `*, ::before, ::after` and
 * `::backdrop` whatever the `important` option. The widget CSS is injected in
 * the host page, so these unscoped rules would override the host's own
 * Tailwind variables (`--tw-translate-x`, `--tw-scale-x`, …).
 */
const SCOPE = '.r5-widget';

const isScoped = selector => selector === SCOPE || selector.startsWith(`${SCOPE} `);

const isInsideKeyframes = rule =>
    rule.parent && rule.parent.type === 'atrule' && rule.parent.name.endsWith('keyframes');

module.exports = () => ({
    postcssPlugin: 'scope-to-widget',
    Rule(rule) {
        if (isInsideKeyframes(rule) || rule.selectors.every(isScoped)) return;
        rule.selectors = rule.selectors.map(selector =>
            isScoped(selector) ? selector : `${SCOPE} ${selector}`
        );
    },
});
module.exports.postcss = true;
