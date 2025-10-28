import React, { ComponentType, PropsWithChildren, useMemo } from 'react';

import {
    I18nLocalizedMessages,
    I18nMessages,
    I18nNestedMessages,
    I18nResolver,
    resolveI18n,
} from '../core/i18n';

export interface Props {
    defaultMessages?: I18nMessages;
    messages?: I18nNestedMessages | I18nLocalizedMessages;
    locale?: string;
}

export const I18nContext = React.createContext<I18nResolver | undefined>(undefined);

export function useI18n(): I18nResolver {
    const context = React.useContext(I18nContext);
    if (!context) {
        throw new Error('No I18nContext provided');
    }

    return context;
}

export interface I18nProps {
    i18n: I18nResolver;
}

export type WithI18n<P> = P & I18nProps;

export function withI18n<T extends I18nProps = I18nProps>(WrappedComponent: ComponentType<T>) {
    const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

    const ComponentWithI18n = (props: Omit<T, keyof I18nProps>) => {
        const i18n = useI18n();
        return <WrappedComponent {...{ i18n }} {...(props as T)} />;
    };

    ComponentWithI18n.displayName = `withI18n(${displayName})`;

    return ComponentWithI18n;
}

export function I18nProvider({
    children,
    defaultMessages,
    messages,
    locale,
}: PropsWithChildren<Props>): JSX.Element | null {
    const resolver = useMemo(
        () => resolveI18n(defaultMessages, messages, locale),
        [defaultMessages, messages, locale]
    );
    return <I18nContext.Provider value={resolver}>{children}</I18nContext.Provider>;
}
