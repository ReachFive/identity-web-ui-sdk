import { MFA } from '@reachfive/identity-core';
import React, { useCallback, useState } from 'react';

import { useReachfive } from '../../../contexts/reachfive';

type CredentialsContextType = {
    credentials: MFA.Credential[];
    refresh: () => Promise<MFA.Credential[]>;
};

export const CredentialsContext = React.createContext<CredentialsContextType>({
    credentials: [],
    refresh: () => Promise.resolve([]),
});

export const useCredentials = () => {
    return React.useContext(CredentialsContext);
};

export type CredentialsProviderProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * The user's MFA credentials
     */
    credentials: MFA.Credential[];
};

export const CredentialsProvider = ({
    accessToken,
    children,
    credentials: initialCredentials,
}: React.PropsWithChildren<CredentialsProviderProps>) => {
    const coreClient = useReachfive();
    const [credentials, setCredentials] = useState<MFA.Credential[]>(initialCredentials);

    const refresh = useCallback(() => {
        return coreClient.listMfaCredentials(accessToken).then(({ credentials }) => {
            setCredentials(credentials);
            return credentials;
        });
    }, []);

    return (
        <CredentialsContext.Provider value={{ credentials, refresh }}>
            {children}
        </CredentialsContext.Provider>
    );
};

const withCredentials = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

    const ComponentWithCredentialsContext = (props: P & CredentialsProviderProps) => {
        return (
            <CredentialsProvider accessToken={props.accessToken} credentials={props.credentials}>
                <WrappedComponent {...(props as P)} />
            </CredentialsProvider>
        );
    };

    ComponentWithCredentialsContext.displayName = `withCredentials(${displayName})`;

    return ComponentWithCredentialsContext;
};

export { withCredentials };
