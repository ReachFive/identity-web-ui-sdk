import type { Client as CoreClient } from '@reachfive/identity-core';
import React, { PropsWithChildren } from 'react';

export interface Props {
    client: CoreClient;
}

export const ReachfiveContext = React.createContext<CoreClient | undefined>(undefined);

export function useReachfive(): CoreClient {
    const context = React.useContext(ReachfiveContext);
    if (!context) {
        throw new Error('No ReachfiveContext provided');
    }

    return context;
}

export function ReachfiveProvider({
    children,
    client,
}: PropsWithChildren<Props>): JSX.Element | null {
    return <ReachfiveContext.Provider value={client}>{children}</ReachfiveContext.Provider>;
}
