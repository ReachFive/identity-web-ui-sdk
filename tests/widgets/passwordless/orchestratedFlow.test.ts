/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createClient, type AuthOptions } from '@reachfive/identity-core';

import { type I18nMessages } from '../../../src/contexts/i18n';
import passwordlessWidget from '../../../src/widgets/passwordless/passwordlessWidget';

import type { Config, OnError, OnSuccess } from '../../../src/types';

/**
 * Squash: Passwordless > 05 - Orchestrated Flow > 05.01 - SDK-UI
 *
 * The Squash cases play a hosted pages flow end to end. These tests replay the SDK side of it: the
 * widget runs on the real core client, under an `r5_request_token`, and only the HTTP layer and the
 * browser navigation are mocked. What the backend does with the requests (response type, PKCE
 * binding, token exchange) stays covered by Squash.
 */

const DOMAIN = 'local.reach5.net';
const CLIENT_ID = 'local';
const ORCHESTRATION_TOKEN = 'orchestration-token';

const defaultConfig: Config = {
    clientId: CLIENT_ID,
    domain: DOMAIN,
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
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
};

const defaultI18n: I18nMessages = {};

const VALID_CODE = '123456';
const INVALID_CODE = '000000';

const BASE_URL = `https://${DOMAIN}`;

const jsonResponse = (status: number, body?: object) =>
    Promise.resolve(
        new Response(body === undefined ? null : JSON.stringify(body), {
            status,
            headers: { 'Content-Type': 'application/json' },
        })
    );

// The core client always calls fetch with an absolute URL string and a JSON string body.
const pathOf = (input: Parameters<typeof fetch>[0]) =>
    (input as string).slice(BASE_URL.length).split('?')[0];

const bodyOf = (init?: RequestInit) => JSON.parse(init?.body as string) as Record<string, string>;

