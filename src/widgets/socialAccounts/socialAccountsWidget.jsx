import React from 'react';

import styled from 'styled-components';
import difference from 'lodash-es/difference';

import * as providers from '../../providers/providers';

import { Card, CloseIcon } from '../../components/form/cardComponent';
import { Link, Info, Alternative } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { withGoTo, withI18n, withTheme } from '../../components/widget/widgetContext';

import SocialButtons from '../../components/form/socialButtonsComponent';
import { DefaultButton } from '../../components/form/buttonComponent';

const Fragment = React.Fragment;

const providersByKey = Object.keys(providers).reduce((acc, key) => ({ ...acc, [key]: providers[key] }), {});

const SocialIcon = withTheme(styled.span`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.theme.get('_blockInnerHeight')}px;
    box-sizing: border-box;
    background-image: url(${props => props.icon});
    background-repeat: no-repeat;
    background-size: ${props => props.theme.get('_absoluteLineHeight')}px ${props => props.theme.get('_absoluteLineHeight')}px;
    background-position: center center;
`);

const IdentityList = withI18n(withTheme(({ identities, onUnlink, i18n, theme }) => (
    <div>
        {identities.length === 0 && (
            <Info>{i18n('socialAccounts.noLinkedAccount')}</Info>
        )}
        {identities.map(({ provider, id, username }) => {
            const providerInfos = providersByKey[provider];
            return (
                <Card key={id}>
                    <SocialIcon icon={providerInfos.coloredIcon} />
                    <span>{providerInfos.name}</span>
                    &nbsp;
                    <span style={{ color: theme.get('mutedTextColor') }}>-&nbsp;{username}</span>
                    <CloseIcon title={i18n('remove')} onClick={() => onUnlink(id)} />
                </Card>
            );
        })}
    </div>
)));

const SocialAccounts = withGoTo(({ getAvailableProviders, identities, onUnlink, goTo, theme, i18n }) => (
    <Fragment>
        <IdentityList identities={identities} onUnlink={onUnlink} />
        {getAvailableProviders(identities).length > 0 && (
            <div style={{ marginTop: theme.get('spacing') }}>
                <DefaultButton onClick={() => goTo('link-account')}>
                    {i18n('socialAccounts.linkNewAccount')}
                </DefaultButton>
            </div>
        )}
    </Fragment>
));

const LinkAccount = withI18n(({ auth, accessToken, identities, getAvailableProviders, i18n }) => (
    <Fragment>
        <SocialButtons providers={getAvailableProviders(identities)} auth={{ ...auth, accessToken }} />
        <Alternative>
            <Link target="links">{i18n('back')}</Link>
        </Alternative>
    </Fragment>
));

export default createMultiViewWidget({
    initialView: 'links',
    views: {
        'links': SocialAccounts,
        'link-account': LinkAccount
    },
    prepare: (options, { config }) => ({
        auth: {},
        providers: config.socialProviders,
        ...options,
        getAvailableProviders: identities => {
            const providerNames = (options.providers || config.socialProviders).map(provider => provider.split(':').shift())
            return difference(providerNames, identities.map(i => i.provider))
        }
    }),
    initialState: {
        identities: []
    },
    onStartup: ({ accessToken, auth, apiClient }, setState) => {
        function refresh() {
            apiClient.getUser({
                accessToken,
                fields: 'social_identities{id,provider,username}'
            }).then(({ socialIdentities }) => setState({
                activeView: 'links',
                identities: socialIdentities
            }));
        }

        if (auth.popupMode) {
            apiClient.on('authenticated', refresh);
        }

        refresh();
    },
    handlers: ({ accessToken, apiClient }, setState) => ({
        onUnlink: identityId => {
            apiClient.unlink({ accessToken, identityId });

            // Optimistic update
            setState(({ identities }) => ({
                identities: identities.filter(i => i.id !== identityId)
            }));
        }
    })
});
