/**
 * @jest-environment jsdom
 */
import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';

import { type Client } from '@reachfive/identity-core';

import { SocialButtons } from '../../../src/components/slo/social-buttons';
import { ConfigProvider } from '../../../src/contexts/config';
import { I18nProvider, type I18nMessages } from '../../../src/contexts/i18n';
import { ReachfiveProvider } from '../../../src/contexts/reachfive';
import { buildTheme } from '../../../src/core/theme';
import { type Provider } from '../../../src/providers/providers';

import type { Config } from '../../../src/types';
import type { ThemeOptions } from '../../../src/types/styled';

const customProvider: Provider = {
    key: 'my-idp',
    name: 'My IdP',
    color: '#4c1d95',
    icon: 'my-idp.svg',
};

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'en',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google', 'my-idp'],
    customProviders: { 'my-idp': customProvider },
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
    loginTypeAllowed: {
        email: true,
        phoneNumber: true,
        customIdentifier: true,
    },
    isImplicitFlowForbidden: false,
};

const loginWithSocialProvider = jest.fn<Client['loginWithSocialProvider']>();

// @ts-expect-error partial Client
const apiClient: Client = { loginWithSocialProvider };

type RenderOptions = {
    config?: Partial<Config>;
    i18n?: I18nMessages;
    theme?: ThemeOptions;
};

function renderSocialButtons(
    props: React.ComponentProps<typeof SocialButtons>,
    { config = {}, i18n = {}, theme = {} }: RenderOptions = {}
) {
    const mergedConfig = { ...defaultConfig, ...config };
    return render(
        <ConfigProvider config={mergedConfig}>
            <ReachfiveProvider client={apiClient}>
                <ThemeProvider theme={buildTheme(theme)}>
                    <I18nProvider defaultMessages={i18n} locale={mergedConfig.language}>
                        <SocialButtons {...props} />
                    </I18nProvider>
                </ThemeProvider>
            </ReachfiveProvider>
        </ConfigProvider>
    );
}

/** Reads a CSS custom property off the element inline style (jsdom does not resolve them). */
function cssVar(element: HTMLElement, property: string): string {
    return element.style.getPropertyValue(property);
}

function getSocialButton(name: string): HTMLElement {
    return screen.getByTitle(name);
}

/* eslint-disable testing-library/no-node-access --
 * the wrapper, the provider icon and the label carry no accessible role of their own,
 * so class-based queries are the only way to assert how they are rendered. */
const getSocialButtonsContainer = (container: HTMLElement) =>
    container.querySelector('.r5-social-buttons');

const getProviderIcon = (button: HTMLElement) => button.querySelector('.r5-btn-social-icon');

const getProviderIconImage = (button: HTMLElement) =>
    button.querySelector('.r5-btn-social-icon image');

const getSocialButtonLabel = (button: HTMLElement) => button.querySelector('.r5-btn-social-text');
/* eslint-enable testing-library/no-node-access */

beforeEach(() => {
    loginWithSocialProvider.mockClear();
    loginWithSocialProvider.mockResolvedValue({});
});

