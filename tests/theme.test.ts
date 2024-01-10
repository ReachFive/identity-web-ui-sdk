import { describe, expect, test } from '@jest/globals';
import { lighten, darken } from 'polished';

import {
    buildTheme,
    baseInputTheme,
    primitiveTheme,
    paddingX,
    paddingY,
    height,
    _blockHeight,
    _absoluteLineHeight,
    _blockInnerHeight,
    inputBtnFocusBoxShadow
} from '../src/core/theme';

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
            const base = {
                ...primitiveTheme,
                paddingY: paddingY(primitiveTheme),
                paddingX: paddingX(primitiveTheme),
                spacing: Math.round(_blockHeight(primitiveTheme) / 4),
                _absoluteLineHeight: _absoluteLineHeight(primitiveTheme),
                _blockInnerHeight: _blockInnerHeight(primitiveTheme),
                _blockHeight: _blockHeight(primitiveTheme)
            }
            const expected = {
                ...base,
                link: {
                    color: base.primaryColor,
                    decoration: 'none',
                    hoverColor: darken(0.15, base.primaryColor),
                    hoverDecoration: 'none'
                },
                input: {
                    ...baseInputTheme,
                    fontSize: base.fontSize,
                    lineHeight: base.lineHeight,
                    paddingX: base.paddingX,
                    paddingY: base.paddingY,
                    borderRadius: base.borderRadius,
                    borderColor: base.borderColor,
                    borderWidth: base.borderWidth,
                    focusBorderColor: lighten(0.25, base.primaryColor),
                    height: height(base.fontSize, base.lineHeight, base.paddingY, base.borderWidth),
                },
                button: {
                    fontWeight: 'bold',
                    fontSize: base.fontSize,
                    lineHeight: base.lineHeight,
                    paddingX: base.paddingX,
                    paddingY: base.paddingY,
                    borderRadius: base.borderRadius,
                    borderWidth: base.borderWidth,
                    focusBoxShadow: inputBtnFocusBoxShadow,
                    height: height(base.fontSize, base.lineHeight, base.paddingY, base.borderWidth),
                },
                socialButton: {
                    inline: false,
                    textVisible: true,
                    fontWeight: 'bold',
                    fontSize: base.fontSize,
                    lineHeight: base.lineHeight,
                    paddingX: base.paddingX,
                    paddingY: base.paddingY,
                    borderRadius: base.borderRadius,
                    borderWidth: base.borderWidth,
                    focusBoxShadow: inputBtnFocusBoxShadow,
                    height: height(base.fontSize, base.lineHeight, base.paddingY, base.borderWidth)
                },
                passwordStrengthValidator: {
                    color0: base.dangerColor,
                    color1: base.dangerColor,
                    color2: base.warningColor,
                    color3: lighten(0.2, base.successColor),
                    color4: base.successColor
                }
            }
            expect(actual).toEqual(expected)
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
            const primitive = { ...primitiveTheme, fontSize: 16 }
            const base = {
                ...primitive,
                fontSize: 16,
                paddingY: paddingY(primitive),
                paddingX: paddingX(primitive),
                spacing: Math.round(_blockHeight(primitive) / 4),
                _absoluteLineHeight: _absoluteLineHeight(primitive),
                _blockInnerHeight: _blockInnerHeight(primitive),
                _blockHeight: _blockHeight(primitive)
            }
            const link = {
                color: base.primaryColor,
                decoration: 'none',
                hoverColor: darken(0.15, base.primaryColor),
                hoverDecoration: 'underline'
            }
            const input = {
                ...baseInputTheme,
                fontSize: base.fontSize,
                lineHeight: base.lineHeight,
                paddingX: base.paddingX,
                paddingY: base.paddingY,
                borderRadius: 8,
                borderColor: base.borderColor,
                borderWidth: base.borderWidth,
                focusBorderColor: lighten(0.25, base.primaryColor),
                height: height(base.fontSize, base.lineHeight, base.paddingY, base.borderWidth),
            }
            const button = {
                fontWeight: 'bold',
                fontSize: 18,
                lineHeight: base.lineHeight,
                paddingX: base.paddingX,
                paddingY: base.paddingY,
                borderRadius: 9999,
                borderWidth: base.borderWidth,
                focusBoxShadow: inputBtnFocusBoxShadow,
                height: height(18, base.lineHeight, base.paddingY, base.borderWidth),
            }
            const socialButton = {
                inline: true,
                textVisible: false,
                fontWeight: 'bold',
                fontSize: button.fontSize,
                lineHeight: button.lineHeight,
                paddingX: button.paddingX,
                paddingY: button.paddingY,
                borderRadius: button.borderRadius,
                borderWidth: button.borderWidth,
                focusBoxShadow: inputBtnFocusBoxShadow,
                height: height(button.fontSize, button.lineHeight, button.paddingY, button.borderWidth)
            }
            const expected = {
                ...base,
                link,
                input,
                button,
                socialButton,
                passwordStrengthValidator: {
                    color0: base.dangerColor,
                    color1: base.dangerColor,
                    color2: base.warningColor,
                    color3: lighten(0.2, base.successColor),
                    color4: base.successColor
                }
            }
            expect(actual).toEqual(expected)
        })

    })

})