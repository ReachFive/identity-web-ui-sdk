import React, { PropsWithChildren } from 'react';

export type GoToFn = <P extends Record<string, unknown>>(view: string, params?: P) => void;

export type Routing = {
    goTo: GoToFn;
    params: Record<string, unknown>;
};

export type PropsWithRouting<P = unknown> = P & Routing;

export const RoutingContext = React.createContext<Routing | undefined>(undefined);

export function useRouting(): Routing {
    const context = React.useContext(RoutingContext);
    if (!context) {
        throw new Error('No RoutingContext provided');
    }

    return context;
}

type RoutingProviderProps = PropsWithRouting<PropsWithChildren<{}>>;

export function RoutingProvider({
    children,
    goTo,
    params = {},
}: RoutingProviderProps): JSX.Element | null {
    return <RoutingContext.Provider value={{ goTo, params }}>{children}</RoutingContext.Provider>;
}
