import React from 'react';

import styled from 'styled-components';
import classes from 'classnames';
import { compose, withHandlers } from '@hypnosphi/recompose';

import { parseQueryString } from '../../helpers/queryString';
import * as providers from '../../providers/providers';
import { withApiClient, withTheme } from '../widget/widgetContext';
import { Button } from './buttonComponent';

const queryParams = parseQueryString(window.location.search.substring(1))

const socialButtons = Object.keys(providers).reduce((acc, key) => ({ ...acc, [key]: providers[key] }), {});

const SocialButtonIcon = withTheme(styled(({ className }) => (
    <span className={classes(['r5-btn-social-icon', className])}></span>
))`
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => !props.textVisible ? '100%' : (props.theme.get('socialButton.height') - 2) + 'px'};
    box-sizing: border-box;
    border-radius: ${props => props.theme.get('socialButton.borderRadius') - 1}px;
    background-image: url(${props => props.icon});
    background-repeat: no-repeat;
    background-size: ${props => props.theme.get('socialButton.height') / 2}px ${props => props.theme.get('socialButton.height') / 2}px;
    background-position: center center;

    ${props => !props.textVisible && 'height: 100%;'}
`);

const SocialButtonText = ({ children }) => (
    <span className="r5-btn-social-text">
        {children}
    </span>
);

const SocialBtn = withTheme(styled(Button).attrs(props => {
    const { provider, inline } = props

    return {
        tagname: 'div',
        themePrefix: 'socialButton',
        color: provider.btnTextColor || '#ffffff',
        background: provider.btnBackgroundColor || provider.color,
        border: provider.btnBorderColor || provider.color,
        extendedClasses: classes(['r5-btn-social', `r5-btn-social-${provider.key}`]),
        title: inline && provider.name
    }
})`
    margin-bottom: ${props => props.theme.get('spacing')}px;
    position: relative;

    width: ${props => props.width};
    height: ${props => props.height};

    ${props => props.inline && `
        display: inline-block;
        margin: 0 4px;
    `}

    ${props => props.inline && props.textVisible && `
        padding-left: ${props.theme.get('socialButton.paddingX') + props.theme.get('socialButton.height') / 2}px;
    `}

    font-weight: ${props => props.provider.fontWeight};
    font-family: ${props => props.provider.fontFamily};
`);

const SocialButton = withTheme(({ provider, onClick, theme, count }) => {
    const inline = theme.get('socialButton.inline');
    const textVisible = theme.get('socialButton.textVisible');
    const height = theme.get('socialButton.height') + 'px';

    const width = !textVisible
        ? theme.get('socialButton.height') + 'px'
        : inline ? `calc(${100 / count}% - 8px)` : '100%';

    return <SocialBtn
        provider={provider}
        inline={inline}
        textVisible={textVisible}
        width={width}
        height={height}
        onClick={_ => onClick(provider.key)}>
        <SocialButtonIcon icon={provider.icon} textVisible={textVisible} />
        {textVisible && <SocialButtonText>{provider.name}</SocialButtonText>}
    </SocialBtn>;
});

const SocialButtons = styled(({ providers, clickHandler, className }) => (
    <div className={classes(['r5-social-buttons', className])}>
        {providers.flatMap(providerKey => {
            const [providerName, variant] = providerKey.split(':')
            if (providerName === 'bconnect' && queryParams['bconnectActivation'] !== 'true') return []
            else if (socialButtons[providerName] === undefined) {
                console.error(`${providerName} provider not found.`)
                return []
            }
            else return [
                <SocialButton
                    provider={socialButtons[providerName]}
                    count={providers.length}
                    onClick={() => clickHandler(providerKey)}
                    key={providerKey}
                />
            ]
        })}
    </div>
))`
    text-align: center;
    ${props => props.theme.get('socialButton.inline') && 'margin: 0 -4px'}
`;

export default compose(
    withTheme,
    withApiClient,
    withHandlers({
        clickHandler: ({ apiClient, auth }) =>
            provider => apiClient.loginWithSocialProvider(provider, auth)
    })
)(SocialButtons);