describe('Orchestrated flow (Squash 05.01 - SDK-UI)', () => {
    const fetchMock = jest.fn<typeof fetch>();
    const assign = jest.fn<Location['assign']>();
    const originalLocation = window.location;
    const originalFetch = global.fetch;

    const onError = jest.fn<OnError>();
    const onSuccess = jest.fn<OnSuccess>();

    beforeEach(() => {
        fetchMock.mockReset();
        assign.mockReset();
        onError.mockReset();
        onSuccess.mockReset();

        fetchMock.mockImplementation((input, init) => {
            switch (pathOf(input)) {
                case '/identity/v1/config':
                    return jsonResponse(200, { sso: false, language: 'fr', isPublic: true });
                case '/identity/v1/passwordless/start':
                    return jsonResponse(200, {});
                case '/identity/v1/verify-auth-code': {
                    return bodyOf(init).verification_code === VALID_CODE
                        ? jsonResponse(204)
                        : jsonResponse(400, {
                              error: 'invalid_grant',
                              error_description: 'Invalid verification code',
                              error_user_msg: 'Invalid verification code',
                          });
                }
                default:
                    return jsonResponse(404, { error: 'not_found' });
            }
        });
        global.fetch = fetchMock;

        // The hosted page is opened by the authorization endpoint with the orchestration token.
        window.history.replaceState({}, '', `/?r5_request_token=${ORCHESTRATION_TOKEN}`);
        window.localStorage.setItem('correlationId', 'correlation-id');
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...originalLocation, search: originalLocation.search, assign },
        });
    });

    afterEach(() => {
        Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
        window.history.replaceState({}, '', '/');
        window.localStorage.clear();
        global.fetch = originalFetch;
    });

    const generateComponent = async (options: Parameters<typeof passwordlessWidget>[0] = {}) => {
        const apiClient = createClient({ clientId: CLIENT_ID, domain: DOMAIN });

        const result = await passwordlessWidget(
            { onError, onSuccess, ...options },
            { config: defaultConfig, apiClient, defaultI18n }
        );

        return render(result);
    };

    const requestsTo = (pathname: string) =>
        fetchMock.mock.calls.filter(([input]) => pathOf(input) === pathname);

    const startBody = () => {
        const [start] = requestsTo('/identity/v1/passwordless/start');
        return bodyOf(start[1]);
    };

    const verifyRedirect = async () => {
        await waitFor(() => expect(assign).toHaveBeenCalledTimes(1));
        const [path, query] = String(assign.mock.calls[0][0]).split('?');
        return { path, params: Object.fromEntries(new URLSearchParams(query)) };
    };

    const startWithEmail = async (user: ReturnType<typeof userEvent.setup>) => {
        await user.type(screen.getByRole('textbox', { name: 'email' }), 'alice@reach5.co');
        await user.click(screen.getByRole('button', { name: 'send' }));
    };

    // The last digit submits the code by itself.
    const submitCode = async (user: ReturnType<typeof userEvent.setup>, code: string) => {
        const verifications = requestsTo('/identity/v1/verify-auth-code').length;
        const input = screen.getByRole('textbox', { name: 'verificationCode' });
        await user.clear(input);
        await user.type(input, code);
        await waitFor(() =>
            expect(requestsTo('/identity/v1/verify-auth-code')).toHaveLength(verifications + 1)
        );
    };

    // 05.01.01, 05.01.02 and 05.01.03 differ only by the authorization request that opened the
    // flow (code, code + PKCE, token), which the widget never sees: the code challenge lives in that
    // request. The backend keeps it, so the verify step carries no auth parameter at all, whatever
    // the auth options of the widget. With core 1.41.0, it sent `response_type=token` by default.
    const authRequests: { name: string; auth?: AuthOptions }[] = [
        { name: '05.01.01 / 05.01.02 - response_type code, with or without PKCE' },
        { name: '05.01.03 - response_type token', auth: { responseType: 'token' } },
    ];

    test.each(authRequests)(
        '$name: email verification code redirects without auth parameters',
        async ({ auth }) => {
            const user = userEvent.setup();

            await generateComponent({ authType: 'magic_link', enableVerificationCode: true, auth });

            await startWithEmail(user);

            expect(startBody()).toEqual(
                expect.objectContaining({
                    auth_type: 'magic_link',
                    email: 'alice@reach5.co',
                    client_id: CLIENT_ID,
                    r5_request_token: ORCHESTRATION_TOKEN,
                })
            );

            await submitCode(user, VALID_CODE);

            expect(requestsTo('/identity/v1/verify-auth-code')).toHaveLength(1);

            const redirect = await verifyRedirect();
            expect(redirect.path).toBe(`${BASE_URL}/identity/v1/passwordless/verify`);
            expect(redirect.params).toEqual({
                auth_type: 'magic_link',
                email: 'alice@reach5.co',
                verification_code: VALID_CODE,
            });

            expect(onError).not.toBeCalled();
        }
    );

    test('05.01.04 - SMS verification code redirects with the phone number only', async () => {
        const user = userEvent.setup();

        await generateComponent({ authType: 'sms' });

        await user.type(screen.getByRole('textbox', { name: 'phoneNumber' }), '+33612345678');
        await user.click(screen.getByRole('button', { name: 'send' }));

        expect(startBody()).toEqual(
            expect.objectContaining({
                auth_type: 'sms',
                phone_number: '+33612345678',
                r5_request_token: ORCHESTRATION_TOKEN,
            })
        );

        await submitCode(user, VALID_CODE);

        const redirect = await verifyRedirect();
        expect(redirect.path).toBe(`${BASE_URL}/identity/v1/passwordless/verify`);
        expect(redirect.params).toEqual({
            auth_type: 'sms',
            phone_number: '+33612345678',
            verification_code: VALID_CODE,
        });

        expect(onError).not.toBeCalled();
    });

    test('05.01.05 - magic link: the widget does not verify anything after the start', async () => {
        const user = userEvent.setup();

        await generateComponent({ authType: 'magic_link', enableVerificationCode: true });

        await startWithEmail(user);

        expect(screen.getByRole('textbox', { name: 'verificationCode' })).toBeInTheDocument();
        expect(requestsTo('/identity/v1/passwordless/start')).toHaveLength(1);

        // The magic link of the email completes the flow on its own, outside the widget.
        expect(requestsTo('/identity/v1/verify-auth-code')).toHaveLength(0);
        expect(assign).not.toBeCalled();
    });

    test('05.01.06 - a wrong verification code is rejected without redirecting', async () => {
        const user = userEvent.setup();

        await generateComponent({ authType: 'magic_link', enableVerificationCode: true });

        await startWithEmail(user);

        await submitCode(user, INVALID_CODE);

        expect(requestsTo('/identity/v1/verify-auth-code')).toHaveLength(1);
        expect(await screen.findByText('Invalid verification code')).toBeInTheDocument();
        expect(onError).toBeCalledWith(expect.objectContaining({ error: 'invalid_grant' }));
        expect(assign).not.toBeCalled();

        await submitCode(user, VALID_CODE);

        expect(requestsTo('/identity/v1/verify-auth-code')).toHaveLength(2);
        expect((await verifyRedirect()).params).toEqual({
            auth_type: 'magic_link',
            email: 'alice@reach5.co',
            verification_code: VALID_CODE,
        });
    });
});
