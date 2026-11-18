import { useMutation, useSuspenseQuery, type QueryKey } from '@tanstack/react-query';

import { useInvalidateQueries } from '@/components/widget/useInvalidateQueries';
import { useReachfive } from '@/contexts/reachfive';

import type { OnError, OnSuccess } from '@/types';

/** Query keys, prefixed so they never collide with another widget's. */
export const webAuthnKeys = {
    devices: () => ['webauthn', 'devices'] as const satisfies QueryKey,
};

/**
 * The user's passkey devices, read with suspense. A failed first load is thrown to the nearest
 * error boundary.
 */
export const useWebAuthnDevices = (accessToken: string) => {
    const client = useReachfive();

    return useSuspenseQuery({
        queryKey: webAuthnKeys.devices(),
        queryFn: () => client.listWebAuthnDevices(accessToken),
    });
};

/** Refetches the devices after a change. */
const useInvalidateWebAuthnDevices = (onError: OnError) => {
    const invalidate = useInvalidateQueries(onError);
    return () => invalidate(webAuthnKeys.devices());
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

/** Registers a new device, then refetches the list. Errors are left to the caller. */
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
