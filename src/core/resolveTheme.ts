import { buildTheme } from './theme';
import { buildThemeVariables, type ThemeVariables } from './themeVariables';

import type { ButtonTheme, ProviderBrandedColors, ThemeOptions } from '@/types/theme';

/** The theme options components still read from JS: behaviour, and colors combined per provider. */
export interface ThemeSettings {
    animateWidgetEntrance: boolean;
    socialButton: { inline: boolean } & Partial<Pick<ButtonTheme, ProviderBrandedColors>>;
}

export interface ResolvedTheme {
    variables: ThemeVariables;
    settings: ThemeSettings;
}

/** Resolves the integrator's theme options into the widget's CSS variables and JS settings. */
export function resolveTheme(options: ThemeOptions = {}): ResolvedTheme {
    const theme = buildTheme(options);
    const {
        inline,
        color,
        background,
        borderColor,
        hoverBackground,
        hoverBorderColor,
        hoverColor,
    } = theme.socialButton;

    return {
        variables: buildThemeVariables(options, theme),
        settings: {
            animateWidgetEntrance: theme.animateWidgetEntrance,
            socialButton: {
                inline,
                color,
                background,
                borderColor,
                hoverBackground,
                hoverBorderColor,
                hoverColor,
            },
        },
    };
}
