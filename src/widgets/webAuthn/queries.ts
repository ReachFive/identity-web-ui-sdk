import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
    type QueryKey,
} from '@tanstack/react-query';

import { useReachfive } from '@/contexts/reachfive';

import type { OnError, OnSuccess } from '@/types';

/**
 * Query keys of the WebAuthn resources, namespaced so they never collide with another widget's.
 */
export const webAuthnKeys = {
    devices: () => ['webauthn', 'devices'] as const satisfies QueryKey,
};

/**
 * The user's passkey (FIDO2) devices, read through suspense: the component renders only once they
 * are loaded, and a failed first load is thrown to the nearest error boundary.
 */
export const useWebAuthnDevices = (accessToken: string) => {
    const client = useReachfive();

    return useSuspenseQuery({
        queryKey: webAuthnKeys.devices(),
        queryFn: () => client.listWebAuthnDevices(accessToken),
    });
};

/**
 * Refetches the devices after a change. A failed refetch keeps the cached list on screen and is
 * reported through `onError`.
 */
const useInvalidateWebAuthnDevices = (onError: OnError) => {
    const queryClient = useQueryClient();

    return () =>
        queryClient
            .invalidateQueries({ queryKey: webAuthnKeys.devices() }, { throwOnError: true })
            .catch(onError);
};

interface DeviceMutationOptions {
    accessToken: string;
    onSuccess: OnSuccess;
    onError: OnError;
}

/** Removes a device, then refetches the list. */
export const useRemoveWebAuthnDevice = ({
    accessToken,
    onSuccess,
    onError,
}: DeviceMutationOptions) => {
    const client = useReachfive();
    const invalidateDevices = useInvalidateWebAuthnDevices(onError);

    return useMutation({
        mutationFn: (deviceId: string) => client.removeWebAuthnDevice(accessToken, deviceId),
        onSuccess: (_, deviceId) => {
            onSuccess({ name: 'webauthn_credential_deleted', deviceId });
            return invalidateDevices();
        },
        onError: error => onError(error),
    });
};

/**
 * Registers a new device, then refetches the list. Failures are left to the caller: the add form
 * reports them itself.
 */
export const useAddWebAuthnDevice = ({
    accessToken,
    onSuccess,
    onError,
}: DeviceMutationOptions) => {
    const client = useReachfive();
    const invalidateDevices = useInvalidateWebAuthnDevices(onError);

    return useMutation({
        mutationFn: (friendlyName: string) =>
            client.addNewWebAuthnDevice(accessToken, friendlyName),
        onSuccess: (_, friendlyName) => {
            onSuccess({ name: 'webauthn_credential_created', friendlyName });
            return invalidateDevices();
        },
    });
};
