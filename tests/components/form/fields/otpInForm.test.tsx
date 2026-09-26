/**
 * @jest-environment jsdom
 */
import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Form } from '@/components/form/form';
import { I18nMessages } from '@/contexts/i18n';
import { type Field, type FieldDefinition } from '@/lib/form';
import { Config } from '@/types';

import { WidgetContext } from '../WidgetContext';

const defaultConfig: Config = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'en',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: [],
    customProviders: {},
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
    verificationCodeLength: 6,
    verificationCodeMaxTrials: 2,
};

const defaultI18n: I18nMessages = {};

/** The error the API answers for any refused code: wrong, out of trials or expired alike. */
const refusedCode = {
    error: 'invalid_grant',
    errorDescription: 'Invalid verification code',
    errorMessageKey: 'error.invalidVerificationCode',
};

type Data = { verificationCode: string };

/**
 * The code field as the widgets declare it, after another field: nothing about it depends on its
 * position in the form.
 */
function renderForm({
    code = {},
    handler = jest.fn<(data: Data) => Promise<void>>().mockResolvedValue(),
}: {
    code?: Partial<FieldDefinition<'otp'>>;
    handler?: (data: Data) => Promise<void>;
} = {}) {
    render(
        <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
            <Form<Data>
                fields={[
                    { key: 'givenName', required: false },
                    { key: 'verification_code', ...code } as Field,
                ]}
                handler={handler}
            />
        </WidgetContext>
    );
    return { handler };
}

const codeInput = () => screen.getByLabelText('verificationCode');
const submitButton = () => screen.getByRole('button', { name: 'send' });
const resendButton = () => screen.getByRole('button', { name: 'verificationCode.resend' });

const slotStatuses = () =>
    Array.from(document.querySelectorAll('[data-slot="widget-otp-slot"]')).map(slot =>
        slot.getAttribute('data-status')
    );

