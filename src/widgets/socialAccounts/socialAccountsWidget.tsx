import React, { Fragment, useCallback, useEffect, useState } from 'react';

import { AlertTriangleIcon, XIcon } from 'lucide-react';

import { AuthOptions, Identity } from '@reachfive/identity-core';

import { Alternative } from '@/components/miscComponent';
import { SocialButtons } from '@/components/slo/social-buttons';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { createMultiViewWidget } from '@/components/widget/widget';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useRouting } from '@/contexts/routing';
import { isAppError, UserError } from '@/helpers/errors';
import { logError } from '@/helpers/logger';
import { type Provider, ProviderId, providers as builtInProviders } from '@/providers/providers';

import type { OnError, OnSuccess } from '@/types';

type Unlink = (id: string) => Promise<void>;

interface WithIdentitiesProps {
    accessToken: string;
    auth?: AuthOptions;
    identities?: Identity[];
    unlink: Unlink;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

function findAvailableProviders(providers: string[], identities: Identity[]): string[] {
    return providers.filter(provider => {
        const providerName = provider.split(':').shift();
        return identities.findIndex(i => i.provider == providerName) == -1;
    });
}

const withIdentities = <T extends WithIdentitiesProps = WithIdentitiesProps>(
    WrappedComponent: React.ComponentType<T>
) => {
    const displayName = WrappedComponent.displayName ?? WrappedComponent.name ?? 'Component';

    const ComponentWithIdentities = (props: Omit<T, 'identities' | 'unlink'>) => {
        const coreClient = useReachfive();
        const { goTo } = useRouting();
        const [identities, setIdentities] = useState<Identity[]>([]);

        const refresh = useCallback(async () => {
            try {
                const { socialIdentities } = await coreClient.getUser({
                    accessToken: props.accessToken,
                    fields: 'social_identities{id,provider,username}',
                });
                setIdentities(socialIdentities);
            } catch (error) {
                props.onError?.(error);
            }
        }, [props.accessToken, coreClient]);

        const unlink = useCallback(
            async (identityId: string) => {
                const prevIdentities = identities;
                // Optimistic update
                setIdentities(identities.filter(i => i.id !== identityId));
                // api call + catch failure
                try {
                    await coreClient.unlink({ accessToken: props.accessToken, identityId });
                    props.onSuccess?.({ name: 'unlink', identityId });
                } catch (error) {
                    props.onError?.(error);
                    // restore previous identities
                    setIdentities(prevIdentities);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    return Promise.reject(error);
                }
            },
            [props.accessToken, coreClient, identities]
        );

        const handleAuthenticated = useCallback(() => {
            void refresh();
            goTo('links');
        }, [goTo, refresh]);

        useEffect(() => {
            if (props.auth?.popupMode) {
                coreClient.on('authenticated', handleAuthenticated);
            }
            void refresh();
            return () => coreClient.off('authenticated', handleAuthenticated);
        }, [coreClient, props.auth, handleAuthenticated, refresh]);

        return <WrappedComponent {...(props as T)} identities={identities} unlink={unlink} />;
    };

    ComponentWithIdentities.displayName = `withIdentities(${displayName})`;

    return ComponentWithIdentities;
};

interface IdentityListProps {
    identities?: Identity[];
    unlink: Unlink;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

const IdentityList = ({
    identities = [],
    onError = (() => {}) as OnError,
    unlink,
}: IdentityListProps) => {
    const i18n = useI18n();
    const { customProviders } = useConfig();
    const [error, setError] = useState<UserError | undefined>();

    const onRemove = async (id: string) => {
        try {
            await unlink(id);
            setError(undefined);
        } catch (error) {
            onError(error);
            if (isAppError(error)) {
                setError(UserError.fromAppError(error));
            }
        }
    };

    return (
        <ItemGroup className="gap-2">
            {identities.length === 0 && (
                <Item>
                    <ItemContent>
                        <ItemTitle>{i18n('socialAccounts.noLinkedAccount')}</ItemTitle>
                    </ItemContent>
                </Item>
            )}
            {error && (
                <Item>
                    <ItemMedia>
                        <AlertTriangleIcon className="text-destructive-foreground" />
                    </ItemMedia>
                    <ItemContent>
                        <ItemTitle className="text-destructive-foreground">
                            {error.message}
                        </ItemTitle>
                    </ItemContent>
                </Item>
            )}
            {identities.flatMap(({ provider, id, username }) => {
                const providerInfos: Provider | undefined =
                    builtInProviders[provider as ProviderId] ?? customProviders?.[provider];
                if (!providerInfos) {
                    logError(`${provider} provider not found.`);
                    return [];
                }
                return (
                    <Item
                        variant="outline"
                        className="flex-nowrap gap-2 sm:gap-4 p-2 sm:p-4"
                        key={id}
                        data-testid={`identity-${provider}`}
                    >
                        <ItemMedia
                            className="size-10 rounded-md"
                            style={{
                                backgroundColor:
                                    providerInfos.btnBackgroundColor ?? providerInfos.color,
                            }}
                        >
                            <img
                                src={providerInfos.icon}
                                alt=""
                                // providers with an explicit btnBackgroundColor ship a
                                // self-contained icon (e.g. Google); others (e.g. LinkedIn)
                                // ship a glyph meant to sit inset on their brand color
                                className={providerInfos.btnBackgroundColor ? 'size-10' : 'size-6'}
                            />
                        </ItemMedia>
                        <ItemContent className="min-w-0">
                            <ItemTitle>{providerInfos.name}</ItemTitle>
                            <ItemDescription className="line-clamp-1 truncate">
                                {username}
                            </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="rounded-full hover:bg-destructive hover:text-destructive-foreground size-6 sm:size-[var(--r5-button-height)]"
                                onClick={() => void onRemove(id!)}
                                aria-label={`${i18n('remove')} ${providerInfos.name}`}
                            >
                                <XIcon />
                                <span className="sr-only">
                                    {i18n('remove')} {providerInfos.name}
                                </span>
                            </Button>
                        </ItemActions>
                    </Item>
                );
            })}
        </ItemGroup>
    );
};

interface SocialAccountsProps {
    accessToken: string;
    auth?: AuthOptions;
    identities?: Identity[];
    providers: string[];
    unlink: Unlink;
}

const SocialAccounts = withIdentities(
    ({ identities = [], providers, unlink }: SocialAccountsProps) => {
        const i18n = useI18n();
        const { goTo } = useRouting();
        const availableProviders = findAvailableProviders(providers, identities);
        return (
            <div className="space-y-4">
                <IdentityList identities={identities} unlink={unlink} />
                {availableProviders.length > 0 && (
                    <div className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => goTo('link-account')}
                        >
                            {i18n('socialAccounts.linkNewAccount')}
                        </Button>
                    </div>
                )}
            </div>
        );
    }
);

interface LinkAccountProps {
    accessToken: string;
    auth?: AuthOptions;
    identities?: Identity[];
    providers: string[];
    unlink: Unlink;
    onSuccess?: OnSuccess;
    onError?: OnError;
}

const LinkAccount = withIdentities(
    ({ auth, accessToken, identities = [], providers, onSuccess, onError }: LinkAccountProps) => {
        const i18n = useI18n();
        const { goTo } = useRouting();
        const availableProviders = findAvailableProviders(providers, identities);
        return (
            <Fragment>
                <SocialButtons
                    providers={availableProviders}
                    auth={{ ...auth, accessToken }}
                    onSuccess={onSuccess}
                    onError={onError}
                />
                <Alternative>
                    <Button variant="outline" className="w-full" onClick={() => goTo('links')}>
                        {i18n('back')}
                    </Button>
                </Alternative>
            </Fragment>
        );
    }
);

export interface SocialAccountsWidgetProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    providers?: string[];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

interface SocialAccountsWidgetPropsPrepared
    extends
        Omit<SocialAccountsProps, 'identities' | 'unlink'>, // indentities and unlink are injected by HoC `withIdentity`
        Omit<LinkAccountProps, 'identities' | 'unlink'> {}

export default createMultiViewWidget<SocialAccountsWidgetProps, SocialAccountsWidgetPropsPrepared>({
    initialView: 'links',
    views: {
        links: SocialAccounts,
        'link-account': LinkAccount,
    },
    prepare: (options, { config }) => ({
        providers: options.providers ?? config.socialProviders,
        ...options,
    }),
});
