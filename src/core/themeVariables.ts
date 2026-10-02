import { colorToHSL, fadeColor, shadeColor } from '@/lib/utils';
import { Theme, ThemeOptions } from '@/types/theme';

import { derivedTextColor, surfaceTextColor } from './theme';

/** The CSS custom properties a widget is rendered with, as a React `style` object. */
export type ThemeVariables = Record<string, string>;

/**
 * Opacity of the tint `outline` and `ghost` buttons use as their hover surface.
 * @see components/ui/button
 */
const SUBTLE_BG_ALPHA = 0.08;

/** `${value}px`, or `fallback` when the option was not supplied. */
const px = (value: number | undefined, fallback: string): string =>
    value !== undefined ? `${value}px` : fallback;

/** Spells `none` as a transparent shadow, so Tailwind's composed `box-shadow` keeps the ring. */
export const composableShadow = (value: string): string => (value === 'none' ? '0 0 #0000' : value);

/**
 * Builds the widget's CSS variables: shadcn palette and scales unprefixed, component tokens `--r5-*`.
 * A component token points at the palette (`hsl(var(--primary))`) unless its option was supplied,
 * hence the raw `options` alongside the resolved `theme`, which can no longer tell the two apart.
 */
export function buildThemeVariables(options: ThemeOptions, theme: Theme): ThemeVariables {
    const { button, input, link, passwordStrengthValidator: passwordStrength } = options;

    return {
        /* Palette roles. */
        '--background': colorToHSL(theme.backgroundColor),
        '--foreground': colorToHSL(theme.textColor),
        '--primary': colorToHSL(theme.primaryColor),
        '--primary-foreground': colorToHSL(surfaceTextColor(theme.primaryColor)),
        '--primary-hover': colorToHSL(shadeColor(theme.primaryColor)),
        '--destructive': colorToHSL(theme.dangerColor),
        '--destructive-foreground': colorToHSL(surfaceTextColor(theme.dangerColor)),
        '--warning': colorToHSL(theme.warningColor),
        '--warning-foreground': colorToHSL(derivedTextColor(theme.warningColor)),
        '--success': colorToHSL(theme.successColor),
        '--success-foreground': colorToHSL(surfaceTextColor(theme.successColor)),
        '--popover': colorToHSL(theme.backgroundColor),
        '--popover-foreground': colorToHSL(theme.textColor),
        '--accent': colorToHSL(theme.primaryColor),
        '--accent-foreground': colorToHSL(theme.textColor),
        '--muted': colorToHSL(theme.input.disabledBackground),
        '--muted-foreground': colorToHSL(theme.mutedTextColor),
        '--border': colorToHSL(theme.borderColor),
        '--input': colorToHSL(theme.input.borderColor),
        '--ring': colorToHSL(theme.input.focusBorderColor),

        /* Widget-wide scales. */
        '--spacing': `${theme.spacing}px`,
        '--padding-x': `${theme.paddingX}px`,
        '--padding-y': `${theme.paddingY}px`,
        '--font-size': `${theme.fontSize}px`,
        '--leading': `${theme.lineHeight}`,
        '--border-width': `${theme.borderWidth}px`,
        '--radius': `${theme.borderRadius}px`,

        /* Widget shell. */
        '--r5-widget-max-width': `${theme.maxWidth}px`,

        /* Heading. The size stays a pointer, so it follows `fontSize` like the former `fontSize * 1.2`. */
        '--r5-heading-text': theme.headingColor,
        '--r5-heading-text-size': 'calc(var(--font-size) * 1.2)',
        '--r5-heading-font-weight': 'bold',

        /* Button. */
        '--r5-button-bg': button?.background ?? 'hsl(var(--primary))',
        '--r5-button-hover-bg': button?.hoverBackground ?? 'hsl(var(--primary-hover))',
        '--r5-button-border-color': button?.borderColor ?? 'hsl(var(--primary))',
        '--r5-button-hover-border-color': button?.hoverBorderColor ?? 'hsl(var(--primary))',
        '--r5-button-text': button?.color ?? 'hsl(var(--primary-foreground))',
        '--r5-button-hover-text': button?.hoverColor ?? 'hsl(var(--primary-foreground))',
        // Hover surface for the `outline` and `ghost` variants.
        '--r5-button-subtle-bg': button?.background
            ? fadeColor(button.background, 1 - SUBTLE_BG_ALPHA)
            : `hsl(var(--primary) / ${SUBTLE_BG_ALPHA})`,
        '--r5-button-text-size': px(button?.fontSize, 'var(--font-size)'),
        '--r5-button-leading': `${button?.lineHeight ?? 'var(--leading)'}`,
        '--r5-button-padding-x': px(button?.paddingX, 'var(--padding-x)'),
        '--r5-button-padding-y': px(button?.paddingY, 'var(--padding-y)'),
        '--r5-button-radius': px(button?.borderRadius, 'var(--radius)'),
        '--r5-button-border-width': px(button?.borderWidth, 'var(--border-width)'),
        '--r5-button-font-weight': `${theme.button.fontWeight}`,
        '--r5-button-shadow': composableShadow(`${theme.button.boxShadow}`),
        '--r5-button-height': `${theme.button.height}px`,

        /* Input */
        '--r5-input-bg': theme.input.background,
        '--r5-input-text': theme.input.color,
        '--r5-input-placeholder-text': theme.input.placeholderColor,
        '--r5-input-disabled-bg': theme.input.disabledBackground,
        '--r5-input-border-color': input?.borderColor ?? 'hsl(var(--border))',
        '--r5-input-border-width': px(input?.borderWidth, 'var(--border-width)'),
        '--r5-input-radius': px(input?.borderRadius, 'var(--radius)'),
        '--r5-input-text-size': px(input?.fontSize, 'var(--font-size)'),
        '--r5-input-leading': `${input?.lineHeight ?? 'var(--leading)'}`,
        '--r5-input-padding-x': px(input?.paddingX, 'var(--padding-x)'),
        '--r5-input-padding-y': px(input?.paddingY, 'var(--padding-y)'),
        '--r5-input-shadow': composableShadow(`${theme.input.boxShadow}`),
        '--r5-input-height': `${theme.input.height}px`,

        /* Link */
        '--r5-link-text': link?.color ?? 'hsl(var(--primary))',
        '--r5-link-hover-text': theme.link.hoverColor,
        '--r5-link-decoration': `${theme.link.decoration}`,
        '--r5-link-hover-decoration': `${theme.link.hoverDecoration}`,

        /* Password strength. */
        '--r5-password-strength-bg-0': passwordStrength?.color0 ?? 'hsl(var(--destructive))',
        '--r5-password-strength-bg-1': passwordStrength?.color1 ?? 'hsl(var(--destructive))',
        '--r5-password-strength-bg-2': passwordStrength?.color2 ?? 'hsl(var(--warning))',
        '--r5-password-strength-bg-3':
            passwordStrength?.color3 ??
            'color-mix(in oklch, hsl(var(--warning)), hsl(var(--success)))',
        '--r5-password-strength-bg-4': passwordStrength?.color4 ?? 'hsl(var(--success))',
    };
}
