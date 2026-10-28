import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
    type QueryKey,
} from '@tanstack/react-query';

import type { Client as CoreClient } from '@reachfive/identity-core';

import { useReachfive } from '@/contexts/reachfive';

import type { OnError, OnSuccess } from '@/types';
import type { SuccessEvent } from '@/types/events';
import type { EmailOrPhoneCredential } from '@/widgets/mfa/passkeyCredential';

/**
 * Query keys of the MFA resources, namespaced so they never collide with another widget's.
 */
export const mfaKeys = {
    all: ['mfa'] as const,
    credentials: () => [...mfaKeys.all, 'credentials'] as const satisfies QueryKey,
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

const removeMfaCredential = (
    client: CoreClient,
    accessToken: string,
    credential: EmailOrPhoneCredential
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

export type UseRemoveMfaCredentialOptions = {
    accessToken: string;
    onSuccess: OnSuccess;
    onError: OnError;
};

/**
 * Removes an email or phone number credential. No optimistic update: on success the deletion
 * event fires and the credentials list is refetched; on failure the list is left untouched.
 */
export const useRemoveMfaCredential = ({
    accessToken,
    onSuccess,
    onError,
}: UseRemoveMfaCredentialOptions) => {
    const client = useReachfive();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (credential: EmailOrPhoneCredential) =>
            removeMfaCredential(client, accessToken, credential),
        onSuccess: event => {
            onSuccess(event);
            return queryClient
                .invalidateQueries({ queryKey: mfaKeys.credentials() }, { throwOnError: true })
                .catch(onError);
        },
        onError: error => onError(error),
    });
};
