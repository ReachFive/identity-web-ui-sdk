import { describe, expect, test } from '@jest/globals';

import { buildTheme } from '../src/core/theme';
import { buildThemeVariables } from '../src/core/themeVariables';
import { colorToHSL, shadeColor } from '../src/lib/utils';

import type { ThemeOptions } from '../src/types/styled';

const build = (options: ThemeOptions = {}) => buildThemeVariables(options, buildTheme(options));

describe('buildThemeVariables', () => {
    describe('component tokens point at the palette when the option is not supplied', () => {
        test.each([
            ['--r5-button-bg', 'hsl(var(--primary))'],
            ['--r5-button-hover-bg', 'hsl(var(--primary-hover))'],
            ['--r5-button-border-color', 'hsl(var(--primary))'],
            ['--r5-button-hover-border-color', 'hsl(var(--primary))'],
            ['--r5-button-subtle-bg', 'hsl(var(--primary) / 0.08)'],
            ['--r5-button-text', 'hsl(var(--primary-foreground))'],
            ['--r5-button-hover-text', 'hsl(var(--primary-foreground))'],
            ['--r5-button-text-size', 'var(--font-size)'],
            ['--r5-button-leading', 'var(--leading)'],
            ['--r5-button-padding-x', 'var(--padding-x)'],
            ['--r5-button-padding-y', 'var(--padding-y)'],
            ['--r5-button-radius', 'var(--radius)'],
            ['--r5-button-border-width', 'var(--border-width)'],
            ['--r5-input-border-color', 'hsl(var(--border))'],
            ['--r5-input-radius', 'var(--radius)'],
            ['--r5-link-text', 'hsl(var(--primary))'],
            ['--r5-password-strength-bg-0', 'hsl(var(--destructive))'],
            ['--r5-password-strength-bg-1', 'hsl(var(--destructive))'],
            ['--r5-password-strength-bg-2', 'hsl(var(--warning))'],
            ['--r5-password-strength-bg-4', 'hsl(var(--success))'],
        ])('%s -> %s', (property, expected) => {
            expect(build()[property]).toBe(expected);
        });
    });

    describe('component tokens become literals when the option is supplied', () => {
        test('button.background', () => {
            expect(build({ button: { background: '#ff0000' } })['--r5-button-bg']).toBe('#ff0000');
        });

        test('button.borderRadius carries its unit', () => {
            expect(build({ button: { borderRadius: 8 } })['--r5-button-radius']).toBe('8px');
        });

        test('button.lineHeight is unitless', () => {
            expect(build({ button: { lineHeight: 2 } })['--r5-button-leading']).toBe('2');
        });

        test('input.borderColor', () => {
            expect(build({ input: { borderColor: '#0f0f0f' } })['--r5-input-border-color']).toBe(
                '#0f0f0f'
            );
        });

        test('link.color', () => {
            expect(build({ link: { color: '#abcdef' } })['--r5-link-text']).toBe('#abcdef');
        });

        test('the subtle background follows an overridden button background', () => {
            // 8% opacity of #ff0000 -> alpha 0x14 (20/255 ~ 0.078)
            expect(build({ button: { background: '#ff0000' } })['--r5-button-subtle-bg']).toBe(
                '#ff000014'
            );
        });

        test('passwordStrengthValidator.color0 replaces the palette pointer', () => {
            const variables = build({ passwordStrengthValidator: { color0: '#654321' } });
            expect(variables['--r5-password-strength-bg-0']).toBe('#654321');
            // the scores it does not name keep pointing at the palette
            expect(variables['--r5-password-strength-bg-1']).toBe('hsl(var(--destructive))');
        });

        test('a zero value is an override, not an absent option', () => {
            expect(build({ button: { paddingX: 0 } })['--r5-button-padding-x']).toBe('0px');
        });
    });

    describe('every pointer is rendering-neutral', () => {
        // A pointer only preserves rendering if the palette role it targets holds the same value
        // the component token used to carry literally. Nothing enforces that at runtime: the
        // defaulting rules live in `buildTheme`, so moving a default to a different palette role
        // leaves the pointer here aiming at the old one and the component silently mis-renders.
        //
        // These two tables are what lock the two modules together — one row per pointer token.
        // The options deliberately move every role off its default, so a pointer aimed at the
        // wrong role cannot pass by coincidence.
        const options: ThemeOptions = {
            primaryColor: '#3366ff',
            borderColor: '#778899',
            dangerColor: '#ff8800',
            warningColor: '#8800ff',
            successColor: '#00ccaa',
            fontSize: 18,
            lineHeight: 1.6,
            borderRadius: 9,
            borderWidth: 2,
        };
        const theme = buildTheme(options);
        const variables = build(options);

        test.each([
            ['--r5-button-bg', '--primary', theme.button.background],
            ['--r5-button-hover-bg', '--primary-hover', theme.button.hoverBackground],
            ['--r5-button-border-color', '--primary', theme.button.borderColor],
            ['--r5-button-hover-border-color', '--primary', theme.button.hoverBorderColor],
            ['--r5-button-text', '--primary-foreground', theme.button.color],
            ['--r5-button-hover-text', '--primary-foreground', theme.button.hoverColor],
            ['--r5-input-border-color', '--border', theme.input.borderColor],
            ['--r5-link-text', '--primary', theme.link.color],
            // the scale carries no value of its own until the theme names one: scores 0 and 1
            // default to `dangerColor`, which is exactly what `--destructive` holds
            ['--r5-password-strength-bg-0', '--destructive', theme.dangerColor],
            ['--r5-password-strength-bg-1', '--destructive', theme.dangerColor],
            ['--r5-password-strength-bg-2', '--warning', theme.warningColor],
            ['--r5-password-strength-bg-4', '--success', theme.successColor],
        ])('%s points at %s, which holds the resolved color', (token, role, resolved) => {
            expect(variables[token]).toBe(`hsl(var(${role}))`);
            expect(variables[role]).toBe(colorToHSL(resolved));
        });

        test.each([
            ['--r5-button-text-size', '--font-size', `${theme.button.fontSize}px`],
            ['--r5-button-leading', '--leading', `${theme.button.lineHeight}`],
            ['--r5-button-padding-x', '--padding-x', `${theme.button.paddingX}px`],
            ['--r5-button-padding-y', '--padding-y', `${theme.button.paddingY}px`],
            ['--r5-button-radius', '--radius', `${theme.button.borderRadius}px`],
            ['--r5-button-border-width', '--border-width', `${theme.button.borderWidth}px`],
            ['--r5-input-text-size', '--font-size', `${theme.input.fontSize}px`],
            ['--r5-input-leading', '--leading', `${theme.input.lineHeight}`],
            ['--r5-input-padding-x', '--padding-x', `${theme.input.paddingX}px`],
            ['--r5-input-padding-y', '--padding-y', `${theme.input.paddingY}px`],
            ['--r5-input-radius', '--radius', `${theme.input.borderRadius}px`],
            ['--r5-input-border-width', '--border-width', `${theme.input.borderWidth}px`],
        ])('%s points at %s, which holds the resolved scale', (token, role, resolved) => {
            expect(variables[token]).toBe(`var(${role})`);
            expect(variables[role]).toBe(resolved);
        });

        // Score 3 is a pointer too, but a compound one: it blends the two roles it sits between
        // instead of naming a single one, so it has no row in the table above. Naming both is
        // what keeps the middle step moving when a neighbour moves — resolving the blend in JS
        // would leave it behind on the old color.
        test('--r5-password-strength-bg-3 blends the two roles it sits between', () => {
            expect(variables['--r5-password-strength-bg-3']).toBe(
                'color-mix(in oklch, hsl(var(--warning)), hsl(var(--success)))'
            );
            expect(variables['--warning']).toBe(colorToHSL(theme.warningColor));
            expect(variables['--success']).toBe(colorToHSL(theme.successColor));
            // `oklch` is the space colorizr's `mix` interpolates in, so moving the blend from JS
            // to CSS left the rendered color unchanged
            expect(variables['--r5-password-strength-bg-3']).toContain('in oklch');
        });

        test('--primary matches the resolved button background', () => {
            const theme = buildTheme();
            const variables = build();
            expect(variables['--r5-button-bg']).toBe('hsl(var(--primary))');
            expect(variables['--primary']).toBe('145.71 63.64% 36.67%');
            expect(theme.button.background).toBe('#229955'); // same color, hex notation
        });

        test('--primary-hover matches the resolved button hover background', () => {
            const theme = buildTheme();
            expect(theme.button.hoverBackground).toBe(shadeColor('#229955'));
            // `--primary-hover` is the HSL form of that same shade.
            expect(build()['--primary-hover']).toBe('145.81 63.24% 26.67%');
        });
    });

    describe('shadow tokens stay composable with Tailwind ring utilities', () => {
        // `shadow-[shadow:var(--r5-…-shadow)]` sets `--tw-shadow`, which Tailwind renders inside the
        // same `box-shadow` list as `focus-visible:ring-1`. A bare `none` there invalidates the
        // whole declaration and takes the focus ring down with it, so "no shadow" has to be a
        // transparent shadow. @see composableShadow
        test.each(['--r5-button-shadow', '--r5-input-shadow'])('%s is never bare `none`', token => {
            expect(build()[token]).toBe('0 0 #0000');
        });

        test('an explicit shadow passes through untouched', () => {
            expect(build({ button: { boxShadow: '0 1px 2px #0003' } })['--r5-button-shadow']).toBe(
                '0 1px 2px #0003'
            );
        });
    });

    describe('tokens whose default is computed stay literal', () => {
        test('button height is arithmetic over four other tokens', () => {
            expect(build()['--r5-button-height']).toBe(`${buildTheme().button.height}px`);
        });

        test('link hover color uses link-specific math', () => {
            expect(build()['--r5-link-hover-text']).toBe(buildTheme().link.hoverColor);
        });

        test('link.hoverColor overrides that math when supplied', () => {
            expect(build({ link: { hoverColor: '#123456' } })['--r5-link-hover-text']).toBe(
                '#123456'
            );
        });

        test('input colors are fixed constants, not derived from the palette', () => {
            const variables = build({ backgroundColor: '#101010', textColor: '#202020' });
            expect(variables['--r5-input-bg']).toBe('#fff');
            expect(variables['--r5-input-text']).toBe('#495057');
        });
    });

    describe('foreground roles are contrast-derived', () => {
        // `--primary-foreground` is what `--r5-button-text` points at, so it has to resolve to the
        // same color `theme.button.color` does — for every primary color, not just the brand one.
        test.each([
            ['#229955', '0 0% 100%', 'brand green, pinned white by the design system'],
            ['#000080', '0 0% 100%', 'navy, dark'],
            ['#ffff00', '0 0% 0%', 'yellow, light'],
            ['#ffffff', '0 0% 0%', 'white, light'],
        ])('primaryColor %s -> --primary-foreground %s (%s)', (primaryColor, expected) => {
            const variables = build({ primaryColor });
            expect(variables['--primary-foreground']).toBe(expected);
            // the pointer and the resolved theme must not disagree
            expect(variables['--primary-foreground']).toBe(
                buildThemeVariables({}, buildTheme({ primaryColor }))['--primary-foreground']
            );
            expect(expected).toBe(colorToHSL(buildTheme({ primaryColor }).button.color));
        });

        test('the brand red keeps white on destructive surfaces', () => {
            // Same deliberate exception as the brand green: black would score better (5.21 vs
            // 4.03), but a red destructive button with white text is what the design system asks
            // for. Guards the default theme against a naive `pickByLightness` swap.
            expect(build()['--destructive-foreground']).toBe('0 0% 100%');
        });

        test('the success role reuses the brand exception, the warning role does not', () => {
            const variables = build();
            // the default success color *is* the brand green, pinned white like a filled button
            expect(variables['--success-foreground']).toBe('0 0% 100%');
            // white on the default amber would be 1.63:1 — no exception there, contrast decides
            expect(variables['--warning-foreground']).toBe('0 0% 0%');
        });

        test.each([
            ['warning', '#000080', '0 0% 100%', 'navy, dark'],
            ['warning', '#ffff00', '0 0% 0%', 'yellow, light'],
            ['success', '#000080', '0 0% 100%', 'navy, dark'],
            ['success', '#ffff00', '0 0% 0%', 'yellow, light'],
        ])('%sColor %s -> --%s-foreground %s (%s)', (role, color, expected) => {
            expect(build({ [`${role}Color`]: color })[`--${role}-foreground`]).toBe(expected);
        });

        test('a light danger color drops to black', () => {
            expect(build({ dangerColor: '#ffff00' })['--destructive-foreground']).toBe('0 0% 0%');
        });

        test('the destructive exception does not leak into the primary role', () => {
            // A tenant picking the brand red as their *primary* still gets the derived color.
            expect(build({ primaryColor: '#dc4e41' })['--primary-foreground']).toBe('0 0% 0%');
        });
    });

    describe('palette', () => {
        test('base colors are emitted as bare HSL triples', () => {
            expect(build({ primaryColor: '#ff0000' })['--primary']).toBe('0 100% 50%');
        });

        test('overriding primaryColor moves every pointer that targets it', () => {
            const variables = build({ primaryColor: '#ff0000' });
            expect(variables['--primary']).toBe('0 100% 50%');
            expect(variables['--r5-button-bg']).toBe('hsl(var(--primary))');
            expect(variables['--r5-link-text']).toBe('hsl(var(--primary))');
        });
    });
});
