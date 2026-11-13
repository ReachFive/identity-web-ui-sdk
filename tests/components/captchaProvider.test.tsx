import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';

import { CaptchaProvider, useCaptcha } from '@/components/captcha';

// A <script> tag is not content a user can reach, so Testing Library has no query for it, and
// what is under test here is precisely which scripts the page asks for.
// eslint-disable-next-line testing-library/no-node-access
const scripts = () =>
    // eslint-disable-next-line testing-library/no-node-access
    Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src'));

afterEach(() => {
    document.body.innerHTML = '';
    // The fake runtime is global: leaving it makes a later test look loaded when it is not.
    delete (window as Partial<Window>).grecaptcha;
});

/**
 * Mounting is what triggers the load, not submitting. These render the provider and assert on the
 * page without anyone interacting with it.
 */
describe('CaptchaProvider loads its provider on mount', () => {
    test('requests the reCAPTCHA script for a reCAPTCHA widget', async () => {
        render(
            <CaptchaProvider
                operation="login"
                captcha={{ provider: 'recaptcha', siteKey: 'mount-classic' }}
            >
                <span>form</span>
            </CaptchaProvider>
        );

        await waitFor(() =>
            expect(scripts()).toContain(
                'https://www.google.com/recaptcha/api.js?render=mount-classic'
            )
        );
    });

    test('requests the Enterprise script for an Enterprise widget', async () => {
        render(
            <CaptchaProvider
                operation="login"
                captcha={{ provider: 'recaptcha_enterprise', siteKey: 'mount-enterprise' }}
            >
                <span>form</span>
            </CaptchaProvider>
        );

        await waitFor(() =>
            expect(scripts()).toContain(
                'https://www.google.com/recaptcha/enterprise.js?render=mount-enterprise'
            )
        );
    });

    test('requests nothing when no captcha is configured', async () => {
        render(
            <CaptchaProvider operation="login">
                <span>form</span>
            </CaptchaProvider>
        );

        // Nothing to wait on, so give the effect a turn before asserting the absence.
        await waitFor(() => expect(document.body).toBeTruthy());
        expect(scripts().filter(src => src?.includes('recaptcha'))).toHaveLength(0);
    });

    test('requests nothing for CaptchaFox, which loads its own widget', async () => {
        render(
            <CaptchaProvider
                operation="login"
                captcha={{ provider: 'captchafox', siteKey: 'mount-fox' }}
            >
                <span>form</span>
            </CaptchaProvider>
        );

        await waitFor(() => expect(document.body).toBeTruthy());
        expect(scripts().filter(src => src?.includes('recaptcha'))).toHaveLength(0);
    });
});

const explicitScript = 'https://www.google.com/recaptcha/enterprise.js?render=explicit';

describe('a reCAPTCHA Enterprise checkbox key', () => {
    const renderWidget =
        jest.fn<(container: HTMLElement, parameters: { sitekey: string }) => number>();

    beforeEach(() => {
        renderWidget.mockReset();
        renderWidget.mockReturnValue(3);

        window.grecaptcha = {
            enterprise: {
                ready: (callback: () => void) => callback(),
                render: renderWidget,
            },
        } as unknown as Window['grecaptcha'];
    });

    // jsdom fetches nothing, so the load event the loader waits on has to be fired here. The
    // loader injects the tag once per URL, so there is nothing to fire on a later mount.
    const completeScriptLoad = () => {
        // eslint-disable-next-line testing-library/no-node-access
        const tag = document.querySelector<HTMLScriptElement>(`script[src="${explicitScript}"]`);
        tag?.onload?.(new Event('load'));
    };

    /** The widget only reaches the page through the form; this stands in for the form. */
    const ShowCaptcha = () => {
        const { Captcha } = useCaptcha();
        return Captcha ? <Captcha /> : <span>no captcha</span>;
    };

    const renderProvider = () =>
        render(
            <CaptchaProvider
                operation="login"
                captcha={{
                    provider: 'recaptcha_enterprise',
                    siteKey: 'mount-checkbox',
                    mode: 'checkbox',
                }}
            >
                <ShowCaptcha />
            </CaptchaProvider>
        );

    test('requests the explicit-render script, which carries no site key', async () => {
        renderProvider();

        await waitFor(() => expect(scripts()).toContain(explicitScript));
        expect(scripts()).not.toContain(
            'https://www.google.com/recaptcha/enterprise.js?render=mount-checkbox'
        );

        completeScriptLoad();
    });

    test('renders the widget into the form, with the action of the operation', async () => {
        renderProvider();

        await waitFor(() => {
            completeScriptLoad();
            expect(renderWidget).toHaveBeenCalledTimes(1);
        });
        expect(renderWidget).toHaveBeenCalledWith(expect.any(HTMLElement), {
            sitekey: 'mount-checkbox',
            action: 'password_login',
        });
    });
});
