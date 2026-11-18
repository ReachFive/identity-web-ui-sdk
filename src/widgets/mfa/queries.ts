import { useEffect } from 'react';

import {
    queryOptions,
    useMutation,
    useQueryClient,
    useSuspenseQueries,
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
import type { MfaProfile } from '@/widgets/mfa/factors';

const mfaKeys = {
    credentials: () => ['mfa', 'credentials'] as const satisfies QueryKey,
    profile: () => ['mfa', 'profile'] as const satisfies QueryKey,
};

const credentialsQuery = (client: CoreClient, accessToken: string) =>
    queryOptions({
        queryKey: mfaKeys.credentials(),
        queryFn: () => client.listMfaCredentials(accessToken),
    });

const profileQuery = (client: CoreClient, accessToken: string) =>
    queryOptions({
        queryKey: mfaKeys.profile(),
        queryFn: async (): Promise<MfaProfile> =>
            client.getUser({
                accessToken,
                fields: 'email,email_verified,phone_number,phone_number_verified',
            }),
    });

/**
 * Read through suspense: the component renders once the credentials are loaded. A failed first
 * load is thrown to the nearest error boundary.
 */
export const useMfaCredentials = (accessToken: string) =>
    useSuspenseQuery(credentialsQuery(useReachfive(), accessToken));

export const useMfaProfile = (accessToken: string) =>
    useSuspenseQuery(profileQuery(useReachfive(), accessToken));

/**
 * Loads the credentials and the profile in parallel: two suspense queries in a row would start the
 * second only after the first. Same cache entries as the hooks above.
 */
export const useMfaCredentialsAndProfile = (accessToken: string) => {
    const client = useReachfive();
    const [credentials, profile] = useSuspenseQueries({
        queries: [credentialsQuery(client, accessToken), profileQuery(client, accessToken)],
    });

    return { credentials: credentials.data.credentials, profile: profile.data };
};

/** A failed refetch keeps the cached list and is passed once to `onError`. */
export const useInvalidateMfaCredentials = (onError: OnError) => {
    const invalidate = useInvalidateQueries(onError);
    return () => invalidate(mfaKeys.credentials());
};

/**
 * Refetches the credentials and the profile: the profile identifiers may have been verified in the
 * meantime. A failure is passed once to `onError`.
 */
export const useRefreshMfaFactors = (onError: OnError) => {
    const invalidate = useInvalidateQueries(onError);
    return () => invalidate(mfaKeys.credentials(), mfaKeys.profile());
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
