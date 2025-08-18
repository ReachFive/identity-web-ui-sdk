import { ErrorResponse, type AuthOptions, type SessionInfo } from '@reachfive/identity-core';
import { useSuspenseQuery } from '@tanstack/react-query';
import React, { PropsWithChildren, createContext, useContext } from 'react';
import { useReachfive } from './reachfive';

type SessionValue = SessionInfo | null | undefined;

export const SessionContext = createContext<SessionValue>(undefined);

export type Props = {
    auth?: AuthOptions;
};

export type PropsWithSession<P> = P & { session: SessionValue };

export function useSession(): SessionValue {
    return useContext(SessionContext);
}

export function SessionProvider({ auth, children }: PropsWithChildren<Props>) {
    const { client, config } = useReachfive();

    const { data: session } = useSuspenseQuery({
        queryKey: ['ssocheck'],
        queryFn: async () => {
            if (config.sso || auth?.idTokenHint || auth?.loginHint) {
                const authResult = client.checkUrlFragment(window.location.href);
                // Avoid authentication triggering when an authentication response is present
                if (authResult) return null;

                try {
                    const session = await client.getSessionInfo();

                    const reAuthenticate = auth?.prompt === 'login';

                    if (session.isAuthenticated && !reAuthenticate) {
                        await client.loginFromSession(auth);
                        return null;
                    } else {
                        return session;
                    }
                } catch (error) {
                    ErrorResponse.isErrorResponse(error)
                        ? console.log(error.errorUserMsg ?? error.errorDescription ?? error.error)
                        : console.error(error);
                    return null;
                }
            }
            return null;
        },
        retry: false,
    });

    return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function withSsoCheck<P extends { auth?: AuthOptions }>(
    WrappedComponent: React.ComponentType<P>
) {
    const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

    const SsoCheck = ({ auth, ...props }: P) => {
        return (
            <SessionProvider auth={auth}>
                <WrappedComponent {...({ auth, ...props } as P)} />
            </SessionProvider>
        );
    };

    SsoCheck.displayName = `withSsoCheck(${displayName})`;

    return SsoCheck;
}
