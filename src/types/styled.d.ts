import { CSSProperties } from 'react';

import 'styled-components';

import { RecursivePartial } from './index';

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
}

/**
 * Keys `buildTheme` derives from the other tokens rather than reading from the options.
 *
 * `height` is arithmetic over `fontSize`, `lineHeight`, `paddingY` and `borderWidth`
 * (@see core/theme#height): the resolved {@link Theme} always carries it, but `buildTheme`
 * recomputes it after merging, so a value passed here would be silently dropped. Excluding it
 * from the options turns that into a compile-time error instead — to make a control taller,
 * move `paddingY`, `fontSize` or `lineHeight`.
 */
type DerivedThemeKeys = 'height';

export type ThemeOptions = RecursivePartial<
    Omit<Theme, 'input' | 'button' | 'socialButton'> & {
        input: Omit<InputTheme, DerivedThemeKeys>;
        button: Omit<ButtonTheme, DerivedThemeKeys>;
        socialButton: Omit<SocialButtonTheme, DerivedThemeKeys>;
    }
>;

export interface BaseTheme {
    /**
     * @default true
     */
    animateWidgetEntrance: boolean;
    /** Specifies the font-size.
     * @default 14
     */
    fontSize: number;
    /** Specifies the font-size for small texts.
     * @default 12
     */
    smallTextFontSize: number;
    /** Specifies the line-height.
     * @default 1.428571429
     */
    lineHeight: number;
    /**
     * @default "#212529"
     */
    headingColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#495057"
     */
    textColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#adb5bd"
     */
    mutedTextColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "3"
     */
    borderRadius: number;
    /**
     * @default "#ced4da "
     */
    borderColor: NonNullable<CSSProperties['color']>;
    /**
     * @default 1
     */
    borderWidth: number;
    /**
     * @default "#ffffff"
     */
    backgroundColor: NonNullable<CSSProperties['color']>;
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#dc4e41"
     */
    dangerColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#ffc107"
     */
    warningColor: NonNullable<CSSProperties['color']>;
    /**
     * @default "#229955"
     */
    successColor: NonNullable<CSSProperties['color']>;
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number;
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number;
    spacing: number;
    /**
     * @default 400
     */
    maxWidth: number;
    _absoluteLineHeight: number;
    _blockInnerHeight: number;
    _blockHeight: number;
}

export interface LinkTheme {
    color: NonNullable<CSSProperties['color']>;
    decoration: NonNullable<CSSProperties['textDecoration']>;
    hoverColor: NonNullable<CSSProperties['color']>;
    hoverDecoration: NonNullable<CSSProperties['textDecoration']>;
}

export interface InputTheme {
    color: NonNullable<CSSProperties['color']>;
    placeholderColor: NonNullable<CSSProperties['color']>;
    fontSize: number;
    lineHeight: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    borderColor: NonNullable<CSSProperties['color']>;
    borderWidth: number;
    background: NonNullable<CSSProperties['color']>;
    disabledBackground: NonNullable<CSSProperties['color']>;
    boxShadow: NonNullable<CSSProperties['boxShadow']>;
    focusBorderColor: NonNullable<CSSProperties['color']>;
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
    /** Computed from `fontSize`, `lineHeight`, `paddingY` and `borderWidth`. Not settable — @see DerivedThemeKeys */
    height: number;
}

export interface ButtonTheme {
    /** Specifies the text color. */
    color: NonNullable<CSSProperties['color']>;
    /** Specifies the font-weight (such as normal, bold, or 900).
     * @default 'bold'
     */
    fontWeight: NonNullable<CSSProperties['fontWeight']>;
    /** Specifies the font-size. */
    fontSize: number;
    /** Specifies the line-height. */
    lineHeight: number;
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number;
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number;
    /** Specifies the background-color. */
    background: NonNullable<CSSProperties['color']>;
    /** Specifies the border-color. */
    borderColor: NonNullable<CSSProperties['color']>;
    /** Specifies the border-radius. */
    borderRadius: number;
    /** Specifies the border-width. */
    borderWidth: number;
    /** Specifies the box shadow. */
    boxShadow: NonNullable<CSSProperties['boxShadow']>;
    /** Specifies the background color on hover. */
    hoverBackground: NonNullable<CSSProperties['color']>;
    /** Specifies the border color on hover. */
    hoverBorderColor: NonNullable<CSSProperties['color']>;
    /** Specifies the color on hover. */
    hoverColor: NonNullable<CSSProperties['color']>;
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
    /** Computed from `fontSize`, `lineHeight`, `paddingY` and `borderWidth`. Not settable — @see DerivedThemeKeys */
    height: number;
}

/**
 * Social button colors that fall back to each provider's own brand color when left unset.
 * @see components/slo/social-buttons.tsx
 */
type ProviderBrandedColors =
    | 'color'
    | 'background'
    | 'borderColor'
    | 'hoverBackground'
    | 'hoverBorderColor'
    | 'hoverColor';

export interface SocialButtonTheme
    extends
        Omit<ButtonTheme, ProviderBrandedColors | 'focusBoxShadow'>,
        Partial<Pick<ButtonTheme, ProviderBrandedColors>> {
    /**
     * Boolean that specifies if the buttons are inline (horizonally-aligned).
     *
     * Also drives the label: an inline row renders icon-only buttons, a stacked column renders
     * labelled ones. @see components/slo/social-buttons
     */
    inline: boolean;
    /**
     * @deprecated Has no effect. Social buttons take their focus ring from the provider's own
     * brand color, applied through the `--ring` custom property. Still computed so that reading
     * it keeps working, but changing it changes nothing.
     */
    focusBoxShadow: (color?: CSSProperties['color']) => NonNullable<CSSProperties['boxShadow']>;
}

export interface PasswordStrengthTheme {
    color0: NonNullable<CSSProperties['color']>;
    color1: NonNullable<CSSProperties['color']>;
    color2: NonNullable<CSSProperties['color']>;
    color3: NonNullable<CSSProperties['color']>;
    color4: NonNullable<CSSProperties['color']>;
}

export interface Theme extends BaseTheme {
    link: LinkTheme;
    input: InputTheme;
    /** Button theming options. */
    button: ButtonTheme;
    /** Social button theming options. */
    socialButton: SocialButtonTheme;
    passwordStrengthValidator: PasswordStrengthTheme;
}
