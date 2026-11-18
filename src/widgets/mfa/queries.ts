import { useEffect } from 'react';

import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
    type QueryKey,
} from '@tanstack/react-query';

import type { Client as CoreClient, MFA } from '@reachfive/identity-core';

import { useInvalidateQueries } from '@/components/widget/useInvalidateQueries';
import { useReachfive } from '@/contexts/reachfive';
import { webAuthnKeys } from '@/widgets/webAuthn/queries';

import type { OnError, OnSuccess } from '@/types';
import type { SuccessEvent } from '@/types/events';
import type { MfaCredential } from '@/widgets/mfa/credentials';

const mfaKeys = {
    credentials: () => ['mfa', 'credentials'] as const satisfies QueryKey,
};

/**
 * Read through suspense: the component renders once the credentials are loaded. A failed first
 * load is thrown to the nearest error boundary.
 */
export const useMfaCredentials = (accessToken: string) => {
    const client = useReachfive();

    return useSuspenseQuery({
        queryKey: mfaKeys.credentials(),
        queryFn: () => client.listMfaCredentials(accessToken),
    });
};

/** A failed refetch keeps the cached list and is passed once to `onError`. */
export const useInvalidateMfaCredentials = (onError: OnError) => {
    const invalidate = useInvalidateQueries(onError);
    return () => invalidate(mfaKeys.credentials());
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

const withoutCredential = (
    response: MFA.CredentialsResponse,
    removed: MfaCredential
): MFA.CredentialsResponse => ({
    ...response,
    credentials: response.credentials.filter(
        c => c.type !== removed.type || c.friendlyName !== removed.friendlyName
    ),
});

type UseRemoveMfaCredentialOptions = {
    accessToken: string;
    onSuccess: OnSuccess;
    onError: OnError;
};

/**
 * No optimistic update. On success, the credential is removed from the cached list, then the list
 * is refetched: a failed refetch does not show the deleted row again. On failure, the list stays
 * as it is.
 */
export const useRemoveMfaCredential = ({
    accessToken,
    onSuccess,
    onError,
}: UseRemoveMfaCredentialOptions) => {
    const client = useReachfive();
    const queryClient = useQueryClient();
    const invalidateCredentials = useInvalidateMfaCredentials(onError);

    return useMutation({
        mutationFn: (credential: MfaCredential) =>
            removeMfaCredential(client, accessToken, credential),
        onSuccess: (event, removed) => {
            onSuccess(event);
            queryClient.setQueryData<MFA.CredentialsResponse>(
                mfaKeys.credentials(),
                cached => cached && withoutCredential(cached, removed)
            );
            return invalidateCredentials();
        },
        onError: error => onError(error),
    });
};

/**
 * When the Passkeys view closes, drops a failed device load: a cached error would be thrown again
 * without a retry. Loaded devices stay cached.
 */
export const useForgetFailedPasskeyDevicesOnLeave = () => {
    const queryClient = useQueryClient();

    useEffect(
        () => () =>
            queryClient.removeQueries({
                queryKey: webAuthnKeys.devices(),
                predicate: query => query.state.status === 'error',
            }),
        [queryClient]
    );
};
