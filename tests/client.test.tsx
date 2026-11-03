/**
 * @jest-environment jsdom
 */
import React, { useEffect } from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, screen, waitFor } from '@testing-library/react';

import type { Client as CoreClient } from '@reachfive/identity-core';

import { UiClient, type WidgetInstance } from '@/client';
import { type I18nMessages } from '@/contexts/i18n';
import passwordResetWidget from '@/widgets/passwordReset/passwordResetWidget';

import type { Config } from '@/types';

// The widget itself is replaced by a probe: these tests are about how the client mounts and
// unmounts widgets in their container, whatever the widget renders.
jest.mock('@/widgets/passwordReset/passwordResetWidget', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const mockedWidget = passwordResetWidget as jest.MockedFunction<typeof passwordResetWidget>;

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
};

const defaultI18n: I18nMessages = {};

const unmounted: string[] = [];

/** Renders its name and records when React unmounts it. */
function Probe({ name }: { name: string }) {
    useEffect(() => () => void unmounted.push(name), [name]);
    return <p>{name}</p>;
}

const deferred = <T,>() => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

/** The next widget call renders a probe named `name` once `ready` resolves. */
const nextWidget = (name: string, ready: Promise<void> = Promise.resolve()) =>
    mockedWidget.mockImplementationOnce(async () => {
        await ready;
        return <Probe name={name} />;
    });

const settle = () => act(() => new Promise<void>(resolve => setTimeout(resolve, 0)));

describe('UiClient widget lifecycle', () => {
    let container: HTMLElement;
    let client: UiClient;

    /** Shows a widget and lets its loading and first render run. */
    const show = async (options: Parameters<UiClient['showPasswordReset']>[0]) => {
        act(() => client.showPasswordReset(options));
        await settle();
    };

    beforeEach(() => {
        unmounted.length = 0;
        mockedWidget.mockReset();
        container = document.createElement('div');
        container.id = 'widget';
        document.body.appendChild(container);
        client = new UiClient(defaultConfig, {} as CoreClient, defaultI18n);
    });

    afterEach(() => {
        container.remove();
    });

    test('showing a widget in an occupied container unmounts the previous one', async () => {
        nextWidget('first');
        await show({ container: 'widget' });
        await screen.findByText('first');

        nextWidget('second');
        await show({ container: 'widget' });

        await screen.findByText('second');
        expect(screen.queryByText('first')).not.toBeInTheDocument();
        expect(unmounted).toEqual(['first']);
    });

    test('two calls fired back to back end with the second widget only', async () => {
        const firstReady = deferred<void>();
        nextWidget('first', firstReady.promise);
        nextWidget('second');

        const onFirstReady = jest.fn();
        act(() => {
            client.showPasswordReset({ container: 'widget', onReady: onFirstReady });
            client.showPasswordReset({ container: 'widget' });
        });
        await screen.findByText('second');

        // The first widget resolves last: it must not take the container back.
        act(() => firstReady.resolve());
        await settle();

        expect(screen.getByText('second')).toBeInTheDocument();
        expect(screen.queryByText('first')).not.toBeInTheDocument();
        expect(onFirstReady).not.toHaveBeenCalled();
    });

    test('destroy() passed to onReady unmounts the widget', async () => {
        nextWidget('only');
        let instance: WidgetInstance | undefined;
        await show({ container: 'widget', onReady: i => (instance = i) });
        await screen.findByText('only');

        act(() => instance?.destroy());

        expect(screen.queryByText('only')).not.toBeInTheDocument();
        expect(container).toBeEmptyDOMElement();
        expect(unmounted).toEqual(['only']);
    });

    test('a stale destroy() does not unmount the widget that replaced it', async () => {
        nextWidget('first');
        let firstInstance: WidgetInstance | undefined;
        await show({ container: 'widget', onReady: i => (firstInstance = i) });
        await screen.findByText('first');

        nextWidget('second');
        await show({ container: 'widget' });
        await screen.findByText('second');

        act(() => firstInstance?.destroy());

        expect(screen.getByText('second')).toBeInTheDocument();
        expect(unmounted).toEqual(['first']);
    });

    test('a widget can be shown again in a container after destroy()', async () => {
        nextWidget('first');
        let instance: WidgetInstance | undefined;
        await show({ container: 'widget', onReady: i => (instance = i) });
        await screen.findByText('first');
        act(() => instance?.destroy());

        nextWidget('second');
        await show({ container: 'widget' });

        await screen.findByText('second');
    });

    test('an error replaces the previous widget and is replaced by the next one', async () => {
        nextWidget('first');
        await show({ container: 'widget' });
        await screen.findByText('first');

        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        mockedWidget.mockRejectedValueOnce(new Error('Boom'));
        await show({ container: 'widget' });
        await screen.findByText('Boom');
        expect(consoleError).toHaveBeenCalledWith(new Error('Boom'));
        consoleError.mockRestore();
        expect(unmounted).toEqual(['first']);

        nextWidget('second');
        await show({ container: 'widget' });
        await screen.findByText('second');
        await waitFor(() => expect(screen.queryByText('Boom')).not.toBeInTheDocument());
    });
});
