import { describe, expect, test } from '@jest/globals';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import resolveConfig from 'tailwindcss/resolveConfig';

import { cn } from '../src/lib/utils';
import tailwindConfig from '../tailwind.config.cjs';

/**
 * Each theme section holding component tokens, with the utilities that read it. For each utility:
 * the only declarations it may emit (Tailwind's own `--tw-*` plumbing aside), and a stock class of
 * the same tailwind-merge group, which `cn()` must let override the token.
 */
type Section =
    | 'colors'
    | 'fontSize'
    | 'fontWeight'
    | 'lineHeight'
    | 'borderRadius'
    | 'height'
    | 'size'
    | 'padding'
    | 'borderWidth'
    | 'boxShadow'
    | 'maxWidth';

type Utility = { emits: string[]; overriddenBy: string };

const SECTIONS: Record<Section, Record<string, Utility>> = {
    colors: {
        text: { emits: ['color'], overriddenBy: 'text-black' },
        bg: { emits: ['background-color'], overriddenBy: 'bg-transparent' },
        border: { emits: ['border-color'], overriddenBy: 'border-transparent' },
    },
    fontSize: { text: { emits: ['font-size'], overriddenBy: 'text-xs' } },
    fontWeight: { font: { emits: ['font-weight'], overriddenBy: 'font-normal' } },
    lineHeight: { leading: { emits: ['line-height'], overriddenBy: 'leading-none' } },
    borderRadius: { rounded: { emits: ['border-radius'], overriddenBy: 'rounded-md' } },
    height: { h: { emits: ['height'], overriddenBy: 'h-8' } },
    size: { size: { emits: ['width', 'height'], overriddenBy: 'size-8' } },
    padding: { p: { emits: ['padding'], overriddenBy: 'p-2' } },
    borderWidth: { border: { emits: ['border-width'], overriddenBy: 'border-0' } },
    boxShadow: { shadow: { emits: ['box-shadow'], overriddenBy: 'shadow-none' } },
    maxWidth: { 'max-w': { emits: ['max-width'], overriddenBy: 'max-w-none' } },
};

/**
 * The sections whose keys are the bare component name (`rounded-button`), with the role suffix
 * their variable carries. Only a section read by a single utility prefix — in Tailwind v3 and in
 * v4's theme namespaces alike — may drop the suffix; every other key is the full variable name.
 */
const SHORT_KEY_ROLES: Partial<Record<Section, string>> = {
    borderRadius: 'radius',
    lineHeight: 'leading',
};

const theme = resolveConfig(tailwindConfig).theme as unknown as Record<
    Section,
    Record<string, unknown>
>;

/** The keys of a section that point at a `--r5-*` variable. */
const r5Keys = (section: Section): string[] =>
    Object.entries(theme[section])
        .filter(([, value]) => String(value).startsWith('var(--r5-'))
        .map(([key]) => key);

const cases = (Object.keys(SECTIONS) as Section[]).flatMap(section =>
    r5Keys(section).flatMap(key =>
        Object.entries(SECTIONS[section]).map(([utility, { emits, overriddenBy }]) => ({
            className: `${utility}-${key}`,
            emits,
            overriddenBy,
        }))
    )
);

/** The declarations Tailwind emits for `className`, without its `--tw-*` custom properties. */
async function declarationsOf(className: string): Promise<string[]> {
    const { root } = await postcss([
        tailwindcss({ ...tailwindConfig, content: [{ raw: className, extension: 'html' }] }),
    ]).process('@tailwind utilities;', { from: undefined });

    const properties = new Set<string>();
    root.walkDecls(decl => {
        if (!decl.prop.startsWith('--tw-')) properties.add(decl.prop);
    });
    return Array.from(properties).sort();
}

describe('component tokens in the Tailwind theme', () => {
    test('every section the test covers still registers tokens', () => {
        for (const section of Object.keys(SECTIONS) as Section[]) {
            expect(r5Keys(section)).not.toHaveLength(0);
        }
    });

    test('each key is the variable name without its prefix, or the bare component name', () => {
        for (const section of Object.keys(SECTIONS) as Section[]) {
            const role = SHORT_KEY_ROLES[section];
            for (const key of r5Keys(section)) {
                expect(theme[section][key]).toBe(
                    role ? `var(--r5-${key}-${role})` : `var(--r5-${key})`
                );
            }
        }
    });

    // The bug this whole scheme exists to prevent: two sections sharing a key, so one utility
    // silently emits both declarations — `text-button` setting the font size *and* the color.
    test.each(cases)('$className emits only $emits', async ({ className, emits }) => {
        expect(await declarationsOf(className)).toEqual([...emits].sort());
    });
});

describe('cn() with component tokens', () => {
    test('keeps a font size next to a text color', () => {
        expect(cn('text-button-text-size', 'text-button-text')).toBe(
            'text-button-text-size text-button-text'
        );
    });

    test('keeps a border width next to a border color', () => {
        expect(cn('border-input-border-width', 'border-input-border-color')).toBe(
            'border-input-border-width border-input-border-color'
        );
    });

    // Fails for a token missing from `extendTailwindMerge` or declared in the wrong group: `cn()`
    // then sees no conflict and keeps both classes.
    test.each(cases)('lets $overriddenBy override $className', ({ className, overriddenBy }) => {
        expect(cn(className, overriddenBy)).toBe(overriddenBy);
    });
});
