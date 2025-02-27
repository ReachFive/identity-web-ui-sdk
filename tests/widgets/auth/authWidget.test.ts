/**
 * @jest-environment jest-fixed-jsdom
 */

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals'
import 'jest-styled-components';

import type { PasswordStrengthScore, Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/core/i18n';
import { type ProviderId, providers } from '../../../src/providers/providers';
import { randomString } from '../../../src/helpers/random';

import AuthWidget from '../../../src/widgets/auth/authWidget';

import { defaultConfig, snapshotGenerator, componentGenerator } from '../renderer'
import { AppError } from '../../../src/helpers/errors';

const defaultI18n: I18nMessages = {}

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
    const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockImplementation((_url?: string) => false)
    
    const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue({
        errorId: 'azerty',
        errorDescription: 'The user is not logged in',
        error: 'login_required'
    } satisfies AppError)
 
    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>().mockImplementation((password) => {
        let score = 0
        if (password.match(/[a-z]+/)) score++
        if (password.match(/[0-9]+/)) score++
        if (password.match(/[^a-z0-9]+/)) score++
        if (password.length > 8) score++
        return Promise.resolve({ score: score as PasswordStrengthScore })
    })
    
    const loginWithWebAuthn = jest.fn<Client['loginWithWebAuthn']>().mockRejectedValue(new Error('This is a mock.'))

    beforeEach(() => {
        checkUrlFragment.mockClear()
        getSessionInfo.mockClear()
        getPasswordStrength.mockClear()
        loginWithWebAuthn.mockClear()
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        checkUrlFragment,
        getSessionInfo,
        getPasswordStrength,
        loginWithWebAuthn,
    }

    const generateSnapshot = snapshotGenerator(AuthWidget, apiClient, defaultI18n)

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
        }, { webAuthn: true }))

        test('login new view with integradted webauthn and password', generateSnapshot({
            allowWebAuthnLogin: true,
            initialScreen: 'login'
        }, { webAuthn: true }))

        test('signup view with webauthn or password', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup'
        }, { webAuthn: true }))

        test('signup form view with password', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup-with-password'
        }, { webAuthn: true }))

        test('signup form view with webauthn', generateSnapshot({
            allowWebAuthnSignup: true,
            initialScreen: 'signup-with-web-authn'
        }, { webAuthn: true }))
    })

    describe('with webauthn feature and without password', () => {
        test('login old view with webauthn or password', generateSnapshot({
            allowWebAuthnLogin: true,
            enablePasswordAuthentication:false
        }, { webAuthn: true }))

        test('login new view with integrated webauthn and password', generateSnapshot({
            allowWebAuthnLogin: true,
            enablePasswordAuthentication:false,
            initialScreen: 'login'
        }, { webAuthn: true }))

        test('signup view with webauthn or password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup'
        }, { webAuthn: true }))

        test('signup form view with password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup-with-password'
        }, { webAuthn: true }))

        test('signup form view with webauthn', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication:false,
            initialScreen: 'signup-with-web-authn'
        }, { webAuthn: true }))

        test('signup form view with webauthn and without password', generateSnapshot({
            allowWebAuthnSignup: true,
            enablePasswordAuthentication: false,
            initialScreen: 'signup-with-web-authn'
        }, { webAuthn: true }))
    })

    describe('forgot password view', () => {
        test('default', generateSnapshot({
            initialScreen: 'forgot-password'
        }));
    });
});

