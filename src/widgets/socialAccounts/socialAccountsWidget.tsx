import React, { Fragment, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import difference from 'lodash-es/difference';
import { AuthOptions, Identity as CoreIdentity, Profile } from '@reachfive/identity-core';

import { UserError } from '../../helpers/errors';

import { ProviderId, providers as socialProviders } from '../../providers/providers';

import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

import { ErrorMessage } from '../../components/error';
import { Card, CloseIcon } from '../../components/form/cardComponent';
import { Link, Info, Alternative } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import { DefaultButton } from '../../components/form/buttonComponent';

type Identity = CoreIdentity & { id: string }

type Unlink = (id: string) => Promise<void>

interface WithIdentitiesProps {
    accessToken: string
    auth?: AuthOptions
    identities?: Identity[]
    unlink: Unlink
}

function findAvailableProviders(providers: string[], identities: Identity[]): string[] {
    return difference(
        providers.map(provider => provider.split(':').shift()).filter((name): name is string => !!name),
        identities.map(i => i.provider)
    )
} 

const withIdentities = <T extends WithIdentitiesProps = WithIdentitiesProps>(
    WrappedComponent: React.ComponentType<T>
) => {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || "Component";
  
    const ComponentWithIdentities = (props: Omit<T, 'identities' | 'unlink'>) => {
        const coreClient = useReachfive()
        const { goTo } = useRouting()
        const [identities, setIdentities] = useState<Identity[]>([])

        const { accessToken, auth, ...componentProps } = props

        const refresh = useCallback(() => {
            coreClient
                .getUser({
                    accessToken: accessToken,
                    fields: 'social_identities{id,provider,username}'
                })
                .then(({ socialIdentities }: Profile) => {
                    setIdentities(socialIdentities as Identity[])
                });
        }, [accessToken, coreClient])

        const unlink = useCallback((identityId: string) => {
            const prevIdentities = identities
            // Optimistic update
            setIdentities(identities.filter(i => i.id !== identityId))
            // api call + catch failure
            return coreClient.unlink({ accessToken, identityId }).catch(error => {
                // restore previous identities
                setIdentities(prevIdentities)
                return Promise.reject(error)
            })
        }, [accessToken, coreClient, identities])

        const handleAuthenticated = useCallback(() => {
            refresh()
            goTo('links')
        }, [goTo, refresh])

        useEffect(() => {
            if (auth?.popupMode) {
                coreClient.on('authenticated', handleAuthenticated);
            }
            refresh();
            return () => coreClient.off('authenticated', handleAuthenticated)
        }, [coreClient, auth, handleAuthenticated, refresh])
        
        return <WrappedComponent {...(componentProps as T)} identities={identities} unlink={unlink} />;
    };
  
    ComponentWithIdentities.displayName = `withIdentities(${displayName})`;
  
    return ComponentWithIdentities;
}

const SocialIcon = styled.span<{ icon: string }>`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.theme._blockInnerHeight}px;
    box-sizing: border-box;
    background-image: url(${props => props.icon});
    background-repeat: no-repeat;
    background-size: ${props => props.theme._absoluteLineHeight}px ${props => props.theme._absoluteLineHeight}px;
    background-position: center center;
`;


const MutedText = styled.span`
    color: ${props => props.theme.mutedTextColor}
`

interface IdentityListProps {
    identities?: Identity[]
    unlink: Unlink
}

const IdentityList = ({ identities = [], unlink }: IdentityListProps) => {
    const i18n = useI18n()
    const [error, setError] = useState<UserError | undefined>()

    const onRemove = (id: string) => {
        unlink(id)
            .then(() => setError(undefined))
            .catch(error => setError(UserError.fromAppError(error)))
    }

    return (
        <div>
            {identities.length === 0 && (
                <Info>{i18n('socialAccounts.noLinkedAccount')}</Info>
            )}
            {error && <ErrorMessage style={{ marginBottom: '10px' }}>{error.message}</ErrorMessage>}
            {identities.map(({ provider, id, username }) => {
                const providerInfos = socialProviders[provider as ProviderId];
                return (
                    <Card key={id} data-testid={`identity-${provider}`}>
                        <SocialIcon icon={providerInfos.icon} />
                        <span>{providerInfos.name}</span>
                        &nbsp;
                        <MutedText>-&nbsp;{username}</MutedText>
                        <CloseIcon title={i18n('remove')} onClick={() => onRemove(id)} />
                    </Card>
                );
            })}
        </div>
    )
}

const AvailableProvider = styled.div`
    margin-top: ${props => props.theme.spacing}px;
`

interface SocialAccountsProps {
    accessToken: string
    auth?: AuthOptions
    identities?: Identity[]
    providers: string[]
    unlink: Unlink
}

const SocialAccounts = withIdentities(({ identities = [], providers, unlink }: SocialAccountsProps) => {
    const i18n = useI18n()
    const { goTo } = useRouting()
    const availableProviders = findAvailableProviders(providers, identities)
    return (
        <Fragment>
            <IdentityList identities={identities} unlink={unlink} />
            {availableProviders.length > 0 && (
                <AvailableProvider>
                    <DefaultButton onClick={() => goTo('link-account')}>
                        {i18n('socialAccounts.linkNewAccount')}
                    </DefaultButton>
                </AvailableProvider>
            )}
        </Fragment>
    )
});

interface LinkAccountProps {
    accessToken: string
    auth?: AuthOptions
    identities?: Identity[]
    providers: string[]
    unlink: Unlink
}

const LinkAccount = withIdentities(({ auth, accessToken, identities = [], providers }: LinkAccountProps) => {
    const i18n = useI18n()
    const availableProviders = findAvailableProviders(providers, identities)
    return (
        <Fragment>
            <SocialButtons providers={availableProviders} auth={{ ...auth, accessToken }} />
            <Alternative>
                <Link target="links">{i18n('back')}</Link>
            </Alternative>
        </Fragment>
    )
});

export interface SocialAccountsWidgetProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Lists the available social providers. This is an array of strings.
     * 
     * Tip: If you pass an empty array, social providers will not be displayed. 
     * */
    providers?: string[]
}

interface SocialAccountsWidgetPropsPrepared extends 
    Omit<SocialAccountsProps, 'identities' | 'unlink'>, // indentities and unlink are injected by HoC `withIdentity`
    Omit<LinkAccountProps, 'identities' | 'unlink'>
    {}

export default createMultiViewWidget<SocialAccountsWidgetProps, SocialAccountsWidgetPropsPrepared>({
    initialView: 'links',
    views: {
        'links': SocialAccounts,
        'link-account': LinkAccount
    },
    prepare: (options, { config }) => ({
        providers: options.providers || (config.socialProviders as string[]),
        ...options,
    }),
});
