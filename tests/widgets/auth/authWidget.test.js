/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import 'jest-styled-components';

import { randomString } from '../../../src/helpers/random';
import authWidget from '../../../src/widgets/auth/authWidget';

import { providers } from '../../../src/providers/providers';

const defaultConfig = {
    domain: 'local.reach5.net',
    passwordPolicy: {
        minLength: 8,
        minStrength: 2
    },
    socialProviders: ['facebook', 'google'],
    consentsVersions: [{
        key: 'aConsent',
        versions: [{
            versionId: 1,
            title: 'consent title',
            description: 'consent description'
        }]
    }]
};

const webauthnConfig = { ...defaultConfig, webAuthn: true };

function expectSocialButtons(toBeInTheDocument = true) {
    return defaultConfig.socialProviders.forEach((provider) => {
        if (toBeInTheDocument) {
            expect(screen.queryByTitle(providers[provider].name)).toBeInTheDocument()
        } else {
            expect(screen.queryByTitle(providers[provider].name)).not.toBeInTheDocument()
        }
    })
}

describe('Snapshot', () => {
    const apiClient = {
        loginWithWebAuthn: jest.fn().mockRejectedValue(new Error('This is a mock.'))
    }

    const generateSnapshot = (options, config = defaultConfig) => () => {
        const tree = authWidget(options, { config, apiClient })
            .then(result => renderer.create(result).toJSON())
            .catch(e => console.error(e) || Promise.reject(e));

        expect(tree).resolves.toMatchSnapshot();
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
        test('login view with webauthn or password', generateSnapshot({
            allowWebAuthnLogin: true
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

    describe('forgot password view', () => {
        test('default', generateSnapshot({
            initialScreen: 'forgot-password'
        }));
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options, config = defaultConfig, apiClient = {}) => {
        const result = await authWidget(options, { config, apiClient });
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

            expect(screen.queryByTestId('password').parentElement.querySelector('svg')).toBeInTheDocument();
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
        test('login view', async () => {
            expect.assertions(6);
            await generateComponent({ allowWebAuthnLogin: true }, webauthnConfig, {
                loginWithWebAuthn: jest.fn().mockRejectedValue(new Error('This is a mock.'))
            });

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
});
