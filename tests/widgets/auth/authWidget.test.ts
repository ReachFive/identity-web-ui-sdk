/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import { type ProviderId, providers } from '../../../src/providers/providers';
import type { Config } from '../../../src/types';
import { randomString } from '../../../src/helpers/random';

import authWidget from '../../../src/widgets/auth/authWidget';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {
        aConsent: {
            key: 'aConsent',
            versions: [{
                versionId: 1,
                title: 'consent title',
                description: 'consent description',
                language: 'fr',
            }],
            consentType: 'opt-in',
            status: 'active'
        }
    },
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    },
};

const defaultI18n: I18nMessages = {}

const webauthnConfig = { ...defaultConfig, webAuthn: true };

function expectSocialButtons(toBeInTheDocument = true) {
    return defaultConfig.socialProviders.forEach((provider) => {
        if (toBeInTheDocument) {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument()
        } else {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).not.toBeInTheDocument()
        }
    })
}

describe('Snapshot', () => {
    const generateSnapshot = (options: Parameters<typeof authWidget>[0] = {}, config: Partial<Config> = {}) => async () => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            loginWithWebAuthn: jest.fn<Client['loginWithWebAuthn']>().mockRejectedValue(new Error('This is a mock.'))
        }

        const widget = await authWidget(options, {config: { ...defaultConfig, ...config }, apiClient, defaultI18n })
                
        await waitFor(async () => {
            const { container } = await render(widget);
            expect(container).toMatchSnapshot();
        })
    };

    describe('login view', () => {
        test('default', generateSnapshot({
            allowWebAuthnLogin: false
        }));

        test('no signup', generateSnapshot({
            allowSignup: false
        }));

        test('with remember me', generateSnapshot({
            showRememberMe: true
        }));

        test('with canShowPassword', generateSnapshot({
            canShowPassword: true
        }));

        test('no forgot password', generateSnapshot({
            allowForgotPassword: false
        }));

        test('inline social buttons', generateSnapshot({
            theme: {
                socialButton: {
                    inline: true
                }
            }
        }));
    });

    describe('signup view', () => {
        test('default', generateSnapshot({
            initialScreen: 'signup'
        }));

        test('no login', generateSnapshot({
            initialScreen: 'signup',
            allowLogin: false
        }));

        test('show labels', generateSnapshot({
            initialScreen: 'signup',
            showLabels: true
        }));

        test('inline social buttons', generateSnapshot({
            initialScreen: 'signup',
            theme: {
                socialButton: {
                    inline: true
                }
            }
        }));

        test('with user agreement', generateSnapshot({
            initialScreen: 'signup',
            userAgreement: 'En vous inscrivant, vous acceptez les [conditions générales d\'utilisation](https://sandbox-local.reach5.co/).'
        }));

        test('with consents', generateSnapshot({
            initialScreen: 'signup',
            signupFields: ['email', 'password', 'consents.aConsent']
        }));

        test('with mandatory consents', generateSnapshot({
            initialScreen: 'signup',
            signupFields: ['email', 'password', { key: 'consents.aConsent', required: true }]
        }));

        test('with custom fields', generateSnapshot(
            {
                initialScreen: 'signup',
                signupFields: ['email', 'password', 'custom_fields.newsletter_optin'],
            },
            {
                ...defaultConfig,
                customFields: [
                    {
                        id: 'newsletter_optin',
                        name: 'Newsletter optin',
                        path: 'newsletter_optin',
                        dataType: 'checkbox'
                    }
                ]
            }
        ))
    });

    describe('with webauthn feature', () => {
        test('login old view with webauthn or password', generateSnapshot({
            allowWebAuthnLogin: true
        }, webauthnConfig))

        test('login new view with integradted webauthn and password', generateSnapshot({
            allowWebAuthnLogin: true,
            initialScreen: 'login'
        }, webauthnConfig))

        test('signup view with webauthn or password', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup'
        }, webauthnConfig))

        test('signup form view with password', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup-with-password'
        }, webauthnConfig))

        test('signup form view with webauthn', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup-with-web-authn'
        }, webauthnConfig))
    })

    describe('with webauthn feature and without password', () => {
        test('login old view with webauthn or password', generateSnapshot({
            allowWebAuthnLogin: true,
            enablePasswordAuthentication:false
        }, webauthnConfig))

        test('login new view with integrated webauthn and password', generateSnapshot({
            allowWebAuthnLogin: true,
            enablePasswordAuthentication:false,
            initialScreen: 'login'
        }, webauthnConfig))

        test('signup view with webauthn or password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup'
        }, webauthnConfig))

        test('signup form view with password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup-with-password'
        }, webauthnConfig))

        test('signup form view with webauthn', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup-with-web-authn'
        }, webauthnConfig))

        test('signup form view with webauthn and without password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication: false,
            initialScreen: 'signup-with-web-authn'
        }, webauthnConfig))
    })

    describe('forgot password view', () => {
        test('default', generateSnapshot({
            initialScreen: 'forgot-password'
        }));
    });
});

