import { useEffect } from 'react';

import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
    type QueryKey,
} from '@tanstack/react-query';

import type { Client as CoreClient } from '@reachfive/identity-core';

import { useReachfive } from '@/contexts/reachfive';
import { webAuthnKeys } from '@/widgets/webAuthn/queries';

import type { OnError, OnSuccess } from '@/types';
import type { SuccessEvent } from '@/types/events';
import type { MfaCredential } from '@/widgets/mfa/credentials';

/**
 * Query keys of the MFA resources, namespaced so they never collide with another widget's.
 */
const mfaKeys = {
    credentials: () => ['mfa', 'credentials'] as const satisfies QueryKey,
};

/**
 * The user's MFA credentials, read through suspense: the component renders only once they are
 * loaded, and a failed first load is thrown to the nearest error boundary.
 */
export const useMfaCredentials = (accessToken: string) => {
    const client = useReachfive();

    return useSuspenseQuery({
        queryKey: mfaKeys.credentials(),
        queryFn: () => client.listMfaCredentials(accessToken),
    });
};

/**
 * Refetches the MFA credentials list after a change. A failed refetch keeps the cached list on
 * screen (a suspense query only throws without data) and is reported once through `onError`.
 */
export const useInvalidateMfaCredentials = (onError: OnError) => {
    const queryClient = useQueryClient();

    return () =>
        queryClient
            .invalidateQueries({ queryKey: mfaKeys.credentials() }, { throwOnError: true })
            .catch(onError);
};

const removeMfaCredential = (
    client: CoreClient,
    accessToken: string,
    credential: MfaCredential
): Promise<SuccessEvent> => {
    switch (credential.type) {
        case 'email':
            return client
                .removeMfaEmail({ accessToken })
                .then(() => ({ name: 'mfa_email_deleted' }) as const);
        case 'sms':
            return client
                .removeMfaPhoneNumber({ accessToken, phoneNumber: credential.phoneNumber })
                .then(() => ({ name: 'mfa_phone_number_deleted' }) as const);
    }
};

type UseRemoveMfaCredentialOptions = {
    accessToken: string;
    onSuccess: OnSuccess;
    onError: OnError;
};

/**
 * Removes an MFA credential. No optimistic update: on success the deletion
 * event fires and the credentials list is refetched; on failure the list is left untouched.
 */
export const useRemoveMfaCredential = ({
    accessToken,
    onSuccess,
    onError,
}: UseRemoveMfaCredentialOptions) => {
    const client = useReachfive();
    const invalidateCredentials = useInvalidateMfaCredentials(onError);

    return useMutation({
        mutationFn: (credential: MfaCredential) =>
            removeMfaCredential(client, accessToken, credential),
        onSuccess: event => {
            onSuccess(event);
            return invalidateCredentials();
        },
        onError: error => onError(error),
    });
};

/**
 * Drops the passkey devices when the Passkeys view closes: a cached error would be thrown again
 * without a retry, so reopening the view always loads afresh.
 */
export const useForgetPasskeyDevicesOnLeave = () => {
    const queryClient = useQueryClient();

    useEffect(
        () => () => queryClient.removeQueries({ queryKey: webAuthnKeys.devices() }),
        [queryClient]
    );
};
