import 'styled-components';

import { RecursivePartial } from './index'
import { inputBtnFocusBoxShadow } from '../core/theme'
import CSS from 'csstype'

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
}

export type ThemeOptions = RecursivePartial<Theme>

export interface BaseTheme {
    /**
     * @default true
     */
    animateWidgetEntrance: boolean
    /** Specifies the font-size.
     * @default 14
     */
    fontSize: number
    /** Specifies the font-size for small texts.
     * @default 12
     */
    smallTextFontSize: number
    /** Specifies the line-height.
     * @default 1.428571429
     */
    lineHeight: number
    /**
     * @default "#212529"
     */
    headingColor: CSS.Color
    /**
     * @default "#495057"
     */
    textColor: CSS.Color
    /**
     * @default "#adb5bd"
     */
    mutedTextColor: CSS.Color
     /**
     * @default "3"
     */
    borderRadius: number
    /**
     * @default "#ced4da "
     */
    borderColor: CSS.Color
    /**
     * @default 1
     */
    borderWidth: number
    /**
     * @default "#ffffff"
     */
    backgroundColor: CSS.Color
    /**
     * The button and link default color.
     * @default "#229955"
     */
    primaryColor: CSS.Color
    /**
     * @default "#dc4e41"
     */
    dangerColor: CSS.Color
    /**
     * @default "#ffc107"
     */
    warningColor: CSS.Color
    /**
     * @default "#229955"
     */
    successColor: CSS.Color
    /**
     * @default "#e9ecef"
     */
    lightBackgroundColor: CSS.Color
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    spacing: number
    /**
     * @default 400
     */
    maxWidth: number
    _absoluteLineHeight: number
    _blockInnerHeight: number
    _blockHeight: number
}

export interface LinkTheme {
    color: CSS.Color
    decoration: CSS.TextDecorationLineProperty
    hoverColor: CSS.Color
    hoverDecoration: CSS.TextDecorationLineProperty
}

export interface InputTheme {
    color: CSS.Color
    placeholderColor: CSS.Color
    fontSize: number
    lineHeight: number
    paddingX: number
    paddingY: number
    borderRadius: number
    borderColor: CSS.Color
    borderWidth: number
    background: CSS.Color
    disabledBackground: CSS.Color
    boxShadow: string
    focusBorderColor: CSS.Color
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    height: number
}

export interface ButtonTheme {
    /** Specifies the font-weight (such as normal, bold, or 900).
     * @default 'bold'
     */
    fontWeight: CSS.FontWeightProperty
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    /** Specifies the height. */
    height: number
}

export interface SocialButtonTheme {
    /** Boolean that specifies if the buttons are inline (horizonally-aligned). */
    inline: boolean
     /** Boolean that specifies if the text is visible. */
    textVisible: boolean
    /** Specifies the font-weight (such as normal, bold, or 900). */
    fontWeight: CSS.FontWeightProperty
    /** Specifies the font-size. */
    fontSize: number
     /** Specifies the line-height. */
    lineHeight: number
    /** Specifies the padding for the x axis. (left and right) */
    paddingX: number
    /** Specifies the padding for the y axis. (top and bottom) */
    paddingY: number
    /** Specifies the border-radius. */
    borderRadius: number
    /** Specifies the border-width. */
    borderWidth: number
    /** Function that specifies the box shadow based on the border color. */
    focusBoxShadow: typeof inputBtnFocusBoxShadow
    /** Specifies the height. */
    height: number
}

export interface PasswordStrengthTheme {
    color0: CSS.Color
    color1: CSS.Color
    color2: CSS.Color
    color3: CSS.Color
    color4: CSS.Color
}

export interface Theme extends BaseTheme {
    link: LinkTheme
    input: InputTheme
    /** Button theming options. */
    button: ButtonTheme
    /** Social button theming options. */
    socialButton: SocialButtonTheme
    passwordStrengthValidator: PasswordStrengthTheme
}
