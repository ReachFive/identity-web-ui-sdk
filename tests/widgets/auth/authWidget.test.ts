/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';
import { beforeEach } from 'node:test';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import { randomString } from '../../../src/helpers/random';
import { providers, type ProviderId } from '../../../src/providers/providers';
import authWidget from '../../../src/widgets/auth/authWidget';

import type { Config } from '../../../src/types';

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
            versions: [
                {
                    versionId: 1,
                    title: 'consent title',
                    description: 'consent description',
                    language: 'fr',
                },
            ],
            consentType: 'opt-in',
            status: 'active',
        },
    },
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

const defaultI18n: I18nMessages = {};

const webauthnConfig = { ...defaultConfig, webAuthn: true };

function expectSocialButtons(toBeInTheDocument = true) {
    defaultConfig.socialProviders.forEach(provider => {
        if (toBeInTheDocument) {
            expect(screen.queryByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
        } else {
            expect(
                screen.queryByTitle(providers[provider as ProviderId].name)
            ).not.toBeInTheDocument();
        }
    });
}

describe('Snapshot', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation(password => {
            let score = 0;
            if (/[a-z]+/.exec(password)) score++;
            if (/[0-9]+/.exec(password)) score++;
            if (/[^a-z0-9]+/.exec(password)) score++;
            if (password.length > 8) score++;
            return Promise.resolve({ score: score as PasswordStrengthScore });
        });

    const loginWithWebAuthn = jest
        .fn<Client['loginWithWebAuthn']>()
        .mockRejectedValue(new Error('This is a mock.'));

    // @ts-expect-error partial Client
    const apiClient: Client = {
        getPasswordStrength,
        loginWithWebAuthn,
    };

    beforeEach(() => {
        getPasswordStrength.mockClear();
        loginWithWebAuthn.mockClear();
    });

    const generateSnapshot =
        (options: Parameters<typeof authWidget>[0] = {}, config: Partial<Config> = {}) =>
        async () => {
            const widget = await authWidget(options, {
                config: { ...defaultConfig, ...config },
                apiClient,
                defaultI18n,
            });

            await waitFor(async () => {
                const { container } = await render(widget);
                expect(container).toMatchSnapshot();
            });
        };

    describe('login view', () => {
        test(
            'default',
            generateSnapshot({
                allowWebAuthnLogin: false,
            })
        );

        test(
            'no signup',
            generateSnapshot({
                allowSignup: false,
            })
        );

        test(
            'with remember me',
            generateSnapshot({
                showRememberMe: true,
            })
        );

        test(
            'with canShowPassword',
            generateSnapshot({
                canShowPassword: true,
            })
        );

        test(
            'no forgot password',
            generateSnapshot({
                allowForgotPassword: false,
            })
        );

        test(
            'inline social buttons',
            generateSnapshot({
                theme: {
                    socialButton: {
                        inline: true,
                    },
                },
            })
        );
    });

    describe('signup view', () => {
        test(
            'default',
            generateSnapshot({
                initialScreen: 'signup',
            })
        );

        test(
            'no login',
            generateSnapshot({
                initialScreen: 'signup',
                allowLogin: false,
            })
        );

        test(
            'show labels',
            generateSnapshot({
                initialScreen: 'signup',
                showLabels: true,
            })
        );

        test(
            'inline social buttons',
            generateSnapshot({
                initialScreen: 'signup',
                theme: {
                    socialButton: {
                        inline: true,
                    },
                },
            })
        );

        test(
            'with user agreement',
            generateSnapshot({
                initialScreen: 'signup',
                userAgreement:
                    "En vous inscrivant, vous acceptez les [conditions générales d'utilisation](https://sandbox-local.reach5.co/).",
            })
        );

        test(
            'with consents',
            generateSnapshot({
                initialScreen: 'signup',
                signupFields: ['email', 'password', 'consents.aConsent'],
            })
        );

        test(
            'with mandatory consents',
            generateSnapshot({
                initialScreen: 'signup',
                signupFields: ['email', 'password', { key: 'consents.aConsent', required: true }],
            })
        );

        test(
            'with custom fields',
            generateSnapshot(
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
                            dataType: 'checkbox',
                        },
                    ],
                }
            )
        );
    });

    describe('with webauthn feature', () => {
        test(
            'login old view with webauthn or password',
            generateSnapshot(
                {
                    allowWebAuthnLogin: true,
                },
                webauthnConfig
            )
        );

        test(
            'login new view with integrated webauthn and password',
            generateSnapshot(
                {
                    allowWebAuthnLogin: true,
                    initialScreen: 'login',
                },
                webauthnConfig
            )
        );

        test(
            'signup view with webauthn or password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup',
                },
                webauthnConfig
            )
        );

        test(
            'signup form view with password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-password',
                },
                webauthnConfig
            )
        );

        test(
            'signup form view with webauthn',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-web-authn',
                },
                webauthnConfig
            )
        );
    });

    describe('with webauthn feature and without password', () => {
        test(
            'login old view with webauthn or password',
            generateSnapshot(
                {
                    allowWebAuthnLogin: true,
                    enablePasswordAuthentication: false,
                },
                webauthnConfig
            )
        );

        test(
            'login new view with integrated webauthn and password',
            generateSnapshot(
                {
                    allowWebAuthnLogin: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'login',
                },
                webauthnConfig
            )
        );

        test(
            'signup view with webauthn or password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup',
                },
                webauthnConfig
            )
        );

        test(
            'signup form view with password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup-with-password',
                },
                webauthnConfig
            )
        );

        test(
            'signup form view with webauthn',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup-with-web-authn',
                },
                webauthnConfig
            )
        );

        test(
            'signup form view with webauthn and without password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup-with-web-authn',
                },
                webauthnConfig
            )
        );
    });

    describe('forgot password view', () => {
        test(
            'default',
            generateSnapshot({
                initialScreen: 'forgot-password',
            })
        );
    });
});

