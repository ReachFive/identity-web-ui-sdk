import CSS from 'csstype'
import { lighten, transparentize, darken } from 'polished';
    
import { Theme, ThemeOptions, BaseTheme } from '../types/styled'

/* eslint-disable @typescript-eslint/no-unused-vars */
const white = '#fff';
// const gray100 = '#f8f9fa';
const gray200 = '#e9ecef';
// const gray300 = '#dee2e6';
const gray400 = '#ced4da';
const gray500 = '#adb5bd';
const gray600 = '#868e96';
const gray700 = '#495057';
// const gray800 = '#343a40';
const gray900 = '#212529';
// const black = '#000';
/* eslint-enable @typescript-eslint/no-unused-vars */

type PrimitiveTheme = Omit<BaseTheme, 'paddingX' | 'paddingY' | 'spacing' | '_absoluteLineHeight' | '_blockInnerHeight' | '_blockHeight'>

export const primitiveTheme: PrimitiveTheme = {
    animateWidgetEntrance: true,
    fontSize: 14,
    smallTextFontSize: 12,
    lineHeight: 1.428571429,
    headingColor: gray900,
    textColor: gray700,
    mutedTextColor: gray500,
    borderRadius: 3,
    borderColor: gray400,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    primaryColor: '#229955',
    dangerColor: '#dc4e41',
    warningColor: '#ffc107',
    successColor: '#229955',
    lightBackgroundColor: gray200,
    maxWidth: 400,
}

export const paddingY = (theme: Pick<PrimitiveTheme, 'fontSize' | 'lineHeight' | 'borderWidth'>) => 
    Math.round(theme.fontSize * theme.lineHeight) / 2 - theme.borderWidth

    export const paddingX = (theme: Parameters<typeof paddingY>[0]) => 
    Math.round(paddingY(theme) * 4 / 3)

export const _absoluteLineHeight = (theme: Pick<PrimitiveTheme, 'fontSize' | 'lineHeight'>) =>
    Math.round(theme.fontSize * theme.lineHeight)

export const _blockInnerHeight = (theme: Parameters<typeof _absoluteLineHeight>[0] & Parameters<typeof paddingY>[0]) =>
    _absoluteLineHeight(theme) + 2 * paddingY(theme)

export const _blockHeight = (theme: Parameters<typeof _blockInnerHeight>[0] & Pick<PrimitiveTheme, 'borderWidth'>) =>
    _blockInnerHeight(theme) + 2 * theme.borderWidth

export const inputBtnFocusBoxShadow = (borderColor?: string) =>
    borderColor ? `0 0 0 3px ${transparentize(0.5, borderColor)}` : undefined;

export const height = (fontSize: number, lineHeight: number, paddingY: number, borderWidth: number) =>
    Math.round(fontSize * lineHeight) + 2 * paddingY + 2 * borderWidth

export const baseInputTheme = {
    color: gray700,
    placeholderColor: gray600,
    background: white,
    disabledBackground: gray200,
    boxShadow: 'none',
    focusBoxShadow: inputBtnFocusBoxShadow,
}

export const buildTheme = (themeOptions: ThemeOptions = {}): Theme => {
    const {
        link: customLink,
        input: customInput,
        button: customButton,
        socialButton: customSocialButton,
        ...customBase
    } = themeOptions
    const primitive = { ...primitiveTheme, ...customBase }
    const base = {
        paddingY: paddingY(primitive),
        paddingX: paddingX(primitive),
        spacing: Math.round(_blockHeight(primitive) / 4),
        _absoluteLineHeight: _absoluteLineHeight(primitive),
        _blockInnerHeight: _blockInnerHeight(primitive),
        _blockHeight: _blockHeight(primitive),
        ...primitive,
    }
    const link = {
        color: base.primaryColor,
        decoration: 'none' as CSS.TextDecorationLineProperty,
        hoverDecoration: 'none' as CSS.TextDecorationLineProperty,
        ...customLink
    }
    const input = {
        ...baseInputTheme,
        fontSize: base.fontSize,
        lineHeight: base.lineHeight,
        paddingX: base.paddingX,
        paddingY:base.paddingY,
        borderRadius: base.borderRadius,
        borderColor: base.borderColor,
        borderWidth: base.borderWidth,
        focusBorderColor: lighten(0.25, base.primaryColor),
        ...customInput
    }
    const button = {
        fontWeight: 'bold' as CSS.FontWeightProperty,
        fontSize: base.fontSize,
        lineHeight: base.lineHeight,
        paddingX: base.paddingX,
        paddingY: base.paddingY,
        borderRadius: base.borderRadius,
        borderWidth: base.borderWidth,
        ...customButton
    }
    const socialButton = {
        inline: false,
        fontWeight: button.fontWeight,
        fontSize: button.fontSize,
        lineHeight: button.lineHeight,
        paddingX: button.paddingX,
        paddingY: button.paddingY,
        borderRadius: button.borderRadius,
        borderWidth: button.borderWidth,
        ...customSocialButton
    }
    return {
        ...base,
        link: {
            ...link,
            hoverColor: darken(0.15, link.color),
        },
        input: {
            ...input,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(input.fontSize, input.lineHeight, input.paddingY, input.borderWidth)
        },
        button: {
            ...button,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(button.fontSize, button.lineHeight, button.paddingY, button.borderWidth)
        },
        socialButton: {
            ...socialButton,
            textVisible: !(socialButton.inline),
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(socialButton.fontSize, socialButton.lineHeight, socialButton.paddingY, socialButton.borderWidth)
        },
        passwordStrengthValidator: {
            color0: base.dangerColor,
            color1: base.dangerColor,
            color2: base.warningColor,
            color3: lighten(0.2, base.successColor),
            color4: base.successColor
        }
    }
}
