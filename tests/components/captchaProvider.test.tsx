import React from 'react';

import { afterEach, describe, expect, test } from '@jest/globals';
import { render, waitFor } from '@testing-library/react';

import { CaptchaProvider } from '@/components/captcha';

// A <script> tag is not content a user can reach, so Testing Library has no query for it, and
// what is under test here is precisely which scripts the page asks for.
// eslint-disable-next-line testing-library/no-node-access
const scripts = () =>
    // eslint-disable-next-line testing-library/no-node-access
    Array.from(document.querySelectorAll('script')).map(s => s.getAttribute('src'));

afterEach(() => {
    document.body.innerHTML = '';
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
