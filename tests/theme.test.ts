import { describe, expect, test } from '@jest/globals';
import { contrast } from 'colorizr';

import {
    _absoluteLineHeight,
    _blockHeight,
    _blockInnerHeight,
    buildTheme,
    height,
    inputBtnFocusBoxShadow,
    paddingX,
    paddingY,
    primitiveTheme,
} from '../src/core/theme';
import { darkenColor, lightenColor } from '../src/lib/utils';

import type { Theme } from '../src/types/styled';

function expectValidTheme(theme: Partial<Theme>) {
    // base
    expect(theme).toHaveProperty('animateWidgetEntrance');
    expect(theme).toHaveProperty('fontSize');
    expect(theme).toHaveProperty('smallTextFontSize');
    expect(theme).toHaveProperty('lineHeight');
    expect(theme).toHaveProperty('headingColor');
    expect(theme).toHaveProperty('textColor');
    expect(theme).toHaveProperty('mutedTextColor');
    expect(theme).toHaveProperty('borderRadius');
    expect(theme).toHaveProperty('borderColor');
    expect(theme).toHaveProperty('borderWidth');
    expect(theme).toHaveProperty('backgroundColor');
    expect(theme).toHaveProperty('primaryColor');
    expect(theme).toHaveProperty('dangerColor');
    expect(theme).toHaveProperty('warningColor');
    expect(theme).toHaveProperty('successColor');
    expect(theme).toHaveProperty('maxWidth');
    expect(theme).toHaveProperty('paddingY');
    expect(theme).toHaveProperty('paddingX');
    expect(theme).toHaveProperty('spacing');
    expect(theme).toHaveProperty('_absoluteLineHeight');
    expect(theme).toHaveProperty('_blockInnerHeight');
    expect(theme).toHaveProperty('_blockHeight');
    // link
    expect(theme).toHaveProperty('link');
    expect(theme.link).toHaveProperty('color');
    expect(theme.link).toHaveProperty('decoration');
    expect(theme.link).toHaveProperty('hoverColor');
    expect(theme.link).toHaveProperty('hoverDecoration');
    // input
    expect(theme).toHaveProperty('input');
    expect(theme.input).toHaveProperty('color');
    expect(theme.input).toHaveProperty('placeholderColor');
    expect(theme.input).toHaveProperty('background');
    expect(theme.input).toHaveProperty('disabledBackground');
    expect(theme.input).toHaveProperty('boxShadow');
    expect(theme.input).toHaveProperty('focusBoxShadow');
    expect(theme.input).toHaveProperty('fontSize');
    expect(theme.input).toHaveProperty('lineHeight');
    expect(theme.input).toHaveProperty('paddingX');
    expect(theme.input).toHaveProperty('paddingY');
    expect(theme.input).toHaveProperty('borderRadius');
    expect(theme.input).toHaveProperty('borderColor');
    expect(theme.input).toHaveProperty('borderWidth');
    expect(theme.input).toHaveProperty('focusBorderColor');
    expect(theme.input).toHaveProperty('height');
    // button
    expect(theme).toHaveProperty('button');
    expect(theme.button).toHaveProperty('color');
    expect(theme.button).toHaveProperty('fontWeight');
    expect(theme.button).toHaveProperty('fontSize');
    expect(theme.button).toHaveProperty('lineHeight');
    expect(theme.button).toHaveProperty('paddingX');
    expect(theme.button).toHaveProperty('paddingY');
    expect(theme.button).toHaveProperty('background');
    expect(theme.button).toHaveProperty('borderColor');
    expect(theme.button).toHaveProperty('borderRadius');
    expect(theme.button).toHaveProperty('borderWidth');
    expect(theme.button).toHaveProperty('boxShadow');
    expect(theme.button).toHaveProperty('hoverBackground');
    expect(theme.button).toHaveProperty('hoverBorderColor');
    expect(theme.button).toHaveProperty('hoverColor');
    expect(theme.button).toHaveProperty('focusBoxShadow');
    expect(theme.button).toHaveProperty('height');
    // socialButton
    expect(theme).toHaveProperty('socialButton');
    expect(theme.socialButton).toHaveProperty('inline');
    expect(theme.socialButton).toHaveProperty('fontWeight');
    expect(theme.socialButton).toHaveProperty('fontSize');
    expect(theme.socialButton).toHaveProperty('lineHeight');
    expect(theme.socialButton).toHaveProperty('paddingX');
    expect(theme.socialButton).toHaveProperty('paddingY');
    expect(theme.socialButton).toHaveProperty('borderRadius');
    expect(theme.socialButton).toHaveProperty('borderWidth');
    expect(theme.socialButton).toHaveProperty('boxShadow');
    expect(theme.socialButton).toHaveProperty('focusBoxShadow');
    expect(theme.socialButton).toHaveProperty('height');
    // passwordStrengthValidator
    expect(theme).toHaveProperty('passwordStrengthValidator');
    expect(theme.passwordStrengthValidator).toHaveProperty('color0');
    expect(theme.passwordStrengthValidator).toHaveProperty('color1');
    expect(theme.passwordStrengthValidator).toHaveProperty('color2');
    expect(theme.passwordStrengthValidator).toHaveProperty('color3');
    expect(theme.passwordStrengthValidator).toHaveProperty('color4');
}

