import React from 'react';

import type { AuthOptions } from '@reachfive/identity-core';

import { useReachfive } from '../../../contexts/reachfive';

import type { OnError } from '../../../types';

interface UseConditionalWebAuthnParams {
    auth?: AuthOptions;
    /**
     * Whether the autofill request should be started.
     * @default true
     */
    enabled?: boolean;
    onError: OnError;
}

interface UseConditionalWebAuthnResult {
    /**
     * Cancels the pending autofill request. Must be called before starting another credentials
     * request (modal WebAuthn or password login).
     */
    abort: () => void;
}

/** Whether a rejected WebAuthn request failed because its AbortSignal fired (expected on cancel/unmount). */
function isAbortError(err: unknown): boolean {
    return (err as { name?: string } | null)?.name === 'AbortError';
}

/**
 * Starts a WebAuthn conditional-mediation ("autofill") request once on mount and exposes an
 * `abort` callback to cancel it.
 *
 * Chrome only allows a single navigator.credentials.get() at a time: the pending autofill request
 * must be aborted before launching another credentials request, otherwise the second one is
 * rejected with "A request is already pending.". The returned `abort` is meant to be called from
 * the submit handler; the request is also aborted automatically when the component unmounts (e.g.
 * navigating to another screen).
 *
 * `auth` and `onError` are read through refs so the request can be started a single time on mount
 * without depending on their referential stability. Re-renders therefore never tear the request
 * down and recreate it — which would otherwise prevent the browser from showing the autofill
 * suggestions.
 */
export function useConditionalWebAuthn({
    auth,
    enabled = true,
    onError,
}: UseConditionalWebAuthnParams): UseConditionalWebAuthnResult {
    const coreClient = useReachfive();

    const abortRef = React.useRef<AbortController | null>(null);

    const authRef = React.useRef(auth);
    authRef.current = auth;
    const onErrorRef = React.useRef(onError);
    onErrorRef.current = onError;

    React.useEffect(() => {
        if (!enabled) return;

        const controller = new AbortController();
        abortRef.current = controller;

        coreClient
            .loginWithWebAuthn({
                conditionalMediation: 'preferred',
                auth: {
                    ...authRef.current,
                },
                signal: controller.signal,
            })
            .catch((err: unknown) => {
                // Aborting the autofill request (submit, navigation, unmount) is expected.
                if (!isAbortError(err)) onErrorRef.current(err);
            });

        return () => controller.abort();
    }, [coreClient, enabled]);

    const abort = React.useCallback(() => abortRef.current?.abort(), []);

    return { abort };
}

export default useConditionalWebAuthn;
