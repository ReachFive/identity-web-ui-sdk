import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';

import type { AuthResult } from '@reachfive/identity-core';

import { completeStepUp } from '@/widgets/stepUp/redirect';

describe('completeStepUp', () => {
    const { location } = window;
    const replace = jest.fn();
    const authResult = { code: 'abc', state: 'xyz' } as AuthResult;

    const setLocation = (href: string) => {
        const url = new URL(href);
        Object.defineProperty(window, 'location', {
            value: { href: url.href, search: url.search, replace },
            writable: true,
        });
    };

    beforeAll(() => setLocation('https://site.example/login'));

    afterAll(() => {
        Object.defineProperty(window, 'location', { value: location, writable: true });
    });

    beforeEach(() => {
        replace.mockReset();
        setLocation('https://site.example/login');
    });

    test('adds the result to a redirect URI without query', () => {
        completeStepUp({ redirectUri: 'https://app.example/cb' }, authResult);
        expect(replace).toHaveBeenCalledWith('https://app.example/cb?code=abc&state=xyz');
    });

    test('keeps the query of the redirect URI', () => {
        completeStepUp({ redirectUri: 'https://app.example/cb?lang=fr' }, authResult);
        expect(replace).toHaveBeenCalledWith('https://app.example/cb?lang=fr&code=abc&state=xyz');
    });

    test('puts the result before the fragment of the redirect URI', () => {
        completeStepUp({ redirectUri: 'https://app.example/cb#done' }, authResult);
        expect(replace).toHaveBeenCalledWith('https://app.example/cb?code=abc&state=xyz#done');
    });

    test('replaces a parameter the redirect URI already has', () => {
        completeStepUp({ redirectUri: 'https://app.example/cb?code=old' }, authResult);
        expect(replace).toHaveBeenCalledWith('https://app.example/cb?code=abc&state=xyz');
    });

    test('writes the parameters in snake case and leaves out empty ones', () => {
        completeStepUp({ redirectUri: 'https://app.example/cb' }, {
            idToken: 'id',
            accessToken: undefined,
        } as AuthResult);
        expect(replace).toHaveBeenCalledWith('https://app.example/cb?id_token=id');
    });

    test('resolves a relative redirect URI against the current page', () => {
        completeStepUp({ redirectUri: '/cb' }, authResult);
        expect(replace).toHaveBeenCalledWith('https://site.example/cb?code=abc&state=xyz');
    });

    test('stays on the current page without redirect URI', () => {
        setLocation('https://site.example/login?lang=fr');
        completeStepUp(undefined, authResult);
        expect(replace).toHaveBeenCalledWith(
            'https://site.example/login?lang=fr&code=abc&state=xyz'
        );
    });

    test('does not redirect in an orchestrated flow', () => {
        setLocation('https://site.example/login?r5_request_token=t');
        completeStepUp({ redirectUri: 'https://app.example/cb' }, authResult);
        expect(replace).not.toHaveBeenCalled();
    });
});
