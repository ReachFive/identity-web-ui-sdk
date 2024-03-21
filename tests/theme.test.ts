import { describe, expect, test } from '@jest/globals';
import { lighten, darken } from 'polished';

import {
    buildTheme,
    primitiveTheme,
    paddingX,
    paddingY,
    height,
    _blockHeight,
    _absoluteLineHeight,
    _blockInnerHeight,
    inputBtnFocusBoxShadow
} from '../src/core/theme';
import type { Theme } from '../src/types/styled'

function expectValidTheme(theme: Partial<Theme>) {
    // base
    expect(theme).toHaveProperty('animateWidgetEntrance')
    expect(theme).toHaveProperty('fontSize')
    expect(theme).toHaveProperty('smallTextFontSize')
    expect(theme).toHaveProperty('lineHeight')
    expect(theme).toHaveProperty('headingColor')
    expect(theme).toHaveProperty('textColor')
    expect(theme).toHaveProperty('mutedTextColor')
    expect(theme).toHaveProperty('borderRadius')
    expect(theme).toHaveProperty('borderColor')
    expect(theme).toHaveProperty('borderWidth')
    expect(theme).toHaveProperty('backgroundColor')
    expect(theme).toHaveProperty('primaryColor')
    expect(theme).toHaveProperty('dangerColor')
    expect(theme).toHaveProperty('warningColor')
    expect(theme).toHaveProperty('successColor')
    expect(theme).toHaveProperty('lightBackgroundColor')
    expect(theme).toHaveProperty('maxWidth')
    expect(theme).toHaveProperty('paddingY')
    expect(theme).toHaveProperty('paddingX')
    expect(theme).toHaveProperty('spacing')
    expect(theme).toHaveProperty('_absoluteLineHeight')
    expect(theme).toHaveProperty('_blockInnerHeight')
    expect(theme).toHaveProperty('_blockHeight')
    // link
    expect(theme).toHaveProperty('link')
    expect(theme.link).toHaveProperty('color')
    expect(theme.link).toHaveProperty('decoration')
    expect(theme.link).toHaveProperty('hoverColor')
    expect(theme.link).toHaveProperty('hoverDecoration')
    // input
    expect(theme).toHaveProperty('input')
    expect(theme.input).toHaveProperty('color')
    expect(theme.input).toHaveProperty('placeholderColor')
    expect(theme.input).toHaveProperty('background')
    expect(theme.input).toHaveProperty('disabledBackground')
    expect(theme.input).toHaveProperty('boxShadow')
    expect(theme.input).toHaveProperty('focusBoxShadow')
    expect(theme.input).toHaveProperty('fontSize')
    expect(theme.input).toHaveProperty('lineHeight')
    expect(theme.input).toHaveProperty('paddingX')
    expect(theme.input).toHaveProperty('paddingY')
    expect(theme.input).toHaveProperty('borderRadius')
    expect(theme.input).toHaveProperty('borderColor')
    expect(theme.input).toHaveProperty('borderWidth')
    expect(theme.input).toHaveProperty('focusBorderColor')
    expect(theme.input).toHaveProperty('height')
    // button
    expect(theme).toHaveProperty('button')
    expect(theme.button).toHaveProperty('fontWeight')
    expect(theme.button).toHaveProperty('fontSize')
    expect(theme.button).toHaveProperty('lineHeight')
    expect(theme.button).toHaveProperty('paddingX')
    expect(theme.button).toHaveProperty('paddingY')
    expect(theme.button).toHaveProperty('borderRadius')
    expect(theme.button).toHaveProperty('borderWidth')
    expect(theme.button).toHaveProperty('focusBoxShadow')
    expect(theme.button).toHaveProperty('height')
    // socialButton
    expect(theme).toHaveProperty('socialButton')
    expect(theme.socialButton).toHaveProperty('inline')
    expect(theme.socialButton).toHaveProperty('textVisible')
    expect(theme.socialButton).toHaveProperty('fontWeight')
    expect(theme.socialButton).toHaveProperty('fontSize')
    expect(theme.socialButton).toHaveProperty('lineHeight')
    expect(theme.socialButton).toHaveProperty('paddingX')
    expect(theme.socialButton).toHaveProperty('paddingY')
    expect(theme.socialButton).toHaveProperty('borderRadius')
    expect(theme.socialButton).toHaveProperty('borderWidth')
    expect(theme.socialButton).toHaveProperty('focusBoxShadow')
    expect(theme.socialButton).toHaveProperty('height')
    // passwordStrengthValidator
    expect(theme).toHaveProperty('passwordStrengthValidator')
    expect(theme.passwordStrengthValidator).toHaveProperty('color0')
    expect(theme.passwordStrengthValidator).toHaveProperty('color1')
    expect(theme.passwordStrengthValidator).toHaveProperty('color2')
    expect(theme.passwordStrengthValidator).toHaveProperty('color3')
    expect(theme.passwordStrengthValidator).toHaveProperty('color4')
}