describe('rendering', () => {
    test('renders one button per provider, built-in and custom', () => {
        renderSocialButtons({ providers: ['facebook', 'google', 'my-idp'] });

        expect(screen.getAllByRole('button')).toHaveLength(3);
        expect(getSocialButton('Facebook')).toBeInTheDocument();
        expect(getSocialButton('Google')).toBeInTheDocument();
        expect(getSocialButton('My IdP')).toBeInTheDocument();
    });

    test('tags the container and each button with their r5 class names', () => {
        const { container } = renderSocialButtons({ providers: ['facebook', 'my-idp'] });

        expect(getSocialButtonsContainer(container)).toBeInTheDocument();
        expect(getSocialButton('Facebook')).toHaveClass('r5-btn-social', 'r5-btn-social-facebook');
        expect(getSocialButton('My IdP')).toHaveClass('r5-btn-social', 'r5-btn-social-my-idp');
    });

    test('renders the provider icon', () => {
        renderSocialButtons({ providers: ['my-idp'] });

        const icon = getProviderIconImage(getSocialButton('My IdP'));
        expect(icon).toHaveAttribute('href', customProvider.icon);
    });

    test('renders nothing for an unknown provider', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

        renderSocialButtons({ providers: ['facebook', 'unknown'] });

        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(consoleError).toHaveBeenCalledWith('unknown provider not found.');

        consoleError.mockRestore();
    });

    test('resolves a variant key (provider:variant) to its base provider', async () => {
        const user = userEvent.setup();

        renderSocialButtons({ providers: ['google:custom-variant'] });

        const button = getSocialButton('Google');
        expect(button).toHaveClass('r5-btn-social-google');

        // the full key, variant included, is the one sent to the core client
        await user.click(button);
        expect(loginWithSocialProvider).toHaveBeenCalledWith('google:custom-variant', undefined);
    });

    test('prefers the provider buttonLabel over its name for the button text', () => {
        renderSocialButtons({ providers: ['apple'] });

        // Apple's HIG requires "Sign in with Apple", while `name` stays the bare brand name
        const button = getSocialButton('Sign in with Apple');
        expect(button).toHaveTextContent('Sign in with Apple');
    });

    test('interpolates the bare provider name, not its buttonLabel', () => {
        renderSocialButtons(
            { providers: ['apple'] },
            { i18n: { socialButton: { apple: { title: 'Continue with {provider}' } } } }
        );

        // never "Continue with Sign in with Apple"
        expect(getSocialButton('Continue with {provider}')).toHaveTextContent(
            'Continue with Apple'
        );
    });

    test('translates the button label and title', () => {
        renderSocialButtons(
            { providers: ['facebook'] },
            {
                i18n: {
                    socialButton: {
                        facebook: { title: 'Continue with {provider}' },
                    },
                },
            }
        );

        // the title is resolved without the `provider` interpolation variable
        const button = getSocialButton('Continue with {provider}');
        expect(button).toHaveTextContent('Continue with Facebook');
    });

    test('calls onSuccess when the login succeeds', async () => {
        const user = userEvent.setup();
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const auth = { redirectUri: 'http://localhost/callback' };

        renderSocialButtons({ providers: ['facebook'], auth, onSuccess, onError });

        await user.click(getSocialButton('Facebook'));

        expect(loginWithSocialProvider).toHaveBeenCalledWith('facebook', auth);
        expect(onSuccess).toHaveBeenCalledWith({
            name: 'login',
            authResult: { providerName: 'facebook' },
            authType: 'social',
        });
        expect(onError).not.toHaveBeenCalled();
    });

    test('calls onError when the login fails', async () => {
        const user = userEvent.setup();
        const onSuccess = jest.fn();
        const onError = jest.fn();
        const error = { error: 'Unexpected error' };
        loginWithSocialProvider.mockRejectedValue(error);

        renderSocialButtons({ providers: ['facebook'], onSuccess, onError });

        await user.click(getSocialButton('Facebook'));

        expect(onError).toHaveBeenCalledWith(error);
        expect(onSuccess).not.toHaveBeenCalled();
    });
});

