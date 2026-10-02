import type { PropsWithChildren } from 'react';
import React from 'react';

import type { Theme } from '@/types/theme';

export interface Props {
    theme: Theme;
}

export const ThemeContext = React.createContext<Theme | undefined>(undefined);

export function useTheme(): Theme {
    const context = React.useContext(ThemeContext);
    if (!context) {
        throw new Error('No ThemeContext provided');
    }

    return context;
}

export function ThemeProvider({ children, theme }: PropsWithChildren<Props>): JSX.Element | null {
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
