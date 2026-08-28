import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

import { colorToHSL, pickByLightness, shadeColor } from '@/lib/utils';

// Values CSS accepts but colorizr cannot parse, plus outright invalid input. Each of these used
// to throw out of the helpers and take the whole widget down on render.
const UNPARSEABLE = ['transparent', 'currentColor', 'inherit', 'var(--brand)', '', 'notacolor'];

describe('unparseable colors', () => {
    beforeEach(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('colorToHSL returns the value unchanged instead of throwing', () => {
        for (const color of UNPARSEABLE) {
            expect(() => colorToHSL(color)).not.toThrow();
            expect(colorToHSL(color)).toBe(color);
        }
    });

    test('shadeColor returns the value unchanged instead of throwing', () => {
        for (const color of UNPARSEABLE) {
            expect(() => shadeColor(color)).not.toThrow();
            expect(shadeColor(color)).toBe(color);
        }
    });

    test('pickByLightness falls back to the dark-background value instead of throwing', () => {
        for (const color of UNPARSEABLE) {
            expect(() => pickByLightness(color, 'onDark', 'onLight')).not.toThrow();
            expect(pickByLightness(color, 'onDark', 'onLight')).toBe('onDark');
        }
    });

    test('reports each unsupported value once, not on every call', () => {
        const spy = jest.spyOn(console, 'error');
        // a distinct value per run, so the warn-once cache is not already primed by a sibling test
        const color = 'definitely-not-a-color-in-any-other-test';

        colorToHSL(color);
        colorToHSL(color);
        shadeColor(color);

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy.mock.calls[0]?.[0]).toContain(color);
    });
});

describe('shadeColor', () => {
    test('darkens a color', () => {
        expect(shadeColor('#3b5998')).toBe('#2d4373');
        expect(shadeColor('#229955')).toBe('#196f3e');
    });

    test('lightens a color that is already too dark to darken visibly', () => {
        // darkening would clamp to black, so the shift goes the other way
        expect(shadeColor('#000000')).toBe('#1a1a1a');
    });

    test('respects a custom shift amount', () => {
        expect(shadeColor('#3b5998', 20)).toBe('#1e2e4f');
    });

    test('keeps darkening a mid-tone color however large the shift', () => {
        // the direction pivot is fixed, not derived from the amount: a mid-gray must not be
        // *lightened* just because a large shift was asked for
        expect(shadeColor('#808080', 40)).toBe('#1a1a1a');
    });

    test('accepts any CSS color notation', () => {
        expect(shadeColor('rgb(59, 89, 152)')).toBe('#2d4373');
        expect(shadeColor('hsl(220.65, 44.08%, 41.37%)')).toBe('#2d4373');
        expect(shadeColor('white')).toBe('#e6e6e6');
    });

    test('preserves the alpha channel', () => {
        // a 15%-opacity hairline border must not shade into a solid rule
        expect(shadeColor('rgba(0, 0, 0, 0.15)')).toBe('#1a1a1a26');
        expect(shadeColor('#00000026')).toBe('#1a1a1a26');
        expect(shadeColor('hsla(220.65, 44.08%, 41.37%, 0.5)')).toBe('#2d437380');
    });

    test('returns a 6-digit hex for fully opaque colors', () => {
        expect(shadeColor('rgba(59, 89, 152, 1)')).toBe('#2d4373');
        expect(shadeColor('#3b5998ff')).toBe('#2d4373');
    });
});

describe('pickByLightness', () => {
    const WHITE = '#ffffff';
    const BLACK = '#000000';

    test('returns the dark-background value for a dark color', () => {
        expect(pickByLightness(BLACK, WHITE, BLACK)).toBe(WHITE);
        expect(pickByLightness('#1a1a2e', WHITE, BLACK)).toBe(WHITE);
        expect(pickByLightness('rgb(20, 20, 20)', WHITE, BLACK)).toBe(WHITE);
    });

    test('returns the light-background value for a light color', () => {
        expect(pickByLightness(WHITE, WHITE, BLACK)).toBe(BLACK);
        expect(pickByLightness('#f5f5f5', WHITE, BLACK)).toBe(BLACK);
        expect(pickByLightness('hsl(0, 0%, 80%)', WHITE, BLACK)).toBe(BLACK);
    });

    test('treats perceptually dark colors with high HSL lightness as dark', () => {
        // pure blue has an HSL lightness of 50% but a relative luminance of ~0.07
        expect(pickByLightness('#0000ff', WHITE, BLACK)).toBe(WHITE);
    });

    test('accepts named colors', () => {
        expect(pickByLightness('black', WHITE, BLACK)).toBe(WHITE);
        expect(pickByLightness('yellow', WHITE, BLACK)).toBe(BLACK);
    });

    test('switches at the WCAG luminance pivot', () => {
        // the pivot is 0.179 relative luminance, and the comparison is exclusive
        expect(pickByLightness('#757575', WHITE, BLACK)).toBe(WHITE); // luminance 0.1779
        expect(pickByLightness('#767676', WHITE, BLACK)).toBe(BLACK); // luminance 0.1812
    });

    test('is not restricted to colors', () => {
        expect(pickByLightness(BLACK, 'text-white', 'text-black')).toBe('text-white');
        expect(pickByLightness(WHITE, 'text-white', 'text-black')).toBe('text-black');
    });
});
