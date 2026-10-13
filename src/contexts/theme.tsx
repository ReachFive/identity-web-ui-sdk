import type { PropsWithChildren } from 'react';
import React from 'react';

import { resolveTheme, type ThemeSettings } from '@/core/resolveTheme';
import { logError } from '@/helpers/logger';
import { cn } from '@/lib/utils';

import type { ThemeVariables } from '@/core/themeVariables';
import type { ThemeOptions } from '@/types/theme';

export interface Props {
    /** The integrator's theme options, as passed to the widget. */
    options?: ThemeOptions;
}

interface ThemeContextValue {
    /** Scope class carrying the widget's CSS variables. */
    className: string;
    /** The theme options read from JS rather than through CSS variables. */
    settings: ThemeSettings;
}

export const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useTheme(): ThemeContextValue {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error('No ThemeContext provided');
    }

    return context;
}

/**
 * `{` `}` and `;` would let a theme value break out of the declaration block it is written into.
 * Theme options come from the integrating application rather than from an end user, so this is a
 * guard against mistakes rather than against an attacker — but this is an identity SDK, and the
 * cost of the check is one regex.
 */
const BREAKS_OUT_OF_DECLARATION = /[{};]/;

function declarations(variables: ThemeVariables): string {
    return Object.entries(variables)
        .filter(([property, value]) => {
            if (!BREAKS_OUT_OF_DECLARATION.test(value)) return true;
            logError(
                `Ignoring theme value for ${property}: ${JSON.stringify(value)} contains one of ` +
                    `"{", "}" or ";", which cannot appear in a CSS custom property value.`
            );
            return false;
        })
        .map(([property, value]) => `${property}:${value}`)
        .join(';');
}

/**
 * djb2, base36. Deriving the scope from the declarations rather than from `useId` keeps it stable
 * across renders, lets identically themed widgets share one block, and — since `useId` allocates
 * from a tree-wide sequence — avoids shifting the generated `id` of every form field below.
 */
function hash(value: string): string {
    let h = 5381;
    for (let i = 0; i < value.length; i++) {
        h = ((h << 5) + h + value.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
}

/**
 * A plain `div` carrying the widget's token scope and the `.r5-widget` class Tailwind prefixes
 * every utility with.
 *
 * Wraps the widget itself, and every Radix portal, which renders into `document.body` — outside
 * both. `important: '.r5-widget'` compiles to a descendant selector, so no utility can style this
 * element itself: put styles on its children.
 */
export const ThemeVariablesContainer = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { className: themeClassName } = useTheme();
    return <div className={cn(themeClassName, 'r5-widget', className)} {...props} />;
};

/**
 * Resolves the theme options once per widget: the CSS variables are written into a scoped
 * `<style>`, the remaining settings are exposed through {@link useTheme}.
 */
export function ThemeProvider({ children, options }: PropsWithChildren<Props>): JSX.Element | null {
    const { variables, settings } = React.useMemo(() => resolveTheme(options), [options]);

    const { className, style } = React.useMemo(() => {
        const block = declarations(variables);
        // Scoped per theme: two widgets on the same page may be themed differently.
        const className = `r5-theme-${hash(block)}`;
        // `:where()` carries no specificity, so these are pure defaults: a declaration on the
        // element still beats a value inherited from the host page, while *any* rule an integrator
        // writes against the widget wins over them, whatever the stylesheet order. That is what
        // makes the tokens a themeable surface rather than one needing `!important` to move.
        return { className, style: `:where(.${className}){${block}}` };
    }, [variables]);

    const value = React.useMemo(() => ({ className, settings }), [className, settings]);

    return (
        <ThemeContext.Provider value={value}>
            <style>{style}</style>
            {children}
        </ThemeContext.Provider>
    );
}
