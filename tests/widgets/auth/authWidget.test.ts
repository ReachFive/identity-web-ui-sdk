/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import type {
    AuthResult,
    Client,
    ConsentType,
    PasswordStrengthScore,
} from '@reachfive/identity-core';

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
    consents: [
        {
            key: 'optin_testing',
            consentType: 'opt-in',
            status: 'active',
            title: 'Opt-in Testing v1',
            description: 'This is just a test',
        },
    ],
    consentsVersions: {
        optin_testing: {
            key: 'optin_testing',
            versions: [
                {
                    versionId: 1,
                    title: 'Opt-in Testing v1',
                    language: 'fr',
                    description: 'This is just a test',
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
            expect(screen.getByTitle(providers[provider as ProviderId].name)).toBeInTheDocument();
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

            const { container } = render(widget);
            expect(container).toMatchSnapshot();
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
                signupFields: ['email', 'password', 'consents.optin_testing'],
            })
        );

        test(
            'with mandatory consents',
            generateSnapshot({
                initialScreen: 'signup',
                signupFields: [
                    'email',
                    'password',
                    { key: 'consents.optin_testing', required: true },
                ],
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

    const loginWithPassword = jest
        .fn<Client['loginWithPassword']>()
        .mockResolvedValue({} as AuthResult);

    const requestPasswordReset = jest.fn<Client['requestPasswordReset']>().mockResolvedValue();

    const updatePassword = jest.fn<Client['updatePassword']>().mockResolvedValue();

    const signupWithWebAuthn = jest
        .fn<Client['signupWithWebAuthn']>()
        .mockRejectedValue(new Error('This is a mock.'));

    const signup = jest.fn<Client['signup']>().mockResolvedValue({} as AuthResult);

    beforeEach(() => {
        getPasswordStrength.mockClear();
        loginWithPassword.mockClear();
        loginWithWebAuthn.mockClear();
        requestPasswordReset.mockClear();
        updatePassword.mockClear();
        signupWithWebAuthn.mockClear();
        signup.mockClear();
    });

    const generateComponent = async (
        options: Parameters<typeof authWidget>[0] = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            getPasswordStrength,
            loginWithPassword,
            loginWithWebAuthn,
            requestPasswordReset,
            signup,
            signupWithWebAuthn,
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
            expect(screen.getByRole('button', { name: 'login.submitLabel' })).toBeInTheDocument();

            // Links
            expect(
                screen.getByRole('link', { name: 'login.forgotPasswordLink' })
            ).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'login.signupLink' })).toBeInTheDocument();

            // Social buttons
            expectSocialButtons(true);

            // No remember me
            expect(
                screen.queryByRole('checkbox', { name: 'auth.persistent' })
            ).not.toBeInTheDocument();
        });

        // the identifier field already reads an email, a phone number or a custom identifier (see
        // `specializeIdentifier`), so when the view adds its dedicated `customIdentifier` input the
        // two are alternatives: exactly one of them carries the identifier
        describe('with the dedicated customIdentifier field', () => {
            const password = 'Wond3rFu11_Pa55w0rD*$';

            const fillPasswordAndSubmit = async (user: ReturnType<typeof userEvent.setup>) => {
                await user.type(screen.getByLabelText('password'), password);
                await user.click(screen.getByRole('button', { name: 'login.submitLabel' }));
            };

            test('an email in the generic field is submitted as the email login type', async () => {
                expect.assertions(1);

                const user = userEvent.setup();

                await generateComponent({ allowCustomIdentifier: true });

                await user.type(
                    screen.getByRole('textbox', { name: 'identifier' }),
                    'alice@reach5.co'
                );
                await fillPasswordAndSubmit(user);

                await waitFor(() =>
                    expect(loginWithPassword).toBeCalledWith(
                        expect.objectContaining({ email: 'alice@reach5.co', password })
                    )
                );
            });

            test('the dedicated field alone is submitted as the custom identifier login type', async () => {
                expect.assertions(1);

                const user = userEvent.setup();

                await generateComponent({ allowCustomIdentifier: true });

                await user.type(
                    screen.getByRole('textbox', { name: 'customIdentifier' }),
                    'jdoe2024'
                );
                await fillPasswordAndSubmit(user);

                await waitFor(() =>
                    expect(loginWithPassword).toBeCalledWith(
                        expect.objectContaining({ customIdentifier: 'jdoe2024', password })
                    )
                );
            });

            // a field can only be held to its own value, so nothing client-side arbitrates between
            // the two: `specializeIdentifierData` specializes the generic field and keeps the rest of
            // the payload as it is, and the api decides which identifier it honours
            test('filling both submits both and leaves the api to arbitrate', async () => {
                expect.assertions(1);

                const user = userEvent.setup();

                await generateComponent({ allowCustomIdentifier: true });

                await user.type(
                    screen.getByRole('textbox', { name: 'identifier' }),
                    'alice@reach5.co'
                );
                await user.type(
                    screen.getByRole('textbox', { name: 'customIdentifier' }),
                    'jdoe2024'
                );
                await fillPasswordAndSubmit(user);

                await waitFor(() =>
                    expect(loginWithPassword).toBeCalledWith(
                        expect.objectContaining({
                            email: 'alice@reach5.co',
                            customIdentifier: 'jdoe2024',
                            password,
                        })
                    )
                );
            });

            // `loginTypeAllowed` is authoritative: the view may ask for the dedicated input, but a
            // tenant which forbids that login type never gets a field whose value the API rejects
            test('is not displayed when the tenant forbids that login type', async () => {
                expect.assertions(3);

                const user = userEvent.setup();

                await generateComponent(
                    { allowCustomIdentifier: true },
                    {
                        loginTypeAllowed: {
                            email: true,
                            phoneNumber: true,
                            customIdentifier: false,
                        },
                    }
                );

                expect(
                    screen.queryByRole('textbox', { name: 'customIdentifier' })
                ).not.toBeInTheDocument();

                // the generic field is then the only identifier the form holds, so it is required
                // again rather than one alternative of a pair
                await fillPasswordAndSubmit(user);

                expect(
                    screen.getByRole('textbox', { name: 'identifier' })
                ).toHaveAccessibleErrorMessage('validation.required');
                expect(loginWithPassword).not.toBeCalled();
            });

            // neither field is required on its own — a field can only be held to its own value, so
            // the missing identifier is the api's to report. It answers `invalid_grant` with no
            // `error_details`, so the message lands in the form's global error rather than on a field
            test('filling neither submits without an identifier and reports the api error', async () => {
                expect.assertions(3);

                const user = userEvent.setup();

                // an api error makes the Form call logError(), which logs to console.error by design
                // (src/helpers/logger.ts): silenced so the expected error path stays out of the output
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

                const errorUserMsg =
                    'The identifier must be a valid email, a valid phone number or a custom identifier';
                loginWithPassword.mockRejectedValueOnce({
                    errorId: '2eiBH55Hvv',
                    errorDescription: errorUserMsg,
                    error: 'invalid_grant',
                    errorUserMsg,
                    errorMessageKey: 'error.identifier.mustBeValidLogin',
                });

                await generateComponent({ allowCustomIdentifier: true });

                await fillPasswordAndSubmit(user);

                await waitFor(() => expect(loginWithPassword).toBeCalled());
                expect(loginWithPassword.mock.calls[0][0]).toEqual(
                    expect.not.objectContaining({
                        email: expect.anything(),
                        phoneNumber: expect.anything(),
                        customIdentifier: expect.anything(),
                    })
                );
                // no message key in the bundle: i18next falls back to the api's user message
                await waitFor(() =>
                    expect(screen.getByRole('alert')).toHaveTextContent(errorUserMsg)
                );

                consoleErrorSpy.mockRestore();
            });
        });

        // `loginTypeAllowed` is tenant configuration and is authoritative for every shape the
        // identifier field reads, the custom identifier included
        test('a custom identifier is rejected when the tenant forbids that login type', async () => {
            expect.assertions(2);

            const user = userEvent.setup();

            await generateComponent(
                {},
                { loginTypeAllowed: { email: true, phoneNumber: true, customIdentifier: false } }
            );

            const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
            await user.type(identifierInput, 'jdoe2024');
            await user.type(screen.getByLabelText('password'), 'Wond3rFu11_Pa55w0rD*$');
            await user.click(screen.getByRole('button', { name: 'login.submitLabel' }));

            expect(identifierInput).toHaveAccessibleErrorMessage('validation.identifier');
            expect(loginWithPassword).not.toBeCalled();
        });

        test('login only', async () => {
            expect.assertions(2);
            await generateComponent({
                allowSignup: false,
            });

            expect(screen.getByText('login.forgotPasswordLink')).toBeInTheDocument();
            expect(screen.queryByText('login.signupLink')).not.toBeInTheDocument();
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

            expect(screen.getByLabelText('rememberMe')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            expect.assertions(1);
            await generateComponent({
                canShowPassword: true,
            });

            expect(screen.getByRole('switch', { name: 'password.show' })).toBeInTheDocument();
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

                expect(screen.getByText(title)).toBeInTheDocument();
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

                expect(screen.getByText(title)).toBeInTheDocument();
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

                expect(screen.getByText('Connexion')).toBeInTheDocument();
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
            expect(screen.getByText('signup.submitLabel')).toBeInTheDocument();

            // Login link
            expect(screen.getByText('signup.loginLink')).toBeInTheDocument();

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

            expect(screen.getByText('terms of use')).toBeInTheDocument();
        });

        test('default signup fields', async () => {
            expect.assertions(5);
            await generateComponent({
                initialScreen: 'signup',
            });

            // form inputs
            expect(screen.getByRole('textbox', { name: 'givenName' })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: 'familyName' })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
            expect(screen.getByLabelText('password')).toBeInTheDocument();
            expect(screen.getByLabelText('passwordConfirmation')).toBeInTheDocument();
        });

        test('with canShowPassword', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                canShowPassword: true,
            });

            // one toggle for `password`, one for `passwordConfirmation`
            expect(screen.getAllByRole('switch', { name: 'password.show' })).toHaveLength(2);
        });

        test('with phoneNumberOptions.allowInternational', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                signupFields: ['email', 'phone_number', 'password', 'passwordConfirmation'],
                phoneNumberOptions: { allowInternational: true, defaultCountry: 'FR' },
            });

            // Country select button only renders when allowInternational reaches the phone field
            expect(screen.getByRole('button', { name: 'address.country' })).toBeInTheDocument();
        });

        test('hides country select by default', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                signupFields: ['email', 'phone_number', 'password', 'passwordConfirmation'],
            });

            expect(
                screen.queryByRole('button', { name: 'address.country' })
            ).not.toBeInTheDocument();
        });

        test('hides country select with phoneNumberOptions.withCountrySelect: false', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'signup',
                signupFields: ['email', 'phone_number', 'password', 'passwordConfirmation'],
                phoneNumberOptions: { withCountrySelect: false },
            });

            expect(
                screen.queryByRole('button', { name: 'address.country' })
            ).not.toBeInTheDocument();
        });

        test('signup fields selection', async () => {
            expect.assertions(3);
            const signupFields = ['email', 'password', 'passwordConfirmation'];
            await generateComponent({
                initialScreen: 'signup',
                signupFields,
            });

            signupFields.forEach(field => {
                expect(screen.getByLabelText(field)).toBeInTheDocument();
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

            expect(screen.getByLabelText('email')).toBeInTheDocument();
            expect(screen.getByLabelText('password')).toBeInTheDocument();
            expect(screen.getByLabelText('Newsletter optin')).toBeInTheDocument();
        });

        // CA-6472: submitting with a required consent left unchecked must show an inline error
        // instead of silently doing nothing.
        const requiredConsentCases: { consentType: ConsentType; key: string; title: string }[] = [
            { consentType: 'opt-in', key: 'optin_testing', title: 'Opt-in Testing v1' },
            { consentType: 'opt-out', key: 'optout_testing', title: 'Opt-out Testing v1' },
        ];

        requiredConsentCases.forEach(({ consentType, key: consentKey, title: consentTitle }) => {
            test(`required ${consentType} consent left unchecked blocks signup with an inline error`, async () => {
                const user = userEvent.setup();

                await generateComponent(
                    {
                        initialScreen: 'signup',
                        signupFields: [
                            'email',
                            'password',
                            { key: `consents.${consentKey}`, required: true },
                        ],
                    },
                    {
                        consents: [
                            {
                                key: consentKey,
                                consentType,
                                status: 'active',
                                title: consentTitle,
                                description: 'This is just a test',
                            },
                        ],
                        consentsVersions: {
                            [consentKey]: {
                                key: consentKey,
                                versions: [
                                    {
                                        versionId: 1,
                                        title: consentTitle,
                                        language: 'fr',
                                        description: 'This is just a test',
                                    },
                                ],
                                consentType,
                                status: 'active',
                            },
                        },
                    }
                );

                await user.type(screen.getByLabelText('email'), 'alice@reach5.co');
                await user.type(screen.getByLabelText('password'), 'Wond3rFu11_Pa55w0rD*$');

                const checkbox = screen.getByRole('checkbox', { name: consentTitle });
                expect(checkbox).not.toBeChecked();

                await user.click(screen.getByText('signup.submitLabel'));

                await waitFor(() =>
                    expect(checkbox).toHaveAccessibleErrorMessage('validation.required')
                );
                expect(signup).not.toBeCalled();
            });
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
            expect(screen.getByRole('textbox', { name: 'identifier' })).toBeInTheDocument();

            // Form button
            expect(screen.getByRole('button', { name: 'login.submitLabel' })).toBeInTheDocument();

            // Links
            expect(
                screen.getByRole('link', { name: 'login.forgotPasswordLink' })
            ).toBeInTheDocument();

            // Sign in link
            expect(screen.getByRole('link', { name: 'login.signupLink' })).toBeInTheDocument();
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
            expect(screen.getByRole('textbox', { name: 'identifier' })).toBeInTheDocument();

            // Form buttons
            expect(
                screen.getByRole('button', { name: 'login.withBiometrics' })
            ).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'login.withPassword' })).toBeInTheDocument();

            // Sign in link
            expect(screen.getByRole('link', { name: 'login.signupLink' })).toBeInTheDocument();
        });

        // `loginTypeAllowed` is tenant configuration and is authoritative: an identifier shape the
        // tenant forbids must never reach the API, WebAuthn login included
        describe('login identifier field honours loginTypeAllowed', () => {
            const emailOnly = { email: true, phoneNumber: false, customIdentifier: false };
            const phoneOnly = { email: false, phoneNumber: true, customIdentifier: false };

            const generateWebAuthnLoginView = (loginTypeAllowed?: Config['loginTypeAllowed']) =>
                generateComponent(
                    { allowWebAuthnLogin: true, initialScreen: 'login-with-web-authn' },
                    loginTypeAllowed ? { ...webauthnConfig, loginTypeAllowed } : webauthnConfig
                );

            test('narrows to an email field when only email login is allowed', async () => {
                expect.assertions(2);

                await generateWebAuthnLoginView(emailOnly);

                expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
                expect(
                    screen.queryByRole('textbox', { name: 'identifier' })
                ).not.toBeInTheDocument();
            });

            test('narrows to a phone number field when only phone login is allowed', async () => {
                expect.assertions(2);

                await generateWebAuthnLoginView(phoneOnly);

                expect(screen.getByRole('textbox', { name: 'phoneNumber' })).toBeInTheDocument();
                expect(
                    screen.queryByRole('textbox', { name: 'identifier' })
                ).not.toBeInTheDocument();
            });

            test('rejects a phone number when only email login is allowed', async () => {
                expect.assertions(2);

                const user = userEvent.setup();
                loginWithWebAuthn.mockResolvedValue({} as AuthResult);

                await generateWebAuthnLoginView(emailOnly);

                await user.type(screen.getByRole('textbox', { name: 'email' }), '+33612345678');
                await user.click(screen.getByRole('button', { name: 'login.withBiometrics' }));

                expect(screen.getByRole('textbox', { name: 'email' })).toHaveAccessibleErrorMessage(
                    'validation.email'
                );
                expect(loginWithWebAuthn).not.toBeCalledWith(
                    expect.objectContaining({ phoneNumber: expect.anything() })
                );
            });

            // when the tenant allows both, the generic identifier field accepts either shape and
            // must route it to the matching `loginWithWebAuthn` parameter
            test('looks up a phone-enrolled credential when both shapes are allowed', async () => {
                expect.assertions(1);

                const user = userEvent.setup();
                loginWithWebAuthn.mockResolvedValue({} as AuthResult);

                await generateWebAuthnLoginView();

                await user.type(
                    screen.getByRole('textbox', { name: 'identifier' }),
                    '+33612345678'
                );
                await user.click(screen.getByRole('button', { name: 'login.withBiometrics' }));

                expect(loginWithWebAuthn).toBeCalledWith(
                    expect.objectContaining({ phoneNumber: '+33612345678' })
                );
            });

            test('looks up an email-enrolled credential when both shapes are allowed', async () => {
                expect.assertions(1);

                const user = userEvent.setup();
                loginWithWebAuthn.mockResolvedValue({} as AuthResult);

                await generateWebAuthnLoginView();

                await user.type(
                    screen.getByRole('textbox', { name: 'identifier' }),
                    'alice@reach5.co'
                );
                await user.click(screen.getByRole('button', { name: 'login.withBiometrics' }));

                expect(loginWithWebAuthn).toBeCalledWith(
                    expect.objectContaining({ email: 'alice@reach5.co' })
                );
            });

            // a WebAuthn credential is only ever enrolled against an email or a phone number, so a
            // custom identifier has no credential to look up — whatever the tenant allows as a login
            // type. The field refuses that shape (`allowCustomIdentifier: false`) instead of letting
            // the handler reject the submission with nothing shown on the field
            describe('a custom identifier has no credential to look up', () => {
                test('is rejected by the field validation', async () => {
                    expect.assertions(2);

                    const user = userEvent.setup();
                    loginWithWebAuthn.mockResolvedValue({} as AuthResult);

                    // the tenant allows a custom identifier as a login type: the restriction comes
                    // from WebAuthn itself, not from `loginTypeAllowed`
                    await generateWebAuthnLoginView();

                    const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                    await user.type(identifierInput, 'jdoe2024');
                    await user.click(screen.getByRole('button', { name: 'login.withBiometrics' }));

                    expect(identifierInput).toHaveAccessibleErrorMessage('validation.identifier');
                    // the conditional mediation request the view starts on mount is the only call:
                    // no identifier is ever submitted
                    expect(loginWithWebAuthn).not.toBeCalledWith(
                        expect.objectContaining({ customIdentifier: expect.anything() })
                    );
                });

                // the password button submits the form as well as switching view, so the field
                // validation must not stand in the way of the fallback: a custom identifier is a
                // valid login with a password, and the value the user typed has to be carried over
                test('still reaches the password login view through the fallback', async () => {
                    expect.assertions(3);

                    const user = userEvent.setup();

                    await generateWebAuthnLoginView();

                    await user.type(
                        screen.getByRole('textbox', { name: 'identifier' }),
                        'jdoe2024'
                    );
                    await user.click(screen.getByRole('button', { name: 'login.withPassword' }));

                    expect(screen.getByLabelText('password')).toBeInTheDocument();
                    expect(screen.getByRole('textbox', { name: 'identifier' })).toHaveValue(
                        'jdoe2024'
                    );
                    expect(loginWithWebAuthn).not.toBeCalledWith(
                        expect.objectContaining({ customIdentifier: expect.anything() })
                    );
                });
            });
        });

        // the password login view is the second step of the WebAuthn-first flow: the identifier was
        // already settled on the previous screen and is only carried over, so it is displayed
        // read-only rather than offered for editing a second time
        describe('password login view', () => {
            const goToPasswordLoginView = async (
                user: ReturnType<typeof userEvent.setup>,
                identifier: string
            ) => {
                await generateComponent(
                    { allowWebAuthnLogin: true, initialScreen: 'login-with-web-authn' },
                    webauthnConfig
                );
                await user.type(screen.getByRole('textbox', { name: 'identifier' }), identifier);
                await user.click(screen.getByRole('button', { name: 'login.withPassword' }));
                return screen.getByRole('textbox', { name: 'identifier' });
            };

            test('carries the identifier over as a read-only field', async () => {
                expect.assertions(2);

                const user = userEvent.setup();

                const identifierInput = await goToPasswordLoginView(user, 'alice@reach5.co');

                expect(identifierInput).toHaveValue('alice@reach5.co');
                expect(identifierInput).toHaveAttribute('readonly');
            });

            test('does not let the carried identifier be replaced', async () => {
                expect.assertions(1);

                const user = userEvent.setup();

                const identifierInput = await goToPasswordLoginView(user, 'alice@reach5.co');
                await user.type(identifierInput, 'bob@reach5.co');

                expect(identifierInput).toHaveValue('alice@reach5.co');
            });

            // the identifier is settled upstream, so the shape restriction of the previous screen
            // does not carry over: a custom identifier is a valid login with a password
            test('submits a carried custom identifier as such', async () => {
                expect.assertions(2);

                const user = userEvent.setup();
                loginWithPassword.mockResolvedValue({} as AuthResult);

                const identifierInput = await goToPasswordLoginView(user, 'jdoe2024');
                await user.type(screen.getByLabelText('password'), 'Wond3rFu11_Pa55w0rd*$');
                await user.click(screen.getByRole('button', { name: 'login.submitLabel' }));

                expect(identifierInput).toHaveAttribute('readonly');
                await waitFor(() =>
                    expect(loginWithPassword).toBeCalledWith(
                        expect.objectContaining({ customIdentifier: 'jdoe2024' })
                    )
                );
            });
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
            expect(
                screen.getByRole('button', { name: 'signup.withBiometrics' })
            ).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'signup.withPassword' })).toBeInTheDocument();

            // Login in link
            expect(screen.getByRole('link', { name: 'signup.loginLink' })).toBeInTheDocument();
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
            expect(screen.getByLabelText('givenName')).toBeInTheDocument();
            expect(screen.getByLabelText('familyName')).toBeInTheDocument();
            expect(screen.getByLabelText('email')).toBeInTheDocument();
            expect(screen.getByLabelText('password')).toBeInTheDocument();
            expect(screen.getByLabelText('passwordConfirmation')).toBeInTheDocument();

            // Form button
            expect(screen.getByRole('button', { name: 'signup.submitLabel' })).toBeInTheDocument();

            // Back link
            expect(screen.getByRole('link', { name: 'back' })).toBeInTheDocument();
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
            expect(screen.getByLabelText('givenName')).toBeInTheDocument();
            expect(screen.getByLabelText('familyName')).toBeInTheDocument();
            expect(screen.getByLabelText('email')).toBeInTheDocument();

            // Form button
            expect(screen.getByRole('button', { name: 'signup.submitLabel' })).toBeInTheDocument();

            // Back link
            expect(screen.getByRole('link', { name: 'back' })).toBeInTheDocument();
        });

        test('signup form view with webauthn displays the API validation error on the phone number field', async () => {
            const user = userEvent.setup();
            // response of POST /identity/v1/webauthn/signup-options, which reports the invalid field
            // with the `profile` payload prefix and no `error_message_key`
            signupWithWebAuthn.mockRejectedValue({
                errorId: 'qENRZetnU0',
                errorDescription: 'Validation failed',
                error: 'invalid_request',
                errorDetails: [
                    {
                        field: 'profile.phone_number',
                        message: 'The phone number is invalid',
                        code: 'invalid',
                    },
                ],
            });

            await generateComponent(
                {
                    allowWebAuthnSignup: true,
                    initialScreen: 'signup-with-web-authn',
                    signupFields: ['email', 'phone_number'],
                },
                webauthnConfig
            );

            await user.type(screen.getByRole('textbox', { name: 'email' }), 'alice@reach5.co');

            const phoneInput = screen.getByRole('textbox', { name: 'phoneNumber' });
            await user.type(phoneInput, '0612345678');

            await user.click(screen.getByRole('button', { name: 'signup.submitLabel' }));

            await waitFor(() => expect(signupWithWebAuthn).toHaveBeenCalled());
            await waitFor(() =>
                expect(phoneInput).toHaveAccessibleErrorMessage('The phone number is invalid')
            );
            expect(screen.getByText('Validation failed')).toBeInTheDocument();
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
            expect(screen.getByRole('textbox', { name: 'identifier' })).toBeInTheDocument();

            // Form buttons
            expect(
                screen.getByRole('button', { name: 'login.withBiometrics' })
            ).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'login.withPassword' })).toBeNull();

            // Sign in link
            expect(screen.getByRole('link', { name: 'login.signupLink' })).toBeInTheDocument();
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
            expect(
                screen.getByRole('button', { name: 'signup.withBiometrics' })
            ).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'signup.withPassword' })).toBeNull();

            // Login in link
            expect(screen.getByRole('link', { name: 'signup.loginLink' })).toBeInTheDocument();
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
            expect(screen.getByRole('textbox', { name: 'givenName' })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: 'familyName' })).toBeInTheDocument();
            expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();

            // Form button
            expect(screen.getByRole('button', { name: 'signup.submitLabel' })).toBeInTheDocument();

            // Back link
            expect(screen.getByRole('link', { name: 'back' })).toBeInTheDocument();
        });
    });

    describe('forgot password', () => {
        const user = userEvent.setup();

        test('default', async () => {
            await generateComponent({ initialScreen: 'forgot-password' });

            const emailField = screen.getByRole('textbox', { name: 'email' });
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

        test('forwards returnToAfterPasswordReset to requestPasswordReset', async () => {
            expect.assertions(1);
            await generateComponent({
                initialScreen: 'forgot-password',
                returnToAfterPasswordReset: 'https://example.com/after-reset',
            });

            await user.type(screen.getByRole('textbox', { name: 'email' }), 'test@example.com');
            await user.click(screen.getByRole('button', { name: 'forgotPassword.submitLabel' }));

            expect(requestPasswordReset).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'test@example.com',
                    returnToAfterPasswordReset: 'https://example.com/after-reset',
                })
            );
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

            expect(screen.getByText('forgotPassword.prompt.phoneNumber')).toBeInTheDocument();

            const phoneNumberField = screen.getByRole('textbox', { name: 'phoneNumber' });
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

            const verificationCodeField = screen.getByRole('textbox', { name: 'verificationCode' });
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

        describe('phone number view', () => {
            const generatePhoneNumberView = async (
                options: Parameters<typeof authWidget>[0] = {}
            ) => {
                await generateComponent(
                    { initialScreen: 'forgot-password', ...options },
                    { countryCode: 'FR', sms: true }
                );
                await user.click(
                    screen.getByRole('button', { name: 'forgotPassword.usePhoneNumberButton' })
                );
            };

            test('hides country select by default', async () => {
                expect.assertions(1);
                await generatePhoneNumberView({ allowPhoneNumberResetPassword: true });

                expect(
                    screen.queryByRole('button', { name: 'address.country' })
                ).not.toBeInTheDocument();
            });

            test('hides country select with phoneNumberOptions.withCountrySelect: false', async () => {
                expect.assertions(1);
                await generatePhoneNumberView({
                    allowPhoneNumberResetPassword: true,
                    phoneNumberOptions: { withCountrySelect: false },
                });

                expect(
                    screen.queryByRole('button', { name: 'address.country' })
                ).not.toBeInTheDocument();
            });

            test('shows country select with phoneNumberOptions.withCountrySelect: true', async () => {
                expect.assertions(1);
                await generatePhoneNumberView({
                    allowPhoneNumberResetPassword: true,
                    phoneNumberOptions: { withCountrySelect: true },
                });

                expect(screen.getByRole('button', { name: 'address.country' })).toBeInTheDocument();
            });

            test('shows country select with phoneNumberOptions.allowInternational: true', async () => {
                expect.assertions(1);
                await generatePhoneNumberView({
                    allowPhoneNumberResetPassword: true,
                    phoneNumberOptions: { allowInternational: true, defaultCountry: 'FR' },
                });

                expect(screen.getByRole('button', { name: 'address.country' })).toBeInTheDocument();
            });

            test('forwards returnToAfterPasswordReset to requestPasswordReset', async () => {
                expect.assertions(1);
                await generatePhoneNumberView({
                    allowPhoneNumberResetPassword: true,
                    returnToAfterPasswordReset: 'https://example.com/after-reset',
                });

                await user.type(screen.getByRole('textbox', { name: 'phoneNumber' }), '0123456789');
                await user.click(
                    screen.getByRole('button', { name: 'forgotPassword.submitLabel.code' })
                );

                expect(requestPasswordReset).toHaveBeenCalledWith(
                    expect.objectContaining({
                        phoneNumber: '+33123456789',
                        returnToAfterPasswordReset: 'https://example.com/after-reset',
                    })
                );
            });
        });
    });
});
