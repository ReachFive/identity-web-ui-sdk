/**
 * @jest-environment jest-fixed-jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { type I18nMessages } from '@/core/i18n';
import { AppError } from '@/helpers/errors';
import { randomString } from '@/helpers/random';
import { providers, type ProviderId } from '@/providers/providers';
import AuthWidget from '@/widgets/auth/authWidget';

import { componentGenerator, defaultConfig, snapshotGenerator } from '../renderer';

const defaultI18n: I18nMessages = {};

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
    const checkUrlFragment = jest
        .fn<Client['checkUrlFragment']>()
        .mockImplementation((_url?: string) => false);

    const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue({
        errorId: 'azerty',
        errorDescription: 'The user is not logged in',
        error: 'login_required',
    } satisfies AppError);

    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation((password: string) => {
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

    beforeEach(() => {
        checkUrlFragment.mockClear();
        getSessionInfo.mockClear();
        getPasswordStrength.mockClear();
        loginWithWebAuthn.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        checkUrlFragment,
        getSessionInfo,
        getPasswordStrength,
        loginWithWebAuthn,
    };

    const generateSnapshot = snapshotGenerator(AuthWidget, apiClient, defaultI18n);

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
                { webAuthn: true }
            )
        );

        test(
            'login new view with integradted webauthn and password',
            generateSnapshot(
                {
                    allowWebAuthnLogin: true,
                    initialScreen: 'login',
                },
                { webAuthn: true }
            )
        );

        test(
            'signup view with webauthn or password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup',
                },
                { webAuthn: true }
            )
        );

        test(
            'signup form view with password',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-password',
                },
                { webAuthn: true }
            )
        );

        test(
            'signup form view with webauthn',
            generateSnapshot(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-web-authn',
                },
                { webAuthn: true }
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
                { webAuthn: true }
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
                { webAuthn: true }
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
                { webAuthn: true }
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
                { webAuthn: true }
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
                { webAuthn: true }
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
                { webAuthn: true }
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
    const checkUrlFragment = jest
        .fn<Client['checkUrlFragment']>()
        .mockImplementation((_url?: string) => false);

    const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue({
        errorId: 'azerty',
        errorDescription: 'The user is not logged in',
        error: 'login_required',
    } satisfies AppError);

    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockImplementation((password: string) => {
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
        checkUrlFragment.mockClear();
        getSessionInfo.mockClear();
        getPasswordStrength.mockClear();
        loginWithWebAuthn.mockClear();
        requestPasswordReset.mockClear();
        updatePassword.mockClear();
    });

    // @ts-expect-error partial Client
    const apiClient: Client = {
        checkUrlFragment,
        getSessionInfo,
        getPasswordStrength,
        loginWithWebAuthn,
        requestPasswordReset,
        updatePassword,
    };

    const generateComponent = componentGenerator(AuthWidget, apiClient, defaultI18n);

    describe('login view', () => {
        test('default config', async () => {
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
            await generateComponent({
                allowSignup: false,
            });

            expect(screen.queryByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLinkk')).not.toBeInTheDocument();
        });

        test('without forgot password', async () => {
            await generateComponent({
                allowSignup: false,
                allowForgotPassword: false,
            });

            expectSocialButtons(true);

            expect(screen.queryByText('login.forgotPasswordLink')).not.toBeInTheDocument();
        });

        test('with remember me', async () => {
            await generateComponent({
                showRememberMe: true,
            });

            expect(screen.queryByLabelText('rememberMe')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            await generateComponent({
                canShowPassword: true,
            });

            const password = screen.getByTestId('password');
            expect(password.parentElement?.querySelector('svg')).toBeInTheDocument();
        });

        test('inline social buttons', async () => {
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
                const title = randomString();
                await generateComponent({
                    i18n: {
                        'login.title': title,
                    },
                });

                expect(screen.queryByText(title)).toBeInTheDocument();
            });

            test('overwrite title - expanded', async () => {
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
        });
    });

    describe('signup view', () => {
        test('default config', async () => {
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
            await generateComponent({
                initialScreen: 'signup',
                userAgreement: 'I agreed [terms of use](https://example.com/termsofuse).',
            });

            expect(screen.queryByText('terms of use')).toBeInTheDocument();
        });

        test('default signup fields', async () => {
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
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                { allowWebAuthnLogin: true, initialScreen: 'login' },
                { webAuthn: true }
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
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                { allowWebAuthnLogin: true, initialScreen: 'login-with-web-authn' },
                { webAuthn: true }
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
            await generateComponent(
                { allowWebAuthnSignup: true, initialScreen: 'signup' },
                { webAuthn: true }
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
            await generateComponent(
                { allowWebAuthnSignup: true, initialScreen: 'signup-with-password' },
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
                { allowWebAuthnSignup: true, initialScreen: 'signup-with-web-authn' },
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
            loginWithWebAuthn.mockRejectedValue(new Error('This is a mock.'));

            await generateComponent(
                {
                    allowWebAuthnLogin: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'login-with-web-authn',
                },
                { webAuthn: true }
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
            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup',
                },
                { webAuthn: true }
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
            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    enablePasswordAuthentication: false,
                    initialScreen: 'signup-with-web-authn',
                },
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

            expect(apiClient.requestPasswordReset).toHaveBeenCalledWith(
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

            expect(apiClient.requestPasswordReset).toHaveBeenCalledWith(
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

            expect(apiClient.updatePassword).toHaveBeenCalledWith(
                expect.objectContaining({
                    password: 'Wond3rFu11_Pa55w0rD*$',
                    phoneNumber: '+33123456789',
                    verificationCode: '123456',
                })
            );
        });
    });
});