describe('theme', () => {
    describe('paddingY', () => {
        test('should return computed paddingY', () => {
            const actual = paddingY({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            });
            const expected = 9;
            expect(actual).toEqual(expected);
        });
    });

    describe('paddingX', () => {
        test('should return computed paddingX', () => {
            const actual = paddingX({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            });
            const expected = 12;
            expect(actual).toEqual(expected);
        });
    });

    describe('_absoluteLineHeight', () => {
        test('should return computed _absoluteLineHeight', () => {
            const actual = _absoluteLineHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
            });
            const expected = 20;
            expect(actual).toEqual(expected);
        });
    });

    describe('_blockInnerHeight', () => {
        test('should return computed _blockInnerHeight', () => {
            const actual = _blockInnerHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            });
            const expected = 38;
            expect(actual).toEqual(expected);
        });
    });

    describe('_blockHeight', () => {
        test('should return computed _blockHeight', () => {
            const actual = _blockHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            });
            const expected = 40;
            expect(actual).toEqual(expected);
        });
    });

    describe('buildTheme', () => {
        test('should return default theme values with empty override', () => {
            const actual = buildTheme();
            // base
            expect(actual).toHaveProperty('paddingX', paddingX(primitiveTheme));
            expect(actual).toHaveProperty('paddingY', paddingY(primitiveTheme));
            expect(actual).toHaveProperty('spacing', Math.round(_blockHeight(primitiveTheme) / 4));
            expect(actual).toHaveProperty(
                '_absoluteLineHeight',
                _absoluteLineHeight(primitiveTheme)
            );
            expect(actual).toHaveProperty('_blockInnerHeight', _blockInnerHeight(primitiveTheme));
            expect(actual).toHaveProperty('_blockHeight', _blockHeight(primitiveTheme));
            // link
            expect(actual).toHaveProperty('link.color', actual.primaryColor);
            expect(actual).toHaveProperty('link.hoverColor', darkenColor(actual.primaryColor, 15));
            // input
            expect(actual).toHaveProperty('input.fontSize', actual.fontSize);
            expect(actual).toHaveProperty('input.lineHeight', actual.lineHeight);
            expect(actual).toHaveProperty('input.paddingX', actual.paddingX);
            expect(actual).toHaveProperty('input.paddingY', actual.paddingY);
            expect(actual).toHaveProperty('input.borderRadius', actual.borderRadius);
            expect(actual).toHaveProperty('input.borderColor', actual.borderColor);
            expect(actual).toHaveProperty('input.borderWidth', actual.borderWidth);
            expect(actual).toHaveProperty(
                'input.focusBorderColor',
                lightenColor(actual.primaryColor, 25)
            );
            expect(actual).toHaveProperty(
                'input.height',
                height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth)
            );
            // button
            expect(actual).toHaveProperty('button.fontSize', actual.fontSize);
            expect(actual).toHaveProperty('button.lineHeight', actual.lineHeight);
            expect(actual).toHaveProperty('button.paddingX', actual.paddingX);
            expect(actual).toHaveProperty('button.paddingY', actual.paddingY);
            expect(actual).toHaveProperty('button.borderRadius', actual.borderRadius);
            expect(actual).toHaveProperty('button.borderWidth', actual.borderWidth);
            // the button is filled with the primary color by default
            expect(actual).toHaveProperty('button.background', actual.primaryColor);
            expect(actual).toHaveProperty('button.borderColor', actual.primaryColor);
            expect(actual).toHaveProperty('button.hoverBorderColor', actual.primaryColor);
            // Colors derived from the primary color are asserted as literals on purpose:
            // re-deriving them here with `shadeColor` / `pickByLightness` would pass for any
            // argument order or shift amount, and so could not catch an inverted call.
            expect(actual.primaryColor).toBe('#229955');
            expect(actual).toHaveProperty('button.hoverBackground', '#196f3e');
            // the brand primary color is the design system's documented exception: white, even
            // though the contrast-derived choice would be black. See the `describe` below.
            expect(actual).toHaveProperty('button.color', '#ffffff');
            expect(actual).toHaveProperty('button.hoverColor', '#ffffff');
            expect(actual).toHaveProperty('button.focusBoxShadow', inputBtnFocusBoxShadow);
            expect(actual).toHaveProperty(
                'button.height',
                height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth)
            );
            // social button
            expect(actual).toHaveProperty('socialButton.inline', false);
            expect(actual).toHaveProperty('socialButton.fontSize', actual.fontSize);
            expect(actual).toHaveProperty('socialButton.lineHeight', actual.lineHeight);
            expect(actual).toHaveProperty('socialButton.paddingX', actual.paddingX);
            expect(actual).toHaveProperty('socialButton.paddingY', actual.paddingY);
            expect(actual).toHaveProperty('socialButton.borderRadius', actual.borderRadius);
            expect(actual).toHaveProperty('socialButton.borderWidth', actual.borderWidth);
            // shape properties are inherited from the regular button
            expect(actual).toHaveProperty('socialButton.fontWeight', actual.button.fontWeight);
            expect(actual).toHaveProperty('socialButton.boxShadow', actual.button.boxShadow);
            expect(actual).toHaveProperty('socialButton.focusBoxShadow', inputBtnFocusBoxShadow);
            expect(actual).toHaveProperty(
                'socialButton.height',
                height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth)
            );
            // left unset by default so each provider keeps its own brand color
            expect(actual.socialButton.color).toBeUndefined();
            expect(actual.socialButton.background).toBeUndefined();
            expect(actual.socialButton.borderColor).toBeUndefined();
            expect(actual.socialButton.hoverColor).toBeUndefined();
            expect(actual.socialButton.hoverBackground).toBeUndefined();
            expect(actual.socialButton.hoverBorderColor).toBeUndefined();
            // passwordStrengthValidator
            expect(actual).toHaveProperty('passwordStrengthValidator.color0', actual.dangerColor);
            expect(actual).toHaveProperty('passwordStrengthValidator.color1', actual.dangerColor);
            expect(actual).toHaveProperty('passwordStrengthValidator.color2', actual.warningColor);
            expect(actual).toHaveProperty(
                'passwordStrengthValidator.color3',
                lightenColor(actual.successColor, 20)
            );
            expect(actual).toHaveProperty('passwordStrengthValidator.color4', actual.successColor);
        });

        test('should return default theme with overrided values', () => {
            const actual = buildTheme({
                fontSize: 16,
                link: {
                    hoverDecoration: 'underline',
                },
                input: {
                    borderRadius: 8,
                },
                button: {
                    borderRadius: 9999,
                    fontSize: 18,
                },
                socialButton: {
                    inline: true,
                },
            });
            expectValidTheme(actual);
            expect(actual).toHaveProperty('fontSize', 16);
            expect(actual).toHaveProperty(
                'input.height',
                height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth)
            );
            expect(actual).toHaveProperty('link.hoverDecoration', 'underline');
            expect(actual).toHaveProperty('input.borderRadius', 8);
            // `hoverColor` is omitted from the intermediate `link` type and re-applied at the end
            // of `buildTheme`, which is where it used to be overwritten unconditionally.
            expect(buildTheme({ link: { hoverColor: '#123456' } })).toHaveProperty(
                'link.hoverColor',
                '#123456'
            );
            expect(actual).toHaveProperty('button.borderRadius', 9999);
            expect(actual).toHaveProperty('button.fontSize', 18);
            expect(actual).toHaveProperty(
                'button.height',
                height(
                    actual.button.fontSize,
                    actual.lineHeight,
                    actual.paddingY,
                    actual.borderWidth
                )
            );
            expect(actual).toHaveProperty('socialButton.inline', true);
            // the social button inherits the overridden button font size
            expect(actual).toHaveProperty('socialButton.fontSize', 18);
            expect(actual).toHaveProperty(
                'socialButton.height',
                height(
                    actual.button.fontSize,
                    actual.lineHeight,
                    actual.paddingY,
                    actual.borderWidth
                )
            );
        });

        test('should reject an explicit height and keep the computed one', () => {
            const actual = buildTheme({
                input: {
                    // @ts-expect-error `height` is derived, so it is not part of `ThemeOptions`
                    height: 999,
                },
                button: {
                    paddingY: 12,
                    // @ts-expect-error `height` is derived, so it is not part of `ThemeOptions`
                    height: 999,
                },
                socialButton: {
                    // @ts-expect-error `height` is derived, so it is not part of `ThemeOptions`
                    height: 999,
                },
            });

            expect(actual.input.height).toBe(
                height(
                    actual.input.fontSize,
                    actual.input.lineHeight,
                    actual.input.paddingY,
                    actual.input.borderWidth
                )
            );
            expect(actual.button.height).toBe(
                height(
                    actual.button.fontSize,
                    actual.button.lineHeight,
                    12,
                    actual.button.borderWidth
                )
            );
            expect(actual.socialButton.height).toBe(
                height(
                    actual.socialButton.fontSize,
                    actual.socialButton.lineHeight,
                    actual.socialButton.paddingY,
                    actual.socialButton.borderWidth
                )
            );
        });

        test('should override social button brand colors when provided', () => {
            const actual = buildTheme({
                socialButton: {
                    color: '#ffffff',
                    background: '#123456',
                    borderColor: '#654321',
                    hoverColor: '#eeeeee',
                    hoverBackground: '#0f2a44',
                    hoverBorderColor: '#4c3319',
                },
            });
            expectValidTheme(actual);
            expect(actual).toHaveProperty('socialButton.color', '#ffffff');
            expect(actual).toHaveProperty('socialButton.background', '#123456');
            expect(actual).toHaveProperty('socialButton.borderColor', '#654321');
            expect(actual).toHaveProperty('socialButton.hoverColor', '#eeeeee');
            expect(actual).toHaveProperty('socialButton.hoverBackground', '#0f2a44');
            expect(actual).toHaveProperty('socialButton.hoverBorderColor', '#4c3319');
        });

        // Regression guard: the button text color must be picked *against* the primary color.
        // An inverted `pickByLightness` call passes every default-theme assertion (the default
        // #229955 takes the brand exception below either way) but leaves dark-primary tenants
        // with black-on-navy at 1.31:1.
        describe.each([
            ['#000080', '#ffffff', 'navy, dark'],
            ['#333333', '#ffffff', 'dark gray, dark'],
            ['#000000', '#ffffff', 'black, dark'],
            ['#ffff00', '#000000', 'yellow, light'],
            ['#ffffff', '#000000', 'white, light'],
            ['#767676', '#000000', 'just past the luminance pivot, light'],
        ])('with primaryColor %s (%s)', (primaryColor, expectedTextColor) => {
            test(`should pick ${expectedTextColor} for the button text`, () => {
                const actual = buildTheme({ primaryColor });
                expect(actual).toHaveProperty('button.background', primaryColor);
                expect(actual).toHaveProperty('button.color', expectedTextColor);
                expect(actual).toHaveProperty('button.hoverColor', expectedTextColor);
            });

            test('should keep the button text readable (WCAG AA, 4.5:1)', () => {
                const { button } = buildTheme({ primaryColor });
                expect(contrast(button.background, button.color)).toBeGreaterThanOrEqual(4.5);
            });
        });

        describe('brand primary color exception', () => {
            // The design system pins white on the brand green, which the contrast-derived choice
            // would not pick. Asserted explicitly so the exception cannot be removed by accident,
            // and so the WCAG assertion above is not quietly weakened to accommodate it.
            test('should use the design system text color, not the derived one', () => {
                const { button } = buildTheme({ primaryColor: '#229955' });

                expect(button.color).toBe('#ffffff');
                expect(button.hoverColor).toBe('#ffffff');
                // knowingly below the 4.5:1 the derived colors are held to
                expect(contrast(button.background, button.color)).toBeCloseTo(3.65, 1);
                expect(contrast(button.background, '#000000')).toBeCloseTo(5.76, 1);
            });

            test('should recognise the brand color in any notation', () => {
                for (const notation of ['#229955', '#229955'.toUpperCase(), 'rgb(34, 153, 85)']) {
                    expect(buildTheme({ primaryColor: notation }).button.color).toBe('#ffffff');
                }
            });

            test('should not leak the exception to a neighbouring color', () => {
                // one step away from the brand green, so the derived value applies again
                expect(buildTheme({ primaryColor: '#229956' }).button.color).toBe('#000000');
            });

            test('should still allow an explicit override', () => {
                const { button } = buildTheme({
                    primaryColor: '#229955',
                    button: { color: '#123456' },
                });
                expect(button.color).toBe('#123456');
            });
        });
    });
});
