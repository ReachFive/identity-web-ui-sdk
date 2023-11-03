import React, { PropsWithChildren } from 'react';
import type { Client as CoreClient } from '@reachfive/identity-core';

export interface Props {
  client: CoreClient
}

export const ReacfiveContext = React.createContext<CoreClient | undefined>(undefined);

export function useReachfive(): CoreClient {
  const context = React.useContext(ReacfiveContext);
  if (!context) {
    throw new Error('No ReacfiveContext provided');
  }

  return context;
}

export function ReacfiveProvider({ children, client }: PropsWithChildren<Props>): JSX.Element | null {
  return <ReacfiveContext.Provider value={client}>{children}</ReacfiveContext.Provider>
}
