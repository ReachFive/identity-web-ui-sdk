import React from 'react';

import { useTheme } from 'styled-components';

import { AuthOptions } from '@reachfive/identity-core';

import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { composableShadow } from '@/core/themeVariables';
import { logError } from '@/helpers/logger';
import { cn, colorToHSL, pickByLightness, shadeColor } from '@/lib/utils';
import { findProvider } from '@/providers/providers';

import type { Provider } from '@/providers/providers';
import type { OnError, OnSuccess } from '@/types';

export type SocialButtonsProps = {
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    providers: string[];
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
};

const SocialButtons = ({
    auth,
    className,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
    providers,
    ...props
}: SocialButtonsProps & React.HTMLAttributes<HTMLDivElement>) => {
    const coreClient = useReachfive();
    const { customProviders } = useConfig();
    const theme = useTheme();

    const clickHandler = async (provider: string) => {
        try {
            await coreClient.loginWithSocialProvider(provider, auth);
            onSuccess({
                name: 'login',
                authResult: { providerName: provider },
                authType: 'social',
            });
        } catch (error) {
            onError(error);
        }
    };

    return (
        <div
            className={cn(
                'r5-social-buttons',
                'flex gap-2',
                theme.socialButton.inline
                    ? 'flex-row items-center justify-center'
                    : 'flex-col items-stretch',
                className
            )}
            {...props}
        >
            {providers.flatMap(providerKey => {
                const [providerName] = providerKey.split(':');
                const provider = findProvider(providerName, customProviders);
                if (!provider) {
                    logError(`${providerName} provider not found.`);
                    return [];
                }
                return [
                    <SocialButton
                        key={providerKey}
                        provider={provider}
                        onClick={() => void clickHandler(providerKey)}
                    />,
                ];
            })}
        </div>
    );
};

type SocialButtonProps = {
    provider: Provider;
};

const SocialButton = ({
    className,
    provider,
    size,
    ...props
}: SocialButtonProps & React.ComponentProps<typeof Button>) => {
    const i18n = useI18n();
    const theme = useTheme();

    const backgroundColor =
        theme.socialButton.background ?? provider.btnBackgroundColor ?? provider.color;
    const hoverBackgroundColor = theme.socialButton.hoverBackground ?? shadeColor(backgroundColor);
    const textColor =
        theme.socialButton.color ??
        provider.btnTextColor ??
        pickByLightness(backgroundColor, '#ffffff', '#000000');
    const hoverTextColor = theme.socialButton.hoverColor ?? textColor;
    const borderColor = theme.socialButton.borderColor ?? provider.btnBorderColor ?? provider.color;
    const hoverBorderColor = theme.socialButton.hoverBorderColor ?? shadeColor(borderColor);
    // The focus ring is keyed to the provider's brand color rather than to the widget-wide
    // `input.focusBorderColor`, so it relates to the button it sits on. `provider.color` is used
    // instead of the resolved background because the latter is white for some providers (Google),
    // which would leave the ring invisible.
    const focusRingColor = colorToHSL(provider.color);
    // The label is hidden exactly when the buttons are laid out inline: a row of labelled
    // buttons does not fit. `inline` is the single switch for both.
    const showLabel = !theme.socialButton.inline;

    const label = i18n(`socialButton.${provider.key}.title`, {
        defaultValue: provider.buttonLabel ?? provider.name,
        // `name` stays the bare brand name, so "Continue with {provider}" reads
        // correctly even for providers whose own label is a full sentence
        provider: provider.name,
    });

    return (
        <Button
            size={showLabel ? size : 'icon'}
            className={cn(
                `r5-btn-social r5-btn-social-${provider.key}`,
                `[&_svg]:size-[length:var(--r5-button-text-size)]`,
                showLabel
                    ? `grid grid-cols-[calc(var(--r5-button-text-size)*var(--r5-button-leading))_1fr_calc(var(--r5-button-text-size)*var(--r5-button-leading))]`
                    : 'flex',
                className
            )}
            style={
                {
                    '--r5-button-height': `${theme.socialButton.height}px`,
                    '--r5-button-padding-x': `${theme.socialButton.paddingX}px`,
                    '--r5-button-padding-y': `${theme.socialButton.paddingY}px`,
                    '--r5-button-radius': `${theme.socialButton.borderRadius}px`,
                    '--r5-button-text-size': `${theme.socialButton.fontSize}px`,
                    '--r5-button-font-weight': theme.socialButton.fontWeight,
                    '--r5-button-leading': theme.socialButton.lineHeight,
                    '--r5-button-border-width': `${theme.socialButton.borderWidth}px`,
                    '--r5-button-shadow': composableShadow(`${theme.socialButton.boxShadow}`),
                    '--r5-button-text': textColor,
                    '--r5-button-hover-text': hoverTextColor,
                    '--r5-button-bg': backgroundColor,
                    '--r5-button-hover-bg': hoverBackgroundColor,
                    '--r5-button-border-color': borderColor,
                    '--r5-button-hover-border-color': hoverBorderColor,
                    '--ring': focusRingColor,
                } as React.CSSProperties
            }
            title={label}
            {...props}
        >
            <ProviderIcon href={provider.icon} />
            {showLabel && <span className="r5-btn-social-text">{label}</span>}
        </Button>
    );
};

const ProviderIcon = ({
    className,
    href,
    ...props
}: { href: string } & React.SVGAttributes<SVGElement>) => {
    return (
        <svg
            viewBox="0 0 24 24"
            preserveAspectRatio="xMinYMin meet"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('r5-btn-social-icon', className)}
            {...props}
        >
            <image href={href} height="24" width="24" />
        </svg>
    );
};

export { SocialButtons, SocialButton };
