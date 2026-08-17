import type { PropsWithChildren } from 'react';
import React from 'react';

import { logError } from '../helpers/logger';
import { cn } from '../lib/utils';

import type { ThemeVariables } from '../core/themeVariables';

export interface Props {
    variables: ThemeVariables;
}

interface ThemeVariablesScope {
    variables: ThemeVariables;
    /** Class the declarations are attached to. Must be set on every element that needs them. */
    className: string;
}

export const ThemeVariablesContext = React.createContext<ThemeVariablesScope | undefined>(
    undefined
);

/**
 * The CSS custom property scope of the enclosing widget.
 *
 * Consumed by every element that has to carry the tokens — the widget container itself, and each
 * Radix portal, which renders into `document.body` and would otherwise sit outside both the token
 * scope and the `.r5-widget` selector Tailwind prefixes every utility with.
 */
export function useThemeVariables(): ThemeVariablesScope {
    const context = React.useContext(ThemeVariablesContext);
    if (!context) {
        throw new Error('No ThemeVariablesContext provided');
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
 * Carries the widget's CSS custom properties on a plain `div`.
 *
 * Used by every Radix portal, which renders into `document.body` — outside both the token scope
 * and the `.r5-widget` selector Tailwind prefixes each utility with.
 */
export const ThemeVariablesContainer = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
    const { className: themeClassName } = useThemeVariables();
    return <div className={cn(themeClassName, className)} {...props} />;
};

export function ThemeVariablesProvider({
    children,
    variables,
}: PropsWithChildren<Props>): JSX.Element | null {
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

    const scope = React.useMemo(() => ({ variables, className }), [variables, className]);

    return (
        <ThemeVariablesContext.Provider value={scope}>
            <style>{style}</style>
            {children}
        </ThemeVariablesContext.Provider>
    );
}
