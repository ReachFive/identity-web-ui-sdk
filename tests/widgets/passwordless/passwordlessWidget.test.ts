/**
 * @jest-environment jsdom
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'jest-styled-components';

import { type Client } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import passwordlessWidget from '../../../src/widgets/passwordless/passwordlessWidget';

import type { Config, OnError, OnSuccess } from '../../../src/types';

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

const defaultI18n: I18nMessages = {};

describe('Snapshot', () => {
    const generateSnapshot =
        (options: Parameters<typeof passwordlessWidget>[0] = {}, config: Partial<Config> = {}) =>
        async () => {
            // @ts-expect-error partial Client
            const apiClient: Client = {};

            const widget = await passwordlessWidget(options, {
                config: { ...defaultConfig, ...config },
                apiClient,
                defaultI18n,
            });

            const { container } = render(widget);
            expect(container).toMatchSnapshot();
        };

    describe('passwordless', () => {
        test('default', generateSnapshot());

        test('no intro', generateSnapshot({ showIntro: false }));

        test('sms', generateSnapshot({ authType: 'sms' }));
    });
});

describe('DOM testing', () => {
    const startPasswordless = jest.fn<Client['startPasswordless']>();
    const verifyPasswordless = jest.fn<Client['verifyPasswordless']>();

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        startPasswordless.mockClear();
        verifyPasswordless.mockClear();
        onError.mockClear();
        onSuccess.mockClear();
    });

    const generateComponent = async (
        options: Parameters<typeof passwordlessWidget>[0] = {},
        config: Partial<Config> = {}
    ) => {
        // @ts-expect-error partial Client
        const apiClient: Client = {
            startPasswordless,
            verifyPasswordless,
        };

        const result = await passwordlessWidget(
            { onError, onSuccess, ...options },
            { config: { ...defaultConfig, ...config }, apiClient, defaultI18n }
        );

        return render(result);
    };

    describe('passwordless', () => {
        test('default', async () => {
            expect.assertions(7);

            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({});

            await generateComponent();

            // Intro
            expect(screen.getByText('passwordless.intro')).toBeInTheDocument();

            // Input email
            const emailInput = screen.getByRole('textbox', { name: 'email' });
            expect(emailInput).toBeInTheDocument();

            // Form button
            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toHaveTextContent('send');

            await user.type(emailInput, 'alice@reach5.co');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    email: 'alice@reach5.co',
                }),
                undefined // auth
            );

            expect(screen.getByText('passwordless.emailSent')).toBeInTheDocument();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    name: 'otp_sent',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('no intro', async () => {
            expect.assertions(2);
            await generateComponent({ showIntro: false });

            // Intro
            expect(screen.queryByText('passwordless.intro')).not.toBeInTheDocument();
            expect(screen.queryByText('passwordless.sms.intro')).not.toBeInTheDocument();
        });

        test('by phone number', async () => {
            expect.assertions(8);

            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({
                challengeId: 'azerty',
            });

            verifyPasswordless.mockResolvedValue();

            await generateComponent({ authType: 'magic_link' });

            // Intro
            expect(screen.getByText('passwordless.intro')).toBeInTheDocument();

            // Label
            expect(screen.getByLabelText('email')).toBeInTheDocument();

            // Input phone number
            const emailInput = screen.getByRole('textbox', { name: 'email' });
            expect(emailInput).toBeInTheDocument();

            // Form button
            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toHaveTextContent('send');

            await user.type(emailInput, 'alice@reach5.co');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    email: 'alice@reach5.co',
                }),
                undefined // auth
            );

            expect(screen.getByText('passwordless.emailSent')).toBeInTheDocument();

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authType: 'magic_link',
                    name: 'otp_sent',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('by phone number', async () => {
            expect.assertions(10);

            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({
                challengeId: 'azerty',
            });

            verifyPasswordless.mockResolvedValue();

            await generateComponent({ authType: 'sms' });

            // Intro
            expect(screen.getByText('passwordless.sms.intro')).toBeInTheDocument();

            // Input phone number
            const phoneNumberInput = screen.getByRole('textbox', { name: 'phoneNumber' });
            expect(phoneNumberInput).toBeInTheDocument();

            // Form button
            const submitBtn = screen.getByRole('button', { name: 'send' });
            expect(submitBtn).toHaveTextContent('send');

            await user.type(phoneNumberInput, '+33612345678');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'sms',
                    phoneNumber: '+33612345678',
                }),
                undefined // auth
            );

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authType: 'sms',
                    name: 'otp_sent',
                })
            );

            const verificationCodeInput = screen.getByRole('textbox', { name: 'verificationCode' });
            expect(verificationCodeInput).toBeInTheDocument();

            const submitCodeBtn = screen.getByRole('button', { name: 'send' });
            expect(submitCodeBtn).toHaveTextContent('send');

            await user.type(verificationCodeInput, '123456');
            await user.click(submitCodeBtn);

            expect(verifyPasswordless).toBeCalledWith(
                expect.objectContaining({
                    authType: 'sms',
                    phoneNumber: '+33612345678',
                    verificationCode: '123456',
                })
            );

            expect(onSuccess).toBeCalledWith(
                expect.objectContaining({
                    authResult: expect.objectContaining({}),
                    name: 'login',
                })
            );
            expect(onError).not.toBeCalled();
        });

        test('by phone number with phoneNumberOptions.allowInternational', async () => {
            expect.assertions(1);

            await generateComponent({
                authType: 'sms',
                phoneNumberOptions: { allowInternational: true, defaultCountry: 'FR' },
            });

            // Country select button only renders when allowInternational reaches the phone field
            expect(screen.getByRole('button', { name: 'address.country' })).toBeInTheDocument();
        });

        test('by phone number hides country select by default', async () => {
            expect.assertions(1);

            await generateComponent({ authType: 'sms' });

            expect(
                screen.queryByRole('button', { name: 'address.country' })
            ).not.toBeInTheDocument();
        });

        // with more than one authType, a single `identifier` field is rendered and accepts either
        // an email or a phone number, the filled shape deciding which passwordless flow is started
        describe('by identifier (authType: magic_link + sms)', () => {
            test('renders the identifier field', async () => {
                expect.assertions(4);

                await generateComponent({ authType: ['magic_link', 'sms'] });

                expect(screen.getByText('passwordless.identity.intro')).toBeInTheDocument();
                expect(screen.getByLabelText('identifier')).toBeInTheDocument();
                expect(screen.getByRole('textbox', { name: 'identifier' })).toBeInTheDocument();
                // the identifier field replaces the email and phone number ones
                expect(screen.queryByRole('textbox', { name: 'email' })).not.toBeInTheDocument();
            });

            test('an email starts the magic link flow', async () => {
                expect.assertions(3);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({});

                await generateComponent({ authType: ['magic_link', 'sms'] });

                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, 'alice@reach5.co');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        email: 'alice@reach5.co',
                    }),
                    undefined // auth
                );

                expect(screen.getByText('passwordless.emailSent')).toBeInTheDocument();
                expect(onError).not.toBeCalled();
            });

            test('a phone number starts the sms flow', async () => {
                expect.assertions(3);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({ challengeId: 'azerty' });

                await generateComponent({ authType: ['magic_link', 'sms'] });

                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, '+33612345678');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        phoneNumber: '+33612345678',
                    }),
                    undefined // auth
                );

                expect(
                    screen.getByRole('textbox', { name: 'verificationCode' })
                ).toBeInTheDocument();
                expect(onError).not.toBeCalled();
            });

            test('a national phone number starts the sms flow', async () => {
                expect.assertions(2);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({ challengeId: 'azerty' });

                await generateComponent({ authType: ['magic_link', 'sms'] });

                // a national number is resolved against the default country (`fr` config language)
                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, '0612345678');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        phoneNumber: '+33612345678',
                    }),
                    undefined // auth
                );
                expect(onError).not.toBeCalled();
            });

            test('a malformed email is rejected by the field validation', async () => {
                expect.assertions(2);

                const user = userEvent.setup();

                await generateComponent({ authType: ['magic_link', 'sms'] });

                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, 'alice@reach5');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(identifierInput).toHaveAccessibleErrorMessage('validation.email');
                expect(startPasswordless).not.toBeCalled();
            });

            test('a malformed phone number is rejected by the field validation', async () => {
                expect.assertions(2);

                const user = userEvent.setup();

                await generateComponent({ authType: ['magic_link', 'sms'] });

                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, '06 12');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(identifierInput).toHaveAccessibleErrorMessage('validation.phone');
                expect(startPasswordless).not.toBeCalled();
            });

            // passwordless availability is gated by the widget's `authType`, not by
            // `loginTypeAllowed` — so a tenant allowing a single login type must still get the
            // generic identifier field the handler expects
            // `loginTypeAllowed` is tenant configuration and stays authoritative here too: the field
            // narrows to the single allowed shape, and the handler must cope with the narrowed key
            // instead of rejecting every submission with `validation.identifier`
            describe('under a restricted loginTypeAllowed', () => {
                const emailOnly = { email: true, phoneNumber: false, customIdentifier: false };
                const phoneOnly = { email: false, phoneNumber: true, customIdentifier: false };

                test('narrows to an email field when only email login is allowed', async () => {
                    expect.assertions(2);

                    await generateComponent(
                        { authType: ['magic_link', 'sms'] },
                        { loginTypeAllowed: emailOnly }
                    );

                    expect(screen.getByRole('textbox', { name: 'email' })).toBeInTheDocument();
                    expect(
                        screen.queryByRole('textbox', { name: 'identifier' })
                    ).not.toBeInTheDocument();
                });

                test('narrows to a phone number field when only phone login is allowed', async () => {
                    expect.assertions(2);

                    await generateComponent(
                        { authType: ['magic_link', 'sms'] },
                        { loginTypeAllowed: phoneOnly }
                    );

                    expect(
                        screen.getByRole('textbox', { name: 'phoneNumber' })
                    ).toBeInTheDocument();
                    expect(
                        screen.queryByRole('textbox', { name: 'identifier' })
                    ).not.toBeInTheDocument();
                });

                test('the narrowed email field starts the magic link flow', async () => {
                    expect.assertions(2);

                    const user = userEvent.setup();

                    startPasswordless.mockResolvedValue({});

                    await generateComponent(
                        { authType: ['magic_link', 'sms'] },
                        { loginTypeAllowed: emailOnly }
                    );

                    await user.type(
                        screen.getByRole('textbox', { name: 'email' }),
                        'alice@reach5.co'
                    );
                    await user.click(screen.getByRole('button', { name: 'send' }));

                    expect(startPasswordless).toBeCalledWith(
                        expect.objectContaining({
                            authType: 'magic_link',
                            email: 'alice@reach5.co',
                        }),
                        undefined // auth
                    );
                    expect(onError).not.toBeCalled();
                });

                test('the narrowed phone number field starts the sms flow', async () => {
                    expect.assertions(2);

                    const user = userEvent.setup();

                    startPasswordless.mockResolvedValue({ challengeId: 'azerty' });

                    await generateComponent(
                        { authType: ['magic_link', 'sms'] },
                        { loginTypeAllowed: phoneOnly }
                    );

                    await user.type(
                        screen.getByRole('textbox', { name: 'phoneNumber' }),
                        '+33612345678'
                    );
                    await user.click(screen.getByRole('button', { name: 'send' }));

                    expect(startPasswordless).toBeCalledWith(
                        expect.objectContaining({
                            authType: 'sms',
                            phoneNumber: '+33612345678',
                        }),
                        undefined // auth
                    );
                    expect(onError).not.toBeCalled();
                });
            });

            test('a custom identifier is accepted by the field validation', async () => {
                expect.assertions(2);

                const user = userEvent.setup();

                await generateComponent({ authType: ['magic_link', 'sms'] });

                // neither an email nor a phone number: no format to check, the handler rejects it
                const identifierInput = screen.getByRole('textbox', { name: 'identifier' });
                await user.type(identifierInput, 'jdoe2024');
                await user.click(screen.getByRole('button', { name: 'send' }));

                expect(identifierInput).not.toHaveAccessibleErrorMessage();
                expect(startPasswordless).not.toBeCalled();
            });
        });

        describe('with enableVerificationCode = false', () => {
            test('by email', async () => {
                expect.assertions(8);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({
                    challengeId: 'azerty',
                });

                verifyPasswordless.mockResolvedValue();

                await generateComponent({
                    authType: 'magic_link',
                    enableVerificationCode: false,
                });

                // Intro
                expect(screen.getByText('passwordless.intro')).toBeInTheDocument();

                // Label
                expect(screen.getByLabelText('email')).toBeInTheDocument();

                // Input phone number
                const emailInput = screen.getByRole('textbox', { name: 'email' });
                expect(emailInput).toBeInTheDocument();

                // Form button
                const submitBtn = screen.getByRole('button', { name: 'send' });
                expect(submitBtn).toHaveTextContent('send');

                await user.type(emailInput, 'alice@reach5.co');
                await user.click(submitBtn);

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        email: 'alice@reach5.co',
                    }),
                    undefined // auth
                );

                expect(screen.getByText('passwordless.emailSent')).toBeInTheDocument();

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        name: 'otp_sent',
                    })
                );
                expect(onError).not.toBeCalled();
            });

            test('by phone number', async () => {
                expect.assertions(8);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({
                    challengeId: 'azerty',
                });

                verifyPasswordless.mockResolvedValue();

                await generateComponent({
                    authType: 'sms',
                    enableVerificationCode: false,
                });

                // Intro
                expect(screen.getByText('passwordless.sms.intro')).toBeInTheDocument();

                // Label
                expect(screen.getByLabelText('phoneNumber')).toBeInTheDocument();

                // Input phone number
                const phoneNumberInput = screen.getByRole('textbox', { name: 'phoneNumber' });
                expect(phoneNumberInput).toBeInTheDocument();

                // Form button
                const submitBtn = screen.getByRole('button', { name: 'send' });
                expect(submitBtn).toHaveTextContent('send');

                await user.type(phoneNumberInput, '+33612345678');
                await user.click(submitBtn);

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        phoneNumber: '+33612345678',
                    }),
                    undefined // auth
                );

                expect(screen.getByText('passwordless.smsSent')).toBeInTheDocument();

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        name: 'otp_sent',
                    })
                );
                expect(onError).not.toBeCalled();
            });
        });

        describe('with enableVerificationCode = true', () => {
            test('by email', async () => {
                expect.assertions(11);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({
                    challengeId: 'azerty',
                });

                verifyPasswordless.mockResolvedValue();

                await generateComponent({
                    authType: 'magic_link',
                    enableVerificationCode: true,
                });

                // Intro
                expect(screen.getByText('passwordless.intro')).toBeInTheDocument();

                // Label
                expect(screen.getByLabelText('email')).toBeInTheDocument();

                // Input phone number
                const emailInput = screen.getByRole('textbox', { name: 'email' });
                expect(emailInput).toBeInTheDocument();

                // Form button
                const submitBtn = screen.getByRole('button', { name: 'send' });
                expect(submitBtn).toHaveTextContent('send');

                await user.type(emailInput, 'alice@reach5.co');
                await user.click(submitBtn);

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        email: 'alice@reach5.co',
                    }),
                    undefined // auth
                );

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        name: 'otp_sent',
                    })
                );

                const verificationCodeInput = screen.getByRole('textbox', {
                    name: 'verificationCode',
                });
                expect(verificationCodeInput).toBeInTheDocument();

                const submitCodeBtn = screen.getByRole('button', { name: 'send' });
                expect(submitCodeBtn).toHaveTextContent('send');

                await user.type(verificationCodeInput, '123456');
                await user.click(submitCodeBtn);

                expect(verifyPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'magic_link',
                        email: 'alice@reach5.co',
                        verificationCode: '123456',
                    })
                );

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authResult: expect.objectContaining({}),
                        name: 'login',
                    })
                );
                expect(onError).not.toBeCalled();
            });

            test('by phone number', async () => {
                expect.assertions(11);

                const user = userEvent.setup();

                startPasswordless.mockResolvedValue({
                    challengeId: 'azerty',
                });

                verifyPasswordless.mockResolvedValue();

                await generateComponent({
                    authType: 'sms',
                    enableVerificationCode: true,
                });

                // Intro
                expect(screen.getByText('passwordless.sms.intro')).toBeInTheDocument();

                // Label
                expect(screen.getByLabelText('phoneNumber')).toBeInTheDocument();

                // Input phone number
                const phoneNumberInput = screen.getByRole('textbox', { name: 'phoneNumber' });
                expect(phoneNumberInput).toBeInTheDocument();

                // Form button
                const submitBtn = screen.getByRole('button', { name: 'send' });
                expect(submitBtn).toHaveTextContent('send');

                await user.type(phoneNumberInput, '+33612345678');
                await user.click(submitBtn);

                expect(startPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        phoneNumber: '+33612345678',
                    }),
                    undefined // auth
                );

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        name: 'otp_sent',
                    })
                );

                const verificationCodeInput = screen.getByRole('textbox', {
                    name: 'verificationCode',
                });
                expect(verificationCodeInput).toBeInTheDocument();

                const submitCodeBtn = screen.getByRole('button', { name: 'send' });
                expect(submitCodeBtn).toHaveTextContent('send');

                await user.type(verificationCodeInput, '123456');
                await user.click(submitCodeBtn);

                expect(verifyPasswordless).toBeCalledWith(
                    expect.objectContaining({
                        authType: 'sms',
                        phoneNumber: '+33612345678',
                        verificationCode: '123456',
                    })
                );

                expect(onSuccess).toBeCalledWith(
                    expect.objectContaining({
                        authResult: expect.objectContaining({}),
                        name: 'login',
                    })
                );
                expect(onError).not.toBeCalled();
            });
        });

        test('api failure', async () => {
            const user = userEvent.setup();

            startPasswordless.mockRejectedValue('Unexpected error');

            await generateComponent();

            const emailInput = screen.getByRole('textbox', { name: 'email' });
            const submitBtn = screen.getByRole('button', { name: 'send' });

            await user.type(emailInput, 'alice@reach5.co');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalled();

            expect(onSuccess).not.toBeCalled();
            expect(onError).toBeCalledWith('Unexpected error');
        });

        test('api failure on code verification', async () => {
            const user = userEvent.setup();

            startPasswordless.mockResolvedValue({
                challengeId: 'azerty',
            });

            verifyPasswordless.mockRejectedValue('Unexpected error');

            await generateComponent({ authType: 'sms' });

            const phoneNumberInput = screen.getByRole('textbox', { name: 'phoneNumber' });
            const submitBtn = screen.getByRole('button', { name: 'send' });

            await user.type(phoneNumberInput, '+33612345678');
            await user.click(submitBtn);

            expect(startPasswordless).toBeCalled();

            const verificationCodeInput = screen.getByRole('textbox', { name: 'verificationCode' });
            const submitCodeBtn = screen.getByRole('button', { name: 'send' });

            await user.type(verificationCodeInput, '123456');
            await user.click(submitCodeBtn);

            expect(verifyPasswordless).toBeCalled();

            expect(onSuccess).not.toBeCalledWith(expect.objectContaining({ name: 'login' }));
            expect(onError).toBeCalledWith('Unexpected error');
        });
    });
});