describe('DOM testing', () => {
    const loginWithWebAuthn = jest.fn<Client['loginWithWebAuthn']>()

    const generateComponent = async (options: Parameters<typeof authWidget>[0] = {}, config: Partial<Config> = {}) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            loginWithWebAuthn
        }
        const result = await authWidget(options, {config: { ...defaultConfig, ...config }, apiClient, defaultI18n });
        return render(result);
    };

    describe('login view', () => {
        test('default config', async () => {
            expect.assertions(6);
            await generateComponent({});

            // Form button
            expect(screen.queryByText('login.submitLabel')).toBeInTheDocument();

            // Links
            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLink')).toBeInTheDocument();

            // Social buttons
            expectSocialButtons(true)

            // No remember me
            expect(screen.queryByTestId('auth.persistent')).not.toBeInTheDocument();
        });

        test('login only', async () => {
            expect.assertions(2);
            await generateComponent({
                allowSignup: false
            });

            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLinkk')).not.toBeInTheDocument();
        });

        test('without forgot password', async () => {
            expect.assertions(3);
            await generateComponent({
                allowSignup: false,
                allowForgotPassword: false
            });

            expectSocialButtons(true)

            expect(screen.queryByText('login.forgotPasswordLink')).not.toBeInTheDocument();
        });

        test('with remember me', async () => {
            expect.assertions(1);
            await generateComponent({
                showRememberMe: true
            });

            expect(screen.queryByLabelText('rememberMe')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            expect.assertions(1);
            await generateComponent({
                canShowPassword: true
            });

            const password = screen.getByTestId('password')
            expect(password.parentElement?.querySelector('svg')).toBeInTheDocument();
        });

        test('inline social buttons', async () => {
            expect.assertions(2);
            await generateComponent({
                theme: {
                    socialButton: {
                        inline: true
                    }
                }
            });

            // Social buttons
            expectSocialButtons(true)
        });

        describe('i18n', () => {
            test('overwrite title', async () => {
                expect.assertions(1);
                const title = randomString();
                await generateComponent({
                    i18n: {
                        'login.title': title
                    }
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });

            test('overwrite title - expanded', async () => {
                expect.assertions(1);
                const title = randomString();
                await generateComponent({
                    i18n: {
                        login: {
                            title
                        }
                    }
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });
        });
    });

    describe('signup view', () => {
        test('default config', async () => {
            expect.assertions(4);
            await generateComponent({
                initialScreen: 'signup'
            });

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Login link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();

            // Social buttons
            expectSocialButtons(true)
        });

        test('inline social buttons', async () => {
            expect.assertions(2);
            await generateComponent({
                initialScreen: 'signup',
                theme: {
                    socialButton: {
                        inline: true
                    }
                }
            });

            // Social buttons
            expectSocialButtons(true)
        });

        test('with user agreement', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                userAgreement: 'I agreed [terms of use](https://example.com/termsofuse).'
            });

            expect(screen.queryByText('terms of use')).toBeInTheDocument();
        });

        test('default signup fields', async () => {
            expect.assertions(5);
            await generateComponent({
                initialScreen: 'signup'
            });

            // form inputs
            expect(screen.queryByTestId('given_name')).toBeInTheDocument();
            expect(screen.queryByTestId('family_name')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('password_confirmation')).toBeInTheDocument();
        });

        test('signup fields selection', async () => {
            expect.assertions(3);
            const signupFields = ['email', 'password', 'password_confirmation'];
            await generateComponent({
                initialScreen: 'signup',
                signupFields
            });

            signupFields.forEach(field => {
                expect(screen.queryByTestId(field)).toBeInTheDocument();
            });
        });

        test('signup fields selection with custom field', async () => {
            expect.assertions(3);
            const signupFields = ['email', 'password', 'custom_fields.newsletter_optin'];
            await generateComponent({
                initialScreen: 'signup',
                signupFields
            }, {
                ...defaultConfig,
                customFields: [
                    {
                        id: 'newsletter_optin',
                        name: 'Newsletter optin',
                        path: 'newsletter_optin',
                        dataType: 'checkbox'
                    }
                ]
            });

            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('custom_fields.newsletter_optin')).toBeInTheDocument();
        });
    });

    describe('with webauthn feature', () => {
        test('new login view', async () => {
            expect.assertions(6);

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({ allowWebAuthnLogin: true, initialScreen: 'login' }, webauthnConfig);

            // Social buttons
            expectSocialButtons(true)

            // Email input
            expect(screen.queryByTestId('identifier')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('login.submitLabel')).toBeInTheDocument();

            // Links
            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();

            // Sign in link
            expect(screen.queryByText('login.signupLink')).toBeInTheDocument();
        });

        test('old login view', async () => {
            expect.assertions(6);

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({ allowWebAuthnLogin: true, initialScreen: 'login-with-web-authn' }, webauthnConfig);

            // Social buttons
            expectSocialButtons(true)

            // Email input
            expect(screen.queryByTestId('identifier')).toBeInTheDocument();

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeInTheDocument();

            // Sign in link
            expect(screen.queryByText('login.signupLink')).toBeInTheDocument();
        });

        test('signup view with password or webauthn', async () => {
            expect.assertions(5);
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup' },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true)

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeInTheDocument();

            // Login in link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();
        });

        test('signup form view with password', async () => {
            expect.assertions(7);
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup-with-password' },
                webauthnConfig
            );

            // Form fields
            expect(screen.queryByTestId('given_name')).toBeInTheDocument();
            expect(screen.queryByTestId('family_name')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('password_confirmation')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });

        test('signup form view with webauthn', async () => {
            expect.assertions(5);
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup-with-web-authn' },
                webauthnConfig
            );

            // Form fields
            expect(screen.queryByTestId('given_name')).toBeInTheDocument();
            expect(screen.queryByTestId('family_name')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });
    });

    describe('with webauthn feature and without password', () => {
        test('old login view', async () => {
            expect.assertions(6);

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({ allowWebAuthnLogin: true, enablePasswordAuthentication:false, initialScreen: 'login-with-web-authn' }, webauthnConfig);

            // Social buttons
            expectSocialButtons(true)

            // Email input
            expect(screen.queryByTestId('identifier')).toBeInTheDocument();

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeNull();

            // Sign in link
            expect(screen.queryByText('login.signupLink')).toBeInTheDocument();
        });

        test('signup view without password and with webauthn', async () => {
            expect.assertions(5);
            await generateComponent(
                { allowWebAuthnSignup: true,  enablePasswordAuthentication:false, initialScreen: 'signup' },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true)

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeNull();

            // Login in link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();
        });

        test('signup form view with webauthn and without password', async () => {
            expect.assertions(5);
            await generateComponent(
                { allowWebAuthnSignup: true, enablePasswordAuthentication:false, initialScreen: 'signup-with-web-authn' },
                webauthnConfig
            );

            // Form fields
            expect(screen.queryByTestId('given_name')).toBeInTheDocument();
            expect(screen.queryByTestId('family_name')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });
    })
});
