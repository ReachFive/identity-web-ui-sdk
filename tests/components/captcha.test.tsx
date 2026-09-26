/**
 * @jest-environment jsdom
 */
import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CaptchaProvider, useCaptcha } from '@/components/captcha';
import { Form } from '@/components/form/form';
import { I18nMessages } from '@/contexts/i18n';
import { Config } from '@/types';

import { WidgetContext } from './form/WidgetContext';

type WidgetProps = {
    onError?: (error?: Error | string) => void;
    onVerify?: (token: string) => void;
};

// the props of the last widget rendered, and how many times one was mounted
const widget: { props?: WidgetProps; mounts: number } = { mounts: 0 };

jest.mock('@captchafox/react', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require('react') as typeof import('react');
    return {
        CaptchaFox: React.forwardRef<{ execute: () => Promise<string> }, WidgetProps>(
            function FakeCaptchaFox(props, ref) {
                widget.props = props;
                React.useImperativeHandle(ref, () => ({ execute: () => Promise.resolve('token') }));
                React.useEffect(() => {
                    widget.mounts += 1;
                }, []);
                return <div data-testid="captchafox" />;
            }
        ),
    };
});

const defaultConfig = {
    clientId: 'local',
    domain: 'local.reach5.net',
    language: 'en',
    loginTypeAllowed: { email: true, phoneNumber: true, customIdentifier: true },
    customFields: [],
} as unknown as Config;

const defaultI18n: I18nMessages = {};

const captchaFox = {
    action: 'login',
    captchaFoxEnabled: true,
    captchaFoxSiteKey: 'site-key',
} as const;

function Captcha() {
    const { Captcha } = useCaptcha();
    return Captcha ? <Captcha /> : null;
}

describe('CaptchaProvider with CaptchaFox', () => {
    beforeEach(() => {
        widget.props = undefined;
        widget.mounts = 0;
    });

    test('displays the widget error, and clears it once the widget verifies', () => {
        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CaptchaProvider {...captchaFox}>
                    <Captcha />
                </CaptchaProvider>
            </WidgetContext>
        );

        act(() => widget.props?.onError?.('Captcha failed'));
        expect(screen.getByRole('alert')).toHaveTextContent('Captcha failed');

        act(() => widget.props?.onVerify?.('token'));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('keeps the widget mounted when the provider renders again', () => {
        const Tree = ({ label }: { label: string }) => (
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CaptchaProvider {...captchaFox}>
                    <span>{label}</span>
                    <Captcha />
                </CaptchaProvider>
            </WidgetContext>
        );
        const { rerender } = render(<Tree label="first" />);
        rerender(<Tree label="second" />);

        expect(screen.getByText('second')).toBeInTheDocument();
        expect(widget.mounts).toBe(1);
    });

    test('a widget error does not prevent the form from being submitted again', async () => {
        const user = userEvent.setup();
        const handler = jest.fn<(data: unknown) => Promise<void>>().mockResolvedValue();

        render(
            <WidgetContext config={defaultConfig} defaultMessages={defaultI18n}>
                <CaptchaProvider {...captchaFox}>
                    <Form fields={[{ key: 'givenName', required: false }]} handler={handler} />
                </CaptchaProvider>
            </WidgetContext>
        );

        act(() => widget.props?.onError?.('Captcha failed'));
        await user.click(screen.getByRole('button', { name: 'send' }));

        await waitFor(() =>
            expect(handler).toBeCalledWith(expect.objectContaining({ captchaToken: 'token' }))
        );
    });
});
