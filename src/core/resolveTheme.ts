import { buildTheme } from './theme';
import { buildThemeVariables, type ThemeVariables } from './themeVariables';

import type { ThemeOptions } from '@/types/theme';

/** The theme options that configure behaviour rather than style, read from JS. */
export interface ThemeSettings {
    animateWidgetEntrance: boolean;
    socialButton: { inline: boolean };
}

export interface ResolvedTheme {
    variables: ThemeVariables;
    settings: ThemeSettings;
}

/** Resolves the integrator's theme options into the widget's CSS variables and JS settings. */
export function resolveTheme(options: ThemeOptions = {}): ResolvedTheme {
    const theme = buildTheme(options);

    return {
        variables: buildThemeVariables(options, theme),
        settings: {
            animateWidgetEntrance: theme.animateWidgetEntrance,
            socialButton: { inline: theme.socialButton.inline },
        },
    };
}
