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
 *
 * {@link pickByLightness} would pick black on both of them: white is 3.65:1 on the brand green
 * against black's 5.76:1, and 4.03:1 on the brand red against 5.21:1. The design system mandates
 * white in both places, and that is a deliberate, documented exception — neither meets WCAG 2.x AA
 * for normal text.
 */
const brandSurfaceTextColor = '#ffffff';

/**
 * Builds the resolver for "text rendered on a filled surface of some color".
 *
 * The exception above is keyed to one specific `brandColor`, which keeps it tied to the role it
 * was granted for: a tenant who picks the brand red as their *primary* color still gets the
 * contrast-derived text color on their buttons. Every color other than `brandColor` — including a
 * tenant's own — keeps the derived value.
 *
 * Normalises through hex so a brand color is recognised whatever notation it is written in
 * (`#229955`, `#229955` uppercased, `rgb(34, 153, 85)`, …).
 */
const textColorOn =
    (brandColor: string) =>
    (color: string): string =>
        toHexColor(color) === toHexColor(brandColor)
            ? brandSurfaceTextColor
            : pickByLightness(color, '#ffffff', '#000000');

/** Text color to render on a filled button standing on `primaryColor`. */
export const buttonTextColor = textColorOn(primitiveTheme.primaryColor);

/** Text color to render on a destructive surface standing on `dangerColor`. */
export const destructiveTextColor = textColorOn(primitiveTheme.dangerColor);

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
        color: buttonTextColor(base.primaryColor),
        hoverBackground: shadeColor(base.primaryColor),
        hoverColor: buttonTextColor(base.primaryColor),
        hoverBorderColor: base.primaryColor,
        ...customButton,
    };
    // Shape is inherited from the regular button, but the colors (`color`, `background`,
    // `borderColor` and their `hover*` counterparts) are deliberately left unset: each social
    // button then falls back to its provider's own brand color. See components/slo/social-buttons.
    const socialButton: Omit<SocialButtonTheme, 'focusBoxShadow' | 'height' | 'textVisible'> = {
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
            textVisible: !socialButton.inline,
            focusBoxShadow: inputBtnFocusBoxShadow,
            height: height(
                socialButton.fontSize,
                socialButton.lineHeight,
                socialButton.paddingY,
                socialButton.borderWidth
            ),
        },
        passwordStrengthValidator: {
            color0: base.dangerColor,
            color1: base.dangerColor,
            color2: base.warningColor,
            color3: lightenColor(base.successColor, 20),
            color4: base.successColor,
        },
    };
};
