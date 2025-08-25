import React, { Fragment, useCallback, useEffect, useState } from 'react';

import styled from 'styled-components';

import { AuthOptions, Identity, Profile } from '@reachfive/identity-core';

import { PrimaryButton } from '../../components/form/buttonComponent';
import { Card, CloseIcon } from '../../components/form/cardComponent';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import { Alternative, ErrorText, Info, Link, MutedText } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { UserError } from '../../helpers/errors';
import { ProviderId, providers as socialProviders } from '../../providers/providers';

import type { OnError, OnSuccess } from '../../types';

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
        const { client: coreClient } = useReachfive();
        const { goTo } = useRouting();
        const [identities, setIdentities] = useState<Identity[]>([]);

        const refresh = useCallback(() => {
            coreClient
                .getUser({
                    accessToken: props.accessToken,
                    fields: 'social_identities{id,provider,username}',
                })
                .then(({ socialIdentities }: Profile) => setIdentities(socialIdentities))
                .catch(props.onError);
        }, [props.accessToken, coreClient]);

        const unlink = useCallback(
            (identityId: string) => {
                const prevIdentities = identities;
                // Optimistic update
                setIdentities(identities.filter(i => i.id !== identityId));
                // api call + catch failure
                return coreClient
                    .unlink({ accessToken: props.accessToken, identityId })
                    .then(() => props.onSuccess?.({ name: 'unlink', identityId }))
                    .catch(error => {
                        props.onError?.(error);
                        // restore previous identities
                        setIdentities(prevIdentities);
                        return Promise.reject(error);
                    });
            },
            [props.accessToken, coreClient, identities]
        );

        const handleAuthenticated = useCallback(() => {
            refresh();
            goTo('links');
        }, [goTo, refresh]);

        useEffect(() => {
            if (props.auth?.popupMode) {
                coreClient.on('authenticated', handleAuthenticated);
            }
            refresh();
            return () => coreClient.off('authenticated', handleAuthenticated);
        }, [coreClient, props.auth, handleAuthenticated, refresh]);

        return <WrappedComponent {...(props as T)} identities={identities} unlink={unlink} />;
    };

    ComponentWithIdentities.displayName = `withIdentities(${displayName})`;

    return ComponentWithIdentities;
};

const SocialIcon = styled.span<{ icon: string }>`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.theme._blockInnerHeight}px;
    box-sizing: border-box;
    background-image: url(${props => props.icon});
    background-repeat: no-repeat;
    background-size: ${props => props.theme._absoluteLineHeight}px
        ${props => props.theme._absoluteLineHeight}px;
    background-position: center center;
`;

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
    const [error, setError] = useState<UserError | undefined>();

    const onRemove = (id: string) => {
        unlink(id)
            .then(() => setError(undefined))
            .catch(error => {
                onError(error);
                setError(UserError.fromAppError(error));
            });
    };

    return (
        <div>
            {identities.length === 0 && <Info>{i18n('socialAccounts.noLinkedAccount')}</Info>}
            {error && (
                <ErrorText style={{ marginBottom: '10px', textAlign: 'center' }}>
                    {error.message}
                </ErrorText>
            )}
            {identities.map(({ provider, id, username }) => {
                const providerInfos = socialProviders[provider as ProviderId];
                return (
                    <Card key={id} data-testid={`identity-${provider}`}>
                        <SocialIcon icon={providerInfos.icon} />
                        <span>{providerInfos.name}</span>
                        &nbsp;
                        <MutedText>-&nbsp;{username}</MutedText>
                        <CloseIcon
                            title={i18n('remove')}
                            onClick={() => onRemove(id!)}
                            data-testid={`identity-${provider}-unlink`}
                        />
                    </Card>
                );
            })}
        </div>
    );
};

const AvailableProvider = styled.div`
    margin-top: ${props => props.theme.spacing}px;
`;

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
            <Fragment>
                <IdentityList identities={identities} unlink={unlink} />
                {availableProviders.length > 0 && (
                    <AvailableProvider>
                        <PrimaryButton onClick={() => goTo('link-account')}>
                            {i18n('socialAccounts.linkNewAccount')}
                        </PrimaryButton>
                    </AvailableProvider>
                )}
            </Fragment>
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
                    <Link target="links">{i18n('back')}</Link>
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
    extends Omit<SocialAccountsProps, 'identities' | 'unlink'>, // indentities and unlink are injected by HoC `withIdentity`
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
