import React, { PropsWithChildren } from 'react';
import type { SessionInfo } from '@reachfive/identity-core';

export type Props = {
  session?: SessionInfo | null
}

export type PropsWithSession<P> = P & { session?: SessionInfo }

export const SessionContext = React.createContext<SessionInfo | null | undefined>(undefined);

export function useSession(): SessionInfo | null {
  const context = React.useContext(SessionContext);
  if (context === undefined) {
    throw new Error('No SessionContext provided');
  }

  return context;
}

export function SessionProvider({ children, session = null }: PropsWithChildren<Props>): JSX.Element | null {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
