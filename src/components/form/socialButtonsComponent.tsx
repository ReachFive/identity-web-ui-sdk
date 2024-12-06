import React, { PropsWithChildren, useCallback } from 'react';
import type { AuthOptions } from '@reachfive/identity-core';
import styled, { useTheme } from 'styled-components';
import classes from 'classnames';

import { parseQueryString } from '../../helpers/queryString';

import { providers as socialProviders } from '../../providers/providers';
import type { Provider, ProviderId } from '../../providers/providers';

import { useReachfive } from '../../contexts/reachfive';

import { Button, type ButtonProps } from './buttonComponent';
import { useI18n } from '../../contexts/i18n';

interface SocialButtonIconProps {
    className?: classes.Argument
    icon: string
    textVisible?: boolean
}

const SocialButtonIcon = styled(({ className }: SocialButtonIconProps) => (
    <span className={classes(['r5-btn-social-icon', className])}></span>
))`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => !props.textVisible ? '100%' : (props.theme.socialButton.height - 2) + 'px'};
    box-sizing: border-box;
    border-radius: ${props => props.theme.socialButton.borderRadius - 1}px;
    background-image: url(${props => props.icon});
    background-repeat: no-repeat;
    background-size: ${props => props.theme.socialButton.height / 2}px ${props => props.theme.socialButton.height / 2}px;
    background-position: center center;

    ${props => !props.textVisible && 'height: 100%;'}
`;

const SocialButtonText = ({ children }: PropsWithChildren<{}>) => (
    <span className="r5-btn-social-text">
        {children}
    </span>
);

interface SocialBtn extends ButtonProps {
    provider: Provider
    inline: boolean
    textVisible: boolean
    width: string
    height: string
}

const SocialBtn = styled(Button).attrs<SocialBtn>(({ provider }) => {
    const i18n = useI18n()
    return {
        themePrefix: 'socialButton',
        color: provider.btnTextColor ?? '#ffffff',
        background: provider.btnBackgroundColor ?? provider.color,
        border: provider.btnBorderColor ?? provider.color,
        extendedClasses: classes(['r5-btn-social', `r5-btn-social-${provider.key}`]),
        title: i18n(`socialButton.${provider.key}.title`, undefined, () => provider.name)
    }
})<SocialBtn>`
    margin-bottom: ${props => props.theme.spacing}px;
    position: relative;

    width: ${props => props.width};
    height: ${props => props.height};

    ${props => props.inline && `
        display: inline-block;
        margin: 0 4px;
    `}

    ${props => props.inline && props.textVisible && `
        padding-left: ${props.theme.socialButton.paddingX + props.theme.socialButton.height / 2}px;
    `}

    font-weight: ${props => props.provider.fontWeight};
    font-family: ${props => props.provider.fontFamily};
`;

interface SocialButtonProps {
    provider: Provider
    onClick: (providerName: string) => void
    count: number
}

const SocialButton = ({ provider, onClick, count }: SocialButtonProps) => {
    const theme = useTheme()
    const i18n = useI18n()

    const inline = theme.socialButton.inline;
    const textVisible = theme.socialButton.textVisible;
    const height = theme.socialButton.height + 'px';

    const width = !textVisible
        ? theme.socialButton.height + 'px'
        : inline ? `calc(${100 / count}% - 8px)` : '100%';

    return <SocialBtn
        provider={provider}
        inline={inline}
        textVisible={textVisible}
        width={width}
        height={height}
        onClick={() => onClick(provider.key)}>
        <SocialButtonIcon icon={provider.icon} textVisible={textVisible} />
        {textVisible && <SocialButtonText>{i18n(`socialButton.${provider.key}.title`, undefined, () => provider.name)}</SocialButtonText>}
    </SocialBtn>;
};

export interface SocialButtonsProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Classname
     */
    className?: string
    /**
     * Lists the available social providers. This is an array of strings.
     * 
     * Tip: If you pass an empty array, social providers will not be displayed. 
     * */
    providers: string[]
}

export const SocialButtons = styled(({ auth, providers, className }: SocialButtonsProps) => {
    const coreClient = useReachfive()

    const clickHandler = useCallback(
        (provider: string) => coreClient.loginWithSocialProvider(provider, auth),
        [coreClient, auth],
    )

    const queryParams = parseQueryString(window.location.search.substring(1))
    return (
        <div className={classes(['r5-social-buttons', className])}>
            {providers.flatMap(providerKey => {
                const [providerName] = providerKey.split(':')
                if (providerName === 'bconnect' && queryParams.bconnectActivation !== 'true') return []
                else if (socialProviders[providerName as ProviderId] === undefined) {
                    console.error(`${providerName} provider not found.`)
                    return []
                }
                else return [
                    <SocialButton
                        provider={socialProviders[providerName as ProviderId]}
                        count={providers.length}
                        onClick={() => clickHandler(providerKey)}
                        key={providerKey}
                    />
                ]
            })}
        </div>
    )
})`
    text-align: center;
    ${props => props.theme.socialButton.inline && 'margin: 0 -4px'}
`;
