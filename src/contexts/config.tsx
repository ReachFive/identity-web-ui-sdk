import type { ComponentType, PropsWithChildren } from 'react';
import React from 'react';

import type { Config } from '../types';

export interface Props {
    config: Config;
}

export const ConfigContext = React.createContext<Config | undefined>(undefined);

export function useConfig(): Config {
    const context = React.useContext(ConfigContext);
    if (!context) {
        throw new Error('No ConfigContext provided');
    }

    return context;
}

export interface ConfigProps {
    config: Config;
}

export type WithConfig<P> = P & ConfigProps;

export function withConfig<T extends ConfigProps = ConfigProps>(
    WrappedComponent: ComponentType<T>
) {
    const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

    const ComponentWithConfig = (props: Omit<T, keyof ConfigProps>) => {
        const config = useConfig();
        return <WrappedComponent {...{ config }} {...(props as T)} />;
    };

    ComponentWithConfig.displayName = `withConfig(${displayName})`;

    return ComponentWithConfig;
}

export function ConfigProvider({ children, config }: PropsWithChildren<Props>): JSX.Element | null {
    return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}
