import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import difference from 'lodash-es/difference';

import * as providers from '../../providers/providers';

import { Link, Info, Alternative } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { withGoTo, withI18n, withTheme } from '../../components/widget/widgetContext';

import SocialButtons from '../../components/form/socialButtonsComponent';
import { DefaultButton } from '../../components/form/buttonComponent';

const Fragment = React.Fragment;

const providersByKey = Object.keys(providers).reduce((acc, key) => ({ ...acc, [key]: providers[key] }), {});

const CloseIcon = withTheme(styled.span`
    position: absolute;
    right: ${({ theme }) => theme.get('paddingY')}px;
    top: ${({ theme }) => theme.get('paddingY')}px;
    width: ${({ theme }) => theme.get('_absoluteLineHeight')}px;
    height: ${({ theme }) => theme.get('_absoluteLineHeight')}px;
    cursor: pointer;
    box-sizing: border-box;
    overflow: hidden;
    &:hover {
        &::before, &::after {
            background: ${props => darken(0.2, props.theme.get('mutedTextColor'))};
        }
    }

    &::before, &::after {
        content: '';
        position: absolute;
        height: 3px;
        width: 75%;
        top: 50%;
        left: 0;
        margin-top: -1px;
        background: ${props => props.theme.get('mutedTextColor')};
        background-position: center center;
    }
    &::before {
        transform: rotate(45deg);
    }
    &::after {
        transform: rotate(-45deg);
    }
`);

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

const Identity = withTheme(styled.div`
    padding: ${({ theme }) => theme.get('paddingY')}px ${({ theme }) => theme.get('_blockInnerHeight')}px;
    border: ${({ theme }) => theme.get('borderWidth')}px solid ${({ theme }) => theme.get('borderColor')};
    color: ${({ theme }) => theme.get('textColor')};
    box-sizing: border-box;
    white-space: nowrap;
    vertical-align: middle;
    position: relative;

    &:only-child {
        border-radius: ${({ theme }) => theme.get('borderRadius')}px;
    }

    &:not(:only-child) {
        &:first-child {
            border-radius: ${({ theme }) => theme.get('borderRadius')}px ${({ theme }) => theme.get('borderRadius')}px 0 0;
        }

        &:last-child {
            border-radius: 0 0 ${({ theme }) => theme.get('borderRadius')}px ${({ theme }) => theme.get('borderRadius')}px;
        }

        &:not(:last-child) {
            border-bottom-width: 0;
        }

    }
`);

const IdentityList = withI18n(withTheme(({ identities, onUnlink, i18n, theme }) => (
    <div>
        {identities.length === 0 && (
            <Info>{i18n('socialAccounts.noLinkedAccount')}</Info>
        )}
        {identities.map(({ provider, id, username }) => {
            const providerInfos = providersByKey[provider];
            return (
                <Identity key={id}>
                    <SocialIcon icon={providerInfos.coloredIcon} />
                    <span>{providerInfos.name}</span>
                    &nbsp;
                    <span style={{ color: theme.get('mutedTextColor') }}>-&nbsp;{username}</span>
                    <CloseIcon title={i18n('remove')} onClick={() => onUnlink(id)} />
                </Identity>
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

const LinkAccount = withI18n(({ auth, accessToken, providers, identities, getAvailableProviders, i18n }) => (
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
        getAvailableProviders: identities => difference(options.providers || config.socialProviders, identities.map(i => i.provider))
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