describe('DOM testing', () => {
    const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockImplementation((_url?: string) => false)
    
    const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue({
        errorId: 'azerty',
        errorDescription: 'The user is not logged in',
        error: 'login_required'
    } satisfies AppError)

    const getPasswordStrength = jest.fn<Client['getPasswordStrength']>().mockImplementation((password) => {
        let score = 0
        if (password.match(/[a-z]+/)) score++
        if (password.match(/[0-9]+/)) score++
        if (password.match(/[^a-z0-9]+/)) score++
        if (password.length > 8) score++
        return Promise.resolve({ score: score as PasswordStrengthScore })
    })
    
    const loginWithWebAuthn = jest.fn<Client['loginWithWebAuthn']>().mockRejectedValue(new Error('This is a mock.'))

    beforeEach(() => {
        checkUrlFragment.mockClear()
        getSessionInfo.mockClear()
        getPasswordStrength.mockClear()
        loginWithWebAuthn.mockClear()
    })

    // @ts-expect-error partial Client
    const apiClient: Client = {
        checkUrlFragment,
        getSessionInfo,
        getPasswordStrength,
        loginWithWebAuthn
    }
    
    const generateComponent = componentGenerator(AuthWidget, apiClient, defaultI18n)

    describe('login view', () => {
        test('default config', async () => {
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
            await generateComponent({
                allowSignup: false
            });

            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLinkk')).not.toBeInTheDocument();
        });

        test('without forgot password', async () => {
            await generateComponent({
                allowSignup: false,
                allowForgotPassword: false
            });

            expectSocialButtons(true)

            expect(screen.queryByText('login.forgotPasswordLink')).not.toBeInTheDocument();
        });

        test('with remember me', async () => {
            await generateComponent({
                showRememberMe: true
            });

            expect(screen.queryByLabelText('rememberMe')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            await generateComponent({
                canShowPassword: true
            });

            const password = screen.getByTestId('password')
            expect(password.parentElement?.querySelector('svg')).toBeInTheDocument();
        });

        test('inline social buttons', async () => {
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
                const title = randomString();
                await generateComponent({
                    i18n: {
                        'login.title': title
                    }
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });

            test('overwrite title - expanded', async () => {
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
            await generateComponent({
                initialScreen: 'signup',
                userAgreement: 'I agreed [terms of use](https://example.com/termsofuse).'
            });

            expect(screen.queryByText('terms of use')).toBeInTheDocument();
        });

        test('default signup fields', async () => {
            await generateComponent({
                initialScreen: 'signup'
            });

            // form inputs
            expect(screen.queryByTestId('givenName')).toBeInTheDocument();
            expect(screen.queryByTestId('familyName')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('passwordConfirmation')).toBeInTheDocument();
        });

        test('signup fields selection', async () => {
            const signupFields = ['email', 'password', 'passwordConfirmation'];
            await generateComponent({
                initialScreen: 'signup',
                signupFields
            });

            signupFields.forEach(field => {
                expect(screen.queryByTestId(field)).toBeInTheDocument();
            });
        });

        test('signup fields selection with custom field', async () => {
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
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({ allowWebAuthnLogin: true, initialScreen: 'login' }, { webAuthn: true });

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
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({ allowWebAuthnLogin: true, initialScreen: 'login-with-web-authn' }, { webAuthn: true });

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
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup' },
                { webAuthn: true }
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
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup-with-password' },
                { webAuthn: true }
            );

            // Form fields
            expect(screen.queryByTestId('givenName')).toBeInTheDocument();
            expect(screen.queryByTestId('familyName')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('passwordConfirmation')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });

        test('signup form view with webauthn', async () => {
            await generateComponent(
                { allowWebAuthnSignup: true,  initialScreen: 'signup-with-web-authn' },
                { webAuthn: true }
            );

            // Form fields
            expect(screen.queryByTestId('givenName')).toBeInTheDocument();
            expect(screen.queryByTestId('familyName')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });
    });

    describe('with webauthn feature and without password', () => {
        test('old login view', async () => {
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'))

            await generateComponent({
                allowWebAuthnLogin: true,
                enablePasswordAuthentication:false,
                initialScreen: 'login-with-web-authn'
            }, { webAuthn: true });

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
            await generateComponent(
                { allowWebAuthnSignup: true,  enablePasswordAuthentication:false, initialScreen: 'signup' },
                { webAuthn: true }
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
            await generateComponent(
                { allowWebAuthnSignup: true, enablePasswordAuthentication:false, initialScreen: 'signup-with-web-authn' },
                { webAuthn: true }
            );

            // Form fields
            expect(screen.queryByTestId('givenName')).toBeInTheDocument();
            expect(screen.queryByTestId('familyName')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Back link
            expect(screen.queryByText('back')).toBeInTheDocument();
        });
    })
});