describe('theming', () => {
    describe('colors', () => {
        test('falls back to the provider brand color when the theme sets none', () => {
            renderSocialButtons({ providers: ['facebook'] });

            const button = getSocialButton('Facebook');
            // facebook exposes only `color`, so it drives background and border
            expect(cssVar(button, '--r5-button-bg')).toBe('#3b5998');
            expect(cssVar(button, '--r5-button-hover-bg')).toBe('#2d4373'); // shadeColor
            // text color is picked for contrast against the background
            expect(cssVar(button, '--r5-button-text')).toBe('#ffffff');
            expect(cssVar(button, '--r5-button-hover-text')).toBe('#ffffff');
        });

        test('falls back to the provider button colors when they are defined', () => {
            renderSocialButtons({ providers: ['google'] });

            const button = getSocialButton('Google');
            // google overrides its brand color with dedicated button colors
            expect(cssVar(button, '--r5-button-bg')).toBe('#ffffff');
            expect(cssVar(button, '--r5-button-hover-bg')).toBe('#e6e6e6'); // shadeColor
            expect(cssVar(button, '--r5-button-text')).toBe('#58666e');
            expect(cssVar(button, '--r5-button-hover-text')).toBe('#58666e');
        });

        test('theme colors take precedence over the provider colors', () => {
            renderSocialButtons(
                { providers: ['facebook', 'google'] },
                {
                    theme: {
                        socialButton: {
                            background: '#123456',
                            hoverBackground: '#654321',
                            color: '#fedcba',
                            hoverColor: '#abcdef',
                        },
                    },
                }
            );

            // both providers, branded or not, are overridden
            ['Facebook', 'Google'].forEach(name => {
                const button = getSocialButton(name);
                expect(cssVar(button, '--r5-button-bg')).toBe('#123456');
                expect(cssVar(button, '--r5-button-hover-bg')).toBe('#654321');
                expect(cssVar(button, '--r5-button-text')).toBe('#fedcba');
                expect(cssVar(button, '--r5-button-hover-text')).toBe('#abcdef');
            });
        });

        test('hover colors default to their non-hover counterpart when unset', () => {
            renderSocialButtons(
                { providers: ['facebook'] },
                { theme: { socialButton: { background: '#ff0000', color: '#001122' } } }
            );

            const button = getSocialButton('Facebook');
            expect(cssVar(button, '--r5-button-hover-bg')).toBe('#cc0000'); // shadeColor
            expect(cssVar(button, '--r5-button-hover-text')).toBe('#001122');
        });

        test('applies the border colors', () => {
            renderSocialButtons({ providers: ['facebook', 'google'] });

            // facebook exposes no dedicated border color, so its brand color is used
            const facebook = getSocialButton('Facebook');
            expect(cssVar(facebook, '--r5-button-border-color')).toBe('#3b5998');
            expect(cssVar(facebook, '--r5-button-hover-border-color')).toBe('#2d4373'); // shadeColor

            // google's hairline border is semi-transparent: shading it must keep it that way
            // rather than snapping it to a solid rule
            const google = getSocialButton('Google');
            expect(cssVar(google, '--r5-button-border-color')).toBe('rgba(0,0,0,.15)'); // btnBorderColor
            expect(cssVar(google, '--r5-button-hover-border-color')).toBe('#1a1a1a26'); // shadeColor
        });

        test('theme border colors take precedence over the provider colors', () => {
            renderSocialButtons(
                { providers: ['facebook'] },
                {
                    theme: {
                        socialButton: { borderColor: '#0f0f0f', hoverBorderColor: '#f0f0f0' },
                    },
                }
            );

            const button = getSocialButton('Facebook');
            expect(cssVar(button, '--r5-button-border-color')).toBe('#0f0f0f');
            expect(cssVar(button, '--r5-button-hover-border-color')).toBe('#f0f0f0');
        });

        test('keys the focus ring to each provider brand color', () => {
            renderSocialButtons({ providers: ['facebook', 'my-idp'] });

            // `--ring` overrides the widget-wide value so the ring relates to the button it sits
            // on. It feeds `hsl(var(--ring))`, hence the bare HSL triple.
            expect(cssVar(getSocialButton('Facebook'), '--ring')).toBe('220.65 44.08% 41.37%'); // #3b5998
            expect(cssVar(getSocialButton('My IdP'), '--ring')).toBe('263.5 67.42% 34.9%'); // #4c1d95
        });

        test('keys the focus ring to the brand color even when the button is white', () => {
            renderSocialButtons({ providers: ['google'] });

            // google's button background is white, so a background-derived ring would be
            // invisible — the brand color is used instead
            const button = getSocialButton('Google');
            expect(cssVar(button, '--r5-button-bg')).toBe('#ffffff');
            expect(cssVar(button, '--ring')).toBe('4.64 81.17% 56.27%'); // #ea4335
        });

        test('renders the focus ring utilities that consume --ring', () => {
            renderSocialButtons({ providers: ['facebook'] });

            // asserting the classes, not just the custom property: a variable nothing consumes
            // would leave the ring silently unstyled
            expect(getSocialButton('Facebook')).toHaveClass(
                'focus-visible:ring-1',
                'focus-visible:ring-ring'
            );
        });
    });

    describe('metrics', () => {
        test('applies the default theme metrics', () => {
            renderSocialButtons({ providers: ['facebook'] });

            const button = getSocialButton('Facebook');
            expect(cssVar(button, '--r5-button-height')).toBe('40px');
            expect(cssVar(button, '--r5-button-padding-x')).toBe('12px');
            expect(cssVar(button, '--r5-button-padding-y')).toBe('9px');
            expect(cssVar(button, '--r5-button-radius')).toBe('3px');
            expect(cssVar(button, '--r5-button-border-width')).toBe('1px');
            expect(cssVar(button, '--r5-button-text-size')).toBe('14px');
            expect(cssVar(button, '--r5-button-font-weight')).toBe('bold');
            // A `boxShadow` of `none` is emitted as a transparent shadow, so it stays valid inside
            // the shadow list Tailwind shares with the focus ring. @see composableShadow
            expect(cssVar(button, '--r5-button-shadow')).toBe('0 0 #0000');
        });

        test('applies the social button theme metrics', () => {
            renderSocialButtons(
                { providers: ['facebook'] },
                {
                    theme: {
                        socialButton: {
                            fontSize: 18,
                            fontWeight: 300,
                            lineHeight: 2,
                            paddingX: 24,
                            paddingY: 12,
                            borderRadius: 8,
                            borderWidth: 2,
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                        },
                    },
                }
            );

            const button = getSocialButton('Facebook');
            expect(cssVar(button, '--r5-button-padding-x')).toBe('24px');
            expect(cssVar(button, '--r5-button-padding-y')).toBe('12px');
            expect(cssVar(button, '--r5-button-radius')).toBe('8px');
            expect(cssVar(button, '--r5-button-border-width')).toBe('2px');
            expect(cssVar(button, '--r5-button-font-weight')).toBe('300');
            expect(cssVar(button, '--r5-button-leading')).toBe('2');
            expect(cssVar(button, '--r5-button-shadow')).toBe('0 1px 2px rgba(0, 0, 0, 0.5)');
            expect(cssVar(button, '--r5-button-text-size')).toBe('18px');
            // height is derived from fontSize × lineHeight + paddings + borders
            expect(cssVar(button, '--r5-button-height')).toBe('64px');
        });

        test('inherits the button theme metrics when the social button sets none', () => {
            renderSocialButtons(
                { providers: ['facebook'] },
                { theme: { button: { paddingX: 30, borderRadius: 10, borderWidth: 4 } } }
            );

            const button = getSocialButton('Facebook');
            expect(cssVar(button, '--r5-button-padding-x')).toBe('30px');
            expect(cssVar(button, '--r5-button-radius')).toBe('10px');
            expect(cssVar(button, '--r5-button-border-width')).toBe('4px');
        });
    });

    describe('layout', () => {
        test('stacks the buttons and shows their label by default', () => {
            const { container } = renderSocialButtons({ providers: ['facebook'] });

            expect(getSocialButtonsContainer(container)).toHaveClass('flex-col', 'items-stretch');

            const button = getSocialButton('Facebook');
            expect(getSocialButtonLabel(button)).toHaveTextContent('Facebook');
            // default size: padded, auto width
            expect(button).toHaveClass('px-[var(--r5-button-padding-x)]');
        });

        test('inlines the buttons and hides their label when inline is enabled', () => {
            const { container } = renderSocialButtons(
                { providers: ['facebook'] },
                { theme: { socialButton: { inline: true } } }
            );

            expect(getSocialButtonsContainer(container)).toHaveClass(
                'flex-row',
                'items-center',
                'justify-center'
            );

            const button = getSocialButton('Facebook');
            expect(getSocialButtonLabel(button)).not.toBeInTheDocument();
            // icon size: square, sized on the button height
            expect(button).toHaveClass('w-[var(--r5-button-height)]');
            // the icon is still rendered, and the title still labels the button
            expect(getProviderIcon(button)).toBeInTheDocument();
        });
    });
});