describe('DOM testing', () => {
    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation(password => {
            let score = 0;
            if (/[a-z]+/.exec(password)) score++;
            if (/[0-9]+/.exec(password)) score++;
            if (/[^a-z0-9]+/.exec(password)) score++;
            if (password.length > 8) score++;
            return Promise.resolve({ score: score as PasswordStrengthScore });
        });

    const loginWithWebAuthn = jest
        .fn<Client['loginWithWebAuthn']>()
        .mockRejectedValue(new Error('This is a mock.'));

    const requestPasswordReset = jest.fn<Client['requestPasswordReset']>().mockResolvedValue();

    const updatePassword = jest.fn<Client['updatePassword']>().mockResolvedValue();

    beforeEach(() => {
        getPasswordStrength.mockClear();
        loginWithWebAuthn.mockClear();
        requestPasswordReset.mockClear();
        updatePassword.mockClear();
    });

    const generateComponent = async (
        options: Parameters<typeof authWidget>[0] = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getPasswordStrength,
            loginWithWebAuthn,
            requestPasswordReset,
            updatePassword,
        };
        const result = await authWidget(options, {
            config: { ...defaultConfig, ...config },
            apiClient,
            defaultI18n,
        });
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
            expectSocialButtons(true);

            // No remember me
            expect(screen.queryByTestId('auth.persistent')).not.toBeInTheDocument();
        });

        test('login only', async () => {
            expect.assertions(2);
            await generateComponent({
                allowSignup: false,
            });

            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLinkk')).not.toBeInTheDocument();
        });

        test('without forgot password', async () => {
            expect.assertions(3);
            await generateComponent({
                allowSignup: false,
                allowForgotPassword: false,
            });

            expectSocialButtons(true);

            expect(screen.queryByText('login.forgotPasswordLink')).not.toBeInTheDocument();
        });

        test('with remember me', async () => {
            expect.assertions(1);
            await generateComponent({
                showRememberMe: true,
            });

            expect(screen.queryByLabelText('rememberMe')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            expect.assertions(1);
            await generateComponent({
                canShowPassword: true,
            });

            const password = screen.getByTestId('password');
            expect(password.parentElement?.querySelector('svg')).toBeInTheDocument();
        });

        test('inline social buttons', async () => {
            expect.assertions(2);
            await generateComponent({
                theme: {
                    socialButton: {
                        inline: true,
                    },
                },
            });

            // Social buttons
            expectSocialButtons(true);
        });

        describe('i18n', () => {
            test('overwrite title', async () => {
                expect.assertions(1);
                const title = randomString();
                await generateComponent({
                    i18n: {
                        'login.title': title,
                    },
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });

            test('overwrite title - expanded', async () => {
                expect.assertions(1);
                const title = randomString();
                await generateComponent({
                    i18n: {
                        login: {
                            title,
                        },
                    },
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });

            test('overwrite title - internationalized', async () => {
                expect.assertions(1);
                await generateComponent(
                    {
                        i18n: {
                            fr: {
                                login: {
                                    title: 'Connexion',
                                },
                            },
                            en: {
                                login: {
                                    title: 'Login',
                                },
                            },
                        },
                    },
                    {
                        ...defaultConfig,
                        language: 'fr',
                    }
                );

                expect(screen.queryByText('Connexion')).toBeInTheDocument();
            });
        });
    });

    describe('signup view', () => {
        test('default config', async () => {
            expect.assertions(4);
            await generateComponent({
                initialScreen: 'signup',
            });

            // Form button
            expect(screen.queryByText('signup.submitLabel')).toBeInTheDocument();

            // Login link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();

            // Social buttons
            expectSocialButtons(true);
        });

        test('inline social buttons', async () => {
            expect.assertions(2);
            await generateComponent({
                initialScreen: 'signup',
                theme: {
                    socialButton: {
                        inline: true,
                    },
                },
            });

            // Social buttons
            expectSocialButtons(true);
        });

        test('with user agreement', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                userAgreement: 'I agreed [terms of use](https://example.com/termsofuse).',
            });

            expect(screen.queryByText('terms of use')).toBeInTheDocument();
        });

        test('default signup fields', async () => {
            expect.assertions(5);
            await generateComponent({
                initialScreen: 'signup',
            });

            // form inputs
            expect(screen.queryByTestId('givenName')).toBeInTheDocument();
            expect(screen.queryByTestId('familyName')).toBeInTheDocument();
            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('passwordConfirmation')).toBeInTheDocument();
        });

        test('signup fields selection', async () => {
            expect.assertions(3);
            const signupFields = ['email', 'password', 'passwordConfirmation'];
            await generateComponent({
                initialScreen: 'signup',
                signupFields,
            });

            signupFields.forEach(field => {
                expect(screen.queryByTestId(field)).toBeInTheDocument();
            });
        });

        test('signup fields selection with custom field', async () => {
            expect.assertions(3);
            const signupFields = ['email', 'password', 'custom_fields.newsletter_optin'];
            await generateComponent(
                {
                    initialScreen: 'signup',
                    signupFields,
                },
                {
                    ...defaultConfig,
                    customFields: [
                        {
                            id: 'newsletter_optin',
                            name: 'Newsletter optin',
                            path: 'newsletter_optin',
                            dataType: 'checkbox',
                        },
                    ],
                }
            );

            expect(screen.queryByTestId('email')).toBeInTheDocument();
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('custom_fields.newsletter_optin')).toBeInTheDocument();
        });
    });

    describe('with webauthn feature', () => {
        test('new login view', async () => {
            expect.assertions(6);

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                { allowWebAuthnLogin: true, initialScreen: 'login' },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true);

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

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                {
                    allowWebAuthnLogin: true,
                    initialScreen: 'login-with-web-authn',
                },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true);

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
                { allowWebAuthnSignup: true, initialScreen: 'signup' },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true);

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeInTheDocument();

            // Login in link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();
        });

        test('signup form view with password', async () => {
            expect.assertions(7);
            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-password',
                },
                webauthnConfig
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
            expect.assertions(5);
            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-web-authn',
                },
                webauthnConfig
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
            expect.assertions(6);

            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                {
                    allowWebAuthnLogin: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'login-with-web-authn',
                },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true);

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
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup',
                },
                webauthnConfig
            );

            // Social buttons
            expectSocialButtons(true);

            // Form buttons
            expect(screen.queryByTestId('webauthn-button')).toBeInTheDocument();
            expect(screen.queryByTestId('password-button')).toBeNull();

            // Login in link
            expect(screen.queryByText('signup.loginLink')).toBeInTheDocument();
        });

        test('signup form view with webauthn and without password', async () => {
            expect.assertions(5);
            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup-with-web-authn',
                },
                webauthnConfig
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

    describe('forgot password', () => {
        const user = userEvent.setup();

        test('default', async () => {
            await generateComponent({ initialScreen: 'forgot-password' });

            const emailField = screen.getByLabelText('email');
            const useEmailButton = screen.getByRole('button', {
                name: 'forgotPassword.submitLabel',
            });

            await user.type(emailField, 'test@example.com');
            await user.click(useEmailButton);

            expect(requestPasswordReset).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                })
            );

            expect(screen.getByText('forgotPassword.successMessage')).toBeInTheDocument();
        });

        test('with phone number reset password', async () => {
            await generateComponent(
                {
                    initialScreen: 'forgot-password',
                    allowPhoneNumberResetPassword: true,
                },
                {
                    countryCode: 'FR',
                    sms: true,
                }
            );

            const usePhoneNumberButton = screen.getByRole('button', {
                name: 'forgotPassword.usePhoneNumberButton',
            });

            await user.click(usePhoneNumberButton);

            expect(screen.queryByText('forgotPassword.prompt.phoneNumber')).toBeInTheDocument();

            const phoneNumberField = screen.getByLabelText('phoneNumber');
            const submitPhoneNumberButton = screen.getByRole('button', {
                name: 'forgotPassword.submitLabel.code',
            });

            await user.type(phoneNumberField, '0123456789');
            await user.click(submitPhoneNumberButton);

            expect(requestPasswordReset).toHaveBeenCalledWith(
                expect.objectContaining({
                    phoneNumber: '+33123456789',
                })
            );

            const verificationCodeField = screen.getByLabelText('verificationCode');
            const passwordField = screen.getByLabelText('newPassword');
            const passwordConfirmationField = screen.getByLabelText('passwordConfirmation');
            const sendCodeButton = screen.getByRole('button', {
                name: 'send',
            });

            await user.type(verificationCodeField, '123456');
            await user.type(passwordField, 'Wond3rFu11_Pa55w0rD*$');
            await user.type(passwordConfirmationField, 'Wond3rFu11_Pa55w0rD*$');
            await user.click(sendCodeButton);

            expect(updatePassword).toHaveBeenCalledWith(
                expect.objectContaining({
                    password: 'Wond3rFu11_Pa55w0rD*$',
                    phoneNumber: '+33123456789',
                    verificationCode: '123456',
                })
            );
        });
    });
});