describe('otp field in a form', () => {
    // refused codes make the Form call logError(), which logs to console.error by design
    let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    test('submits the code once its last digit is typed and shows it accepted', async () => {
        const user = userEvent.setup();
        const { handler } = renderForm({ code: { onResend: jest.fn<() => Promise<void>>() } });

        await user.type(codeInput(), '123456');

        await waitFor(() => expect(handler).toBeCalledWith({ verificationCode: '123456' }));
        await waitFor(() => expect(slotStatuses()).toEqual(Array(6).fill('success')));
        expect(submitButton()).toBeDisabled();
        // an accepted code is already on its way: no other one is needed
        expect(resendButton()).toBeDisabled();
    });

    test('does not submit by itself when autoSubmit is off', async () => {
        const user = userEvent.setup();
        const { handler } = renderForm({ code: { autoSubmit: false } });

        await user.type(codeInput(), '123456');
        expect(handler).not.toBeCalled();

        await user.click(submitButton());
        expect(handler).toBeCalledWith({ verificationCode: '123456' });
    });

    test('shows a refused code under the field', async () => {
        const user = userEvent.setup();
        renderForm({
            handler: jest.fn<(data: Data) => Promise<void>>().mockRejectedValue(refusedCode),
        });

        await user.type(codeInput(), '123456');

        await waitFor(() =>
            expect(codeInput()).toHaveAccessibleErrorMessage('Invalid verification code')
        );
        expect(slotStatuses()).toEqual(Array(6).fill('error'));
        expect(codeInput()).toBeEnabled();
    });

    test('locks the code once it was refused as many times as the tenant accepts', async () => {
        const user = userEvent.setup();
        const handler = jest.fn<(data: Data) => Promise<void>>().mockRejectedValue(refusedCode);
        renderForm({ code: { onResend: jest.fn<() => Promise<void>>() }, handler });

        await user.type(codeInput(), '123456');
        await waitFor(() => expect(handler).toBeCalledTimes(1));
        expect(screen.queryByText('verificationCode.unusable.title')).not.toBeInTheDocument();

        await user.type(codeInput(), '{Backspace}7');
        await waitFor(() => expect(handler).toBeCalledTimes(2));

        expect(await screen.findByText('verificationCode.unusable.title')).toBeInTheDocument();
        expect(codeInput()).toBeDisabled();
        expect(slotStatuses()).toEqual(Array(6).fill('disabled'));
        expect(submitButton()).toBeDisabled();
    });

    test('does not show a code accepted when the request failed without an API error', async () => {
        const user = userEvent.setup();
        renderForm({
            handler: jest
                .fn<(data: Data) => Promise<void>>()
                .mockRejectedValue(new TypeError('Failed to fetch')),
        });

        await user.type(codeInput(), '123456');

        await waitFor(() => expect(submitButton()).toBeEnabled());
        expect(slotStatuses()).not.toContain('success');
        expect(codeInput()).toBeEnabled();
    });

    test('does not count an error which is not about the code', async () => {
        const user = userEvent.setup();
        const handler = jest.fn<(data: Data) => Promise<void>>().mockRejectedValue({
            error: 'rate_limit_reached',
            errorDescription: 'Too many attempts',
            errorMessageKey: 'error.tooManyAttempts',
        });
        renderForm({ handler });

        await user.type(codeInput(), '123456');
        await user.type(codeInput(), '{Backspace}7');
        await waitFor(() => expect(handler).toBeCalledTimes(2));

        expect(screen.queryByText('verificationCode.unusable.title')).not.toBeInTheDocument();
        expect(codeInput()).toBeEnabled();
        // it is not about the code either: it stays above the form
        expect(codeInput()).not.toHaveAccessibleErrorMessage();
    });

    test('reaches the limit at once when the flow cannot send another code', async () => {
        const user = userEvent.setup();
        const handler = jest.fn<(data: Data) => Promise<void>>().mockRejectedValue(refusedCode);
        renderForm({ handler });

        await user.type(codeInput(), '123456');
        await user.type(codeInput(), '{Backspace}7');

        expect(await screen.findByText('verificationCode.limitReached.title')).toBeInTheDocument();
        expect(codeInput()).toBeDisabled();
    });

    test('hides the resend link when the flow cannot resend', () => {
        renderForm();

        expect(
            screen.queryByRole('button', { name: 'verificationCode.resend' })
        ).not.toBeInTheDocument();
    });

    test('sends a new code, which unlocks and clears the field', async () => {
        const user = userEvent.setup();
        const onResend = jest.fn<() => Promise<void>>().mockResolvedValue();
        renderForm({
            code: { onResend },
            handler: jest.fn<(data: Data) => Promise<void>>().mockRejectedValue(refusedCode),
        });

        await user.type(codeInput(), '123456');
        await user.type(codeInput(), '{Backspace}7');
        await screen.findByText('verificationCode.unusable.title');

        // the link stays available on a locked code, so that an expired code never leaves the
        // user stuck
        await user.click(resendButton());

        expect(onResend).toBeCalledTimes(1);
        await waitFor(() => expect(codeInput()).toBeEnabled());
        expect(codeInput()).toHaveValue('');
        expect(codeInput()).not.toHaveAccessibleErrorMessage();
        expect(screen.queryByText('verificationCode.unusable.title')).not.toBeInTheDocument();
        expect(submitButton()).toBeEnabled();
    });

    test('passes the captcha token to the resend request', async () => {
        const user = userEvent.setup();
        const onResend = jest.fn<() => Promise<void>>().mockResolvedValue();
        renderForm({ code: { onResend, resendCaptcha: { action: 'passwordless_phone' } } });

        await user.click(resendButton());

        expect(onResend).toBeCalledWith({});
    });

    test('counts the codes sent against the limit and stops at it', async () => {
        const user = userEvent.setup();
        const onResend = jest.fn<() => Promise<void>>().mockResolvedValue();
        renderForm({ code: { onResend, maxSends: 2 } });

        // the count is part of the link, as in the mockup: "Resend code (1 of 2 sent)"
        const countedResendButton = () =>
            screen.getByRole('button', { name: 'verificationCode.resend.count' });
        await user.click(countedResendButton());

        await waitFor(() => expect(countedResendButton()).toBeDisabled());
        expect(onResend).toBeCalledTimes(1);
    });

    test('reaches the limit once the last code which could be sent is unusable', async () => {
        const user = userEvent.setup();
        const handler = jest.fn<(data: Data) => Promise<void>>().mockRejectedValue(refusedCode);
        renderForm({
            // the first code is the only one the flow may send
            code: { onResend: jest.fn<() => Promise<void>>(), maxSends: 1 },
            handler,
        });

        await user.type(codeInput(), '123456');
        await waitFor(() => expect(handler).toBeCalledTimes(1));
        // a code may still be typed while no other one can be sent
        expect(codeInput()).toBeEnabled();

        await user.type(codeInput(), '{Backspace}7');

        expect(await screen.findByText('verificationCode.limitReached.title')).toBeInTheDocument();
        expect(screen.queryByText('verificationCode.unusable.title')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'verificationCode.resend.count' })
        ).not.toBeInTheDocument();
        expect(codeInput()).toBeDisabled();
        expect(submitButton()).toBeDisabled();
    });

    test('shows why a new code could not be sent', async () => {
        const user = userEvent.setup();
        const onResend = jest.fn<() => Promise<void>>().mockRejectedValue({
            error: 'rate_limit_reached',
            errorDescription: 'Too many attempts',
            errorMessageKey: 'error.tooManyAttempts',
        });
        renderForm({ code: { onResend } });

        await user.click(resendButton());

        expect(await screen.findByText('Too many attempts')).toBeInTheDocument();
        expect(resendButton()).toBeEnabled();
    });
});
