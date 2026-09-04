import { CSSProperties } from 'styled-components';

import {
    darkenColor,
    fadeColor,
    lightenColor,
    pickByLightness,
    shadeColor,
    toHexColor,
} from '@/lib/utils';
import {
    BaseTheme,
    ButtonTheme,
    InputTheme,
    LinkTheme,
    SocialButtonTheme,
    Theme,
    ThemeOptions,
} from '@/types/styled';

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

type PrimitiveTheme = Omit<
    BaseTheme,
    | 'paddingX'
    | 'paddingY'
    | 'spacing'
    | '_absoluteLineHeight'
    | '_blockInnerHeight'
    | '_blockHeight'
>;

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
    maxWidth: 400,
};

export const paddingY = (theme: Pick<PrimitiveTheme, 'fontSize' | 'lineHeight' | 'borderWidth'>) =>
    Math.round(theme.fontSize * theme.lineHeight) / 2 - theme.borderWidth;

export const paddingX = (theme: Parameters<typeof paddingY>[0]) =>
    Math.round((paddingY(theme) * 4) / 3);

export const _absoluteLineHeight = (theme: Pick<PrimitiveTheme, 'fontSize' | 'lineHeight'>) =>
    Math.round(theme.fontSize * theme.lineHeight);

export const _blockInnerHeight = (
    theme: Parameters<typeof _absoluteLineHeight>[0] & Parameters<typeof paddingY>[0]
) => _absoluteLineHeight(theme) + 2 * paddingY(theme);

export const _blockHeight = (
    theme: Parameters<typeof _blockInnerHeight>[0] & Pick<PrimitiveTheme, 'borderWidth'>
) => _blockInnerHeight(theme) + 2 * theme.borderWidth;

/**
 * Text color the design system pins on its own brand colors, overriding the derived,
 * contrast-driven value.
 */
const brandSurfaceTextColor = '#ffffff';

/**
 * Brand surfaces the pinned text color applies to.
 *
 * Normalises through hex so a brand color is recognised whatever notation it is written in
 * (`#229955`, `#229955` uppercased, `rgb(34, 153, 85)`, …).
 */
const brandSurfaces = new Set(
    [primitiveTheme.primaryColor, primitiveTheme.dangerColor, primitiveTheme.successColor].map(
        toHexColor
    )
);

/** Text color picked from the contrast of the surface color, without the brand exception. */
export const derivedTextColor = (color: string): string =>
    pickByLightness(color, '#ffffff', '#000000');

/** Text color to render on a filled surface of `color`. */
export const surfaceTextColor = (color: string): string =>
    brandSurfaces.has(toHexColor(color)) ? brandSurfaceTextColor : derivedTextColor(color);

export const inputBtnFocusBoxShadow = (
    color?: CSSProperties['color']
): NonNullable<CSSProperties['boxShadow']> =>
    color ? `0 0 0 3px ${fadeColor(color, 0.5)}` : 'none';

export const height = (
    fontSize: number,
    lineHeight: number,
    paddingY: number,
    borderWidth: number
) => Math.round(fontSize * lineHeight) + 2 * paddingY + 2 * borderWidth;

export const baseInputTheme = {
    color: gray700,
    placeholderColor: gray600,
    background: white,
    disabledBackground: gray200,
    boxShadow: 'none',
    focusBoxShadow: inputBtnFocusBoxShadow,
};

export const buildTheme = (themeOptions: ThemeOptions = {} as Partial<ThemeOptions>): Theme => {
    const {
        link: customLink,
        input: customInput,
        button: customButton,
        socialButton: customSocialButton,
        ...customBase
    } = themeOptions;
    const primitive = { ...primitiveTheme, ...customBase };
    const base: BaseTheme = {
        paddingY: paddingY(primitive),
        paddingX: paddingX(primitive),
        spacing: Math.round(_blockHeight(primitive) / 4),
        _absoluteLineHeight: _absoluteLineHeight(primitive),
        _blockInnerHeight: _blockInnerHeight(primitive),
        _blockHeight: _blockHeight(primitive),
        ...primitive,
    };
    const link: Omit<LinkTheme, 'hoverColor'> = {
        color: base.primaryColor,
        decoration: 'none',
        hoverDecoration: 'none',
        ...customLink,
    };
    const input: Omit<InputTheme, 'focusBoxShadow' | 'height'> = {
        ...baseInputTheme,
        fontSize: base.fontSize,
        lineHeight: base.lineHeight,
        paddingX: base.paddingX,
        paddingY: base.paddingY,
        borderColor: base.borderColor,
        borderRadius: base.borderRadius,
        borderWidth: base.borderWidth,
        focusBorderColor: lightenColor(base.primaryColor, 25),
        ...customInput,
    };
    const button: Omit<ButtonTheme, 'focusBoxShadow' | 'height'> = {
        fontWeight: 'bold',
        fontSize: base.fontSize,
        lineHeight: base.lineHeight,
        paddingX: base.paddingX,
        paddingY: base.paddingY,
        background: base.primaryColor,
        borderColor: base.primaryColor,
        borderRadius: base.borderRadius,
        borderWidth: base.borderWidth,
        boxShadow: 'none',
        color: surfaceTextColor(base.primaryColor),
        hoverBackground: shadeColor(base.primaryColor),
        hoverColor: surfaceTextColor(base.primaryColor),
        hoverBorderColor: base.primaryColor,
        ...customButton,
    };
    // Shape is inherited from the regular button, but the colors (`color`, `background`,
    // `borderColor` and their `hover*` counterparts) are deliberately left unset: each social
    // button then falls back to its provider's own brand color. See components/slo/social-buttons.
    const socialButton: Omit<SocialButtonTheme, 'focusBoxShadow' | 'height'> = {
        inline: false,
        fontWeight: button.fontWeight,
        fontSize: button.fontSize,
        lineHeight: button.lineHeight,
        paddingX: button.paddingX,
        paddingY: button.paddingY,
        borderRadius: button.borderRadius,
        borderWidth: button.borderWidth,
        boxShadow: button.boxShadow,
        ...customSocialButton,
    };
    return {
        ...base,
        link: {
            ...link,
            hoverColor: customLink?.hoverColor ?? darkenColor(link.color, 15),
        },
        input: {
            ...input,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(input.fontSize, input.lineHeight, input.paddingY, input.borderWidth),
        },
        button: {
            ...button,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(button.fontSize, button.lineHeight, button.paddingY, button.borderWidth),
        },
        socialButton: {
            ...socialButton,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(
                socialButton.fontSize,
                socialButton.lineHeight,
                socialButton.paddingY,
                socialButton.borderWidth
            ),
        },
        passwordStrengthValidator: {
            ...customBase.passwordStrengthValidator,
        },
    };
};
