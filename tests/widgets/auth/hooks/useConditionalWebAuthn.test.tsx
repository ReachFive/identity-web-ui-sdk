import React, { PropsWithChildren } from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

import type { Client } from '@reachfive/identity-core';

import { ReachfiveProvider } from '../../../../src/contexts/reachfive';
import { useConditionalWebAuthn } from '../../../../src/widgets/auth/hooks/useConditionalWebAuthn';

import type { OnError } from '../../../../src/types';

type LoginArg = {
    conditionalMediation?: unknown;
    auth?: unknown;
    signal?: AbortSignal;
};

function setup(
    loginImpl: (params: LoginArg) => Promise<unknown> = () => new Promise<unknown>(() => {})
) {
    const loginWithWebAuthn = jest.fn<(params: LoginArg) => Promise<unknown>>(loginImpl);
    const coreClient = { loginWithWebAuthn } as unknown as Client;
    const onError = jest.fn<OnError>();
    const wrapper = ({ children }: PropsWithChildren) => (
        <ReachfiveProvider client={coreClient}>{children}</ReachfiveProvider>
    );
    return { loginWithWebAuthn, onError, wrapper };
}

/** Flush the microtask that runs the promise `.catch` inside the hook. */
async function flushMicrotasks() {
    await act(async () => {
        await Promise.resolve();
    });
}

describe('useConditionalWebAuthn', () => {
    test('starts a conditional (autofill) request once on mount', () => {
        const { loginWithWebAuthn, onError, wrapper } = setup();
        const auth = { scope: 'openid profile' };

        renderHook(() => useConditionalWebAuthn({ auth, onError }), { wrapper });

        expect(loginWithWebAuthn).toHaveBeenCalledTimes(1);
        const arg = loginWithWebAuthn.mock.calls[0][0];
        expect(arg.conditionalMediation).toBe('preferred');
        expect(arg.auth).toEqual(auth);
        expect(arg.signal).toBeInstanceOf(AbortSignal);
        expect(arg.signal?.aborted).toBe(false);
    });

    test('does not start the request when disabled, and starts it when enabled becomes true', () => {
        const { loginWithWebAuthn, onError, wrapper } = setup();

        const { rerender } = renderHook(
            ({ enabled }: { enabled: boolean }) => useConditionalWebAuthn({ enabled, onError }),
            { initialProps: { enabled: false }, wrapper }
        );

        expect(loginWithWebAuthn).not.toHaveBeenCalled();

        rerender({ enabled: true });

        expect(loginWithWebAuthn).toHaveBeenCalledTimes(1);
    });

    test('does not restart the request when the auth reference changes on re-render', () => {
        const { loginWithWebAuthn, onError, wrapper } = setup();

        const { rerender } = renderHook(
            ({ auth }: { auth: object }) => useConditionalWebAuthn({ auth, onError }),
            { initialProps: { auth: { scope: 'a' } }, wrapper }
        );

        expect(loginWithWebAuthn).toHaveBeenCalledTimes(1);

        // New object with same content, then different content: the autofill request must NOT be
        // torn down and recreated — otherwise the browser never shows autofill suggestions.
        rerender({ auth: { scope: 'a' } });
        rerender({ auth: { scope: 'b' } });

        expect(loginWithWebAuthn).toHaveBeenCalledTimes(1);
    });

    test('abort() cancels the pending request signal', () => {
        const { loginWithWebAuthn, onError, wrapper } = setup();

        const { result } = renderHook(() => useConditionalWebAuthn({ onError }), { wrapper });
        const { signal } = loginWithWebAuthn.mock.calls[0][0];
        expect(signal?.aborted).toBe(false);

        act(() => result.current.abort());

        expect(signal?.aborted).toBe(true);
    });

    test('aborts the request when the component unmounts', () => {
        const { loginWithWebAuthn, onError, wrapper } = setup();

        const { unmount } = renderHook(() => useConditionalWebAuthn({ onError }), { wrapper });
        const { signal } = loginWithWebAuthn.mock.calls[0][0];

        unmount();

        expect(signal?.aborted).toBe(true);
    });

    test('does not forward an AbortError to onError', async () => {
        const abortError = new DOMException('signal is aborted without reason', 'AbortError');
        const { onError, wrapper } = setup(() => Promise.reject(abortError));

        renderHook(() => useConditionalWebAuthn({ onError }), { wrapper });
        await flushMicrotasks();

        expect(onError).not.toHaveBeenCalled();
    });

    test('forwards a non-abort error to onError', async () => {
        const error = new Error('boom');
        const { onError, wrapper } = setup(() => Promise.reject(error));

        renderHook(() => useConditionalWebAuthn({ onError }), { wrapper });
        await flushMicrotasks();

        expect(onError).toHaveBeenCalledWith(error);
    });
});
