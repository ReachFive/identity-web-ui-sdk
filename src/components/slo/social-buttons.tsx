import React from 'react';

import { AuthOptions } from '@reachfive/identity-core';

import { Button } from '@/components/ui/button';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useTheme } from '@/contexts/theme';
import { logError } from '@/helpers/logger';
import { cn, colorToHSL, pickByLightness, shadeColor } from '@/lib/utils';
import { findProvider } from '@/providers/providers';

import type { Provider } from '@/providers/providers';
import type { OnError, OnSuccess } from '@/types';

export type SocialButtonsProps = {
    /** List of authentication options. */
    auth?: AuthOptions;
    /** The social providers to display; an empty array displays none. */
    providers: string[];
    /** Callback function called when the request has succeeded. */
    onSuccess?: OnSuccess;
    /** Callback function called when the request has failed. */
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
    const { settings: themeSettings } = useTheme();

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
                themeSettings.socialButton.inline
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
    const { settings: themeSettings } = useTheme();

    // Provider colors are fallbacks for the `--r5-social-button-*` colors (@see core/themeVariables).
    const backgroundColor = provider.btnBackgroundColor ?? provider.color;
    const borderColor = provider.btnBorderColor ?? provider.color;
    const textColor =
        provider.btnTextColor ??
        `var(--r5-social-button-contrast-text, ${pickByLightness(backgroundColor, '#ffffff', '#000000')})`;
    // Brand color rather than background, which is white for some providers (Google).
    const focusRingColor = colorToHSL(provider.color);
    // Inline buttons are icon-only: a row of labelled buttons does not fit.
    const showLabel = !themeSettings.socialButton.inline;

    const label = i18n(`socialButton.${provider.key}.title`, {
        defaultValue: provider.buttonLabel ?? provider.name,
        // Bare brand name, so "Continue with {provider}" reads well whatever the provider's label.
        provider: provider.name,
    });

    return (
        <Button
            size={showLabel ? size : 'icon'}
            className={cn(
                `r5-btn-social r5-btn-social-${provider.key}`,
                showLabel
                    ? `grid grid-cols-[calc(var(--r5-button-text-size)*var(--r5-button-leading))_1fr_calc(var(--r5-button-text-size)*var(--r5-button-leading))] [&_svg]:size-[length:var(--r5-button-text-size)]`
                    : 'flex shrink-0 [&_svg]:size-6',
                className
            )}
            style={
                {
                    // Relayed from the `--r5-social-button-*` tokens, so CSS overrides reach them.
                    '--r5-button-height': 'var(--r5-social-button-height)',
                    '--r5-button-padding-x': 'var(--r5-social-button-padding-x)',
                    '--r5-button-padding-y': 'var(--r5-social-button-padding-y)',
                    '--r5-button-radius': 'var(--r5-social-button-radius)',
                    '--r5-button-text-size': 'var(--r5-social-button-text-size)',
                    '--r5-button-font-weight': 'var(--r5-social-button-font-weight)',
                    '--r5-button-leading': 'var(--r5-social-button-leading)',
                    '--r5-button-border-width': 'var(--r5-social-button-border-width)',
                    '--r5-button-shadow': 'var(--r5-social-button-shadow)',
                    '--r5-button-bg': `var(--r5-social-button-bg, ${backgroundColor})`,
                    '--r5-button-hover-bg': `var(--r5-social-button-hover-bg, ${shadeColor(backgroundColor)})`,
                    '--r5-button-text': `var(--r5-social-button-text, ${textColor})`,
                    '--r5-button-hover-text':
                        'var(--r5-social-button-hover-text, var(--r5-button-text))',
                    '--r5-button-border-color': `var(--r5-social-button-border-color, ${borderColor})`,
                    '--r5-button-hover-border-color': `var(--r5-social-button-hover-border-color, ${shadeColor(borderColor)})`,
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