describe('theme', () => {

    describe('paddingY', () => {
        test('should return computed paddingY', () => {
            const actual = paddingY({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            })
            const expected = 9
            expect(actual).toEqual(expected)
        })
    })

    describe('paddingX', () => {
        test('should return computed paddingX', () => {
            const actual = paddingX({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            })
            const expected = 12
            expect(actual).toEqual(expected)
        })
    })

    describe('_absoluteLineHeight', () => {
        test('should return computed _absoluteLineHeight', () => {
            const actual = _absoluteLineHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
            })
            const expected = 20
            expect(actual).toEqual(expected)
        })
    })

    describe('_blockInnerHeight', () => {
        test('should return computed _blockInnerHeight', () => {
            const actual = _blockInnerHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            })
            const expected = 38
            expect(actual).toEqual(expected)
        })
    })

    describe('_blockHeight', () => {
        test('should return computed _blockHeight', () => {
            const actual = _blockHeight({
                fontSize: 14,
                lineHeight: 1.428571429,
                borderWidth: 1,
            })
            const expected = 40
            expect(actual).toEqual(expected)
        })
    })

    describe('buildTheme', () => {

        test('should return default theme values with empty override', () => {
            const actual = buildTheme()
            // base
            expect(actual).toHaveProperty('paddingX', paddingX(primitiveTheme))
            expect(actual).toHaveProperty('paddingY', paddingY(primitiveTheme))
            expect(actual).toHaveProperty('spacing', Math.round(_blockHeight(primitiveTheme) / 4))
            expect(actual).toHaveProperty('_absoluteLineHeight', _absoluteLineHeight(primitiveTheme))
            expect(actual).toHaveProperty('_blockInnerHeight', _blockInnerHeight(primitiveTheme))
            expect(actual).toHaveProperty('_blockHeight', _blockHeight(primitiveTheme))
            // link
            expect(actual).toHaveProperty('link.color', actual.primaryColor)
            expect(actual).toHaveProperty('link.hoverColor', darken(0.15, actual.primaryColor))
            // input
            expect(actual).toHaveProperty('input.fontSize', actual.fontSize)
            expect(actual).toHaveProperty('input.lineHeight', actual.lineHeight)
            expect(actual).toHaveProperty('input.paddingX', actual.paddingX)
            expect(actual).toHaveProperty('input.paddingY', actual.paddingY)
            expect(actual).toHaveProperty('input.borderRadius', actual.borderRadius)
            expect(actual).toHaveProperty('input.borderColor', actual.borderColor)
            expect(actual).toHaveProperty('input.borderWidth', actual.borderWidth)
            expect(actual).toHaveProperty('input.focusBorderColor', lighten(0.25, actual.primaryColor))
            expect(actual).toHaveProperty('input.height', height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth))
            // button
            expect(actual).toHaveProperty('button.fontSize', actual.fontSize)
            expect(actual).toHaveProperty('button.lineHeight', actual.lineHeight)
            expect(actual).toHaveProperty('button.paddingX', actual.paddingX)
            expect(actual).toHaveProperty('button.paddingY', actual.paddingY)
            expect(actual).toHaveProperty('button.borderRadius', actual.borderRadius)
            expect(actual).toHaveProperty('button.borderColor', actual.borderColor)
            expect(actual).toHaveProperty('button.focusBoxShadow', inputBtnFocusBoxShadow)
            expect(actual).toHaveProperty('button.height', height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth))
            // social button
            expect(actual).toHaveProperty('socialButton.fontSize', actual.fontSize)
            expect(actual).toHaveProperty('socialButton.lineHeight', actual.lineHeight)
            expect(actual).toHaveProperty('socialButton.paddingX', actual.paddingX)
            expect(actual).toHaveProperty('socialButton.paddingY', actual.paddingY)
            expect(actual).toHaveProperty('socialButton.borderColor', actual.borderColor)
            expect(actual).toHaveProperty('socialButton.borderRadius', actual.borderRadius)
            expect(actual).toHaveProperty('socialButton.focusBoxShadow', inputBtnFocusBoxShadow)
            expect(actual).toHaveProperty('socialButton.height', height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth))
            // passwordStrengthValidator
            expect(actual).toHaveProperty('passwordStrengthValidator.color0', actual.dangerColor)
            expect(actual).toHaveProperty('passwordStrengthValidator.color1', actual.dangerColor)
            expect(actual).toHaveProperty('passwordStrengthValidator.color2', actual.warningColor)
            expect(actual).toHaveProperty('passwordStrengthValidator.color3', lighten(0.2, actual.successColor))
            expect(actual).toHaveProperty('passwordStrengthValidator.color4', actual.successColor)
        })

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
                }
            })
            expectValidTheme(actual)
            expect(actual).toHaveProperty('fontSize', 16)
            expect(actual).toHaveProperty('input.height', height(actual.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth))
            expect(actual).toHaveProperty('link.hoverDecoration', 'underline')
            expect(actual).toHaveProperty('input.borderRadius', 8)
            expect(actual).toHaveProperty('button.borderRadius', 9999)
            expect(actual).toHaveProperty('button.fontSize', 18)
            expect(actual).toHaveProperty('button.height', height(actual.button.fontSize, actual.lineHeight, actual.paddingY, actual.borderWidth))
            expect(actual).toHaveProperty('socialButton.inline', true)
        })

    })

})