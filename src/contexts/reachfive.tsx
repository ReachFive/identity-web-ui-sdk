import React, {
    ComponentType,
    ReactNode,
    Suspense,
    createContext,
    useContext,
    type PropsWithChildren,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import {
    QueryClient,
    QueryClientProvider,
    useSuspenseQueries,
    useSuspenseQuery,
} from '@tanstack/react-query';

import {
    ErrorResponse,
    type ConsentVersions,
    type Client as CoreClient,
    type Config as CoreConfig,
} from '@reachfive/identity-core';

import { ErrorText } from '../components/miscComponent';
import { UserError } from '../helpers/errors';
import { camelCaseProperties } from '../helpers/transformObjectProperties';

import type { I18nMessages } from '../core/i18n';
import type { Config } from '../types';

export interface ReachfiveContext {
    client: CoreClient;
    config: Config;
    i18n: I18nMessages;
}

export type WithConfig<P> = P & {
    config: Config;
};

export const ReachfiveContext = createContext<ReachfiveContext | undefined>(undefined);

export function useReachfive(): ReachfiveContext {
    const context = useContext(ReachfiveContext);
    if (!context) {
        throw new Error('No ReachfiveContext provided');
    }

    return context;
}

function adaptError(error: unknown): string {
    return error instanceof UserError
        ? error.message
        : ErrorResponse.isErrorResponse(error)
          ? (error.errorUserMsg ?? error.errorDescription ?? error.error)
          : error instanceof Error
            ? error.message
            : 'Unexpected error';
}

export interface ReachfiveProviderProps {
    /** ReachFive core client instance */
    client: CoreClient;
    /** Core configuration for ReachFive */
    config: CoreConfig;
    /** An alternate UI to render in place of the actual UI if it has not finished loading */
    fallback?: ReactNode;
}

/**
 * Provider component for ReachFive authentication context
 *
 * @example
 * ```tsx
 * import { createClient, type Config } from '@reachfive/identity-core';
 * import { ReachfiveProvider, Auth } from '@reachfive/identity-ui';
 *
 * const coreConfig: Config = { clientId: '####', domain: 'local.reach5.co' }
 *
 * const coreClient = createClient(coreConfig)
 *
 * <ReachfiveProvider client={coreClient} config={coreConfig} fallback={<Loading />}>
 *   <Auth />
 * </ReachfiveProvider>
 * ```
 */
export function ReachfiveProvider({
    children,
    client,
    config: coreConfig,
    fallback,
}: PropsWithChildren<ReachfiveProviderProps>) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    // @todo <ErrorText/> is not styled because not wrapped with ThemeProvider
    return (
        <QueryClientProvider client={queryClient}>
            <ErrorBoundary
                fallbackRender={({ error }) => <ErrorText>{adaptError(error)}</ErrorText>}
            >
                <Suspense fallback={fallback}>
                    <ConfigProvider client={client} coreConfig={coreConfig}>
                        {({ config, i18n }: { config: Config; i18n: I18nMessages }) => (
                            <ReachfiveContext.Provider value={{ client, config, i18n }}>
                                {children}
                            </ReachfiveContext.Provider>
                        )}
                    </ConfigProvider>
                </Suspense>
            </ErrorBoundary>
        </QueryClientProvider>
    );
}

function ConfigProvider({
    children: Children,
    client,
    coreConfig,
}: {
    children: ComponentType<{ config: Config; i18n: I18nMessages }>;
    client: CoreClient;
    coreConfig: CoreConfig;
}) {
    const { data: remoteSettings } = useSuspenseQuery({
        queryKey: ['remoteSettings'],
        queryFn: async () => {
            const remoteSettings = await client.remoteSettings;
            return camelCaseProperties(remoteSettings) as typeof remoteSettings;
        },
    });

    const language = coreConfig.language ?? remoteSettings.language;
    const resourceBaseUrl = remoteSettings.resourceBaseUrl;

    const [{ data: consentsVersions }, { data: i18n }] = useSuspenseQueries({
        queries: [
            {
                queryKey: ['config/consents', language],
                queryFn: async () => {
                    const consentsResponse = await fetch(
                        `https://${coreConfig.domain}/identity/v1/config/consents?lang=${language}`
                    );
                    const consentsVersions = await consentsResponse.json();
                    return camelCaseProperties(consentsVersions) as Record<string, ConsentVersions>;
                },
            },
            {
                queryKey: ['i18n', language],
                queryFn: async () => {
                    const i18nResponse = await fetch(`${resourceBaseUrl}/${language}.json`);
                    return (await i18nResponse.json()) as I18nMessages;
                },
            },
        ],
    });

    const config: Config = {
        ...coreConfig,
        ...remoteSettings,
        consentsVersions: camelCaseProperties(consentsVersions) as Record<string, ConsentVersions>,
        // countryCode: remoteSettings.countryCode ?? 'FR',
        language: language,
    };

    return <Children config={config} i18n={i18n} />;
}
