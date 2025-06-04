import type { PropsWithChildren } from 'react';
import React from 'react';

import { log, logError } from '../helpers/logger';

export interface Logger {
    log: typeof log;
    error: typeof logError;
}

export interface Props {}

export const LoggerContext = React.createContext<Logger | undefined>(undefined);

export function useLogger(): Logger {
    const context = React.useContext(LoggerContext);
    if (!context) {
        throw new Error('No LoggerContext provided');
    }

    return context;
}

export function LoggerProvider({ children }: PropsWithChildren<Props>): JSX.Element | null {
    const logger = { log, error: logError } satisfies Logger;

    return <LoggerContext.Provider value={logger}>{children}</LoggerContext.Provider>;
}
