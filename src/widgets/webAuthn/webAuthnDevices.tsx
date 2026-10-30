import React from 'react';

import type { DeviceCredential } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { Alternative, Heading, Info } from '@/components/miscComponent';
import { ItemGroup } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';

import { DeviceItem } from './deviceItem';
import { useAddWebAuthnDevice, useRemoveWebAuthnDevice, useWebAuthnDevices } from './queries';

import type { OnError, OnSuccess } from '@/types';

type DeviceInputFormData = {
    friendlyName: string;
};

interface DevicesListProps {
    devices: DeviceCredential[];
    removeWebAuthnDevice: (id: string) => void;
}

const DevicesList = ({ devices, removeWebAuthnDevice }: DevicesListProps) => {
    const i18n = useI18n();

    return (
        <div className="space-y-4">
            <Heading>{i18n('webauthn.registredDevices.list')}</Heading>

            <ItemGroup>
                {devices.map(device => (
                    <DeviceItem
                        key={device.id}
                        device={device}
                        removeWebAuthnDevice={removeWebAuthnDevice}
                    />
                ))}
            </ItemGroup>
        </div>
    );
};

export interface WebAuthnDevicesProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Whether the form fields's labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

/**
 * Lists, adds and removes the passkey (FIDO2) devices of the user identified by the access token.
 * Reads them through suspense queries: mount it under a query client and the widget boundaries.
 */
export function WebAuthnDevices({
    accessToken,
    showLabels = false,
    onError = () => {},
    onSuccess = () => {},
}: WebAuthnDevicesProps) {
    const i18n = useI18n();
    const { data: devices } = useWebAuthnDevices(accessToken);
    const removal = useRemoveWebAuthnDevice({ accessToken, onSuccess, onError });
    const addition = useAddWebAuthnDevice({ accessToken, onSuccess, onError });

    return (
        <div className="space-y-4">
            {devices.length === 0 ? (
                <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            ) : (
                <DevicesList devices={devices} removeWebAuthnDevice={id => removal.mutate(id)} />
            )}

            <Alternative className="text-muted-foreground">
                {i18n('webauthn.registredDevices.add')}
            </Alternative>

            <Form
                fields={['friendly_name']}
                submitLabel="add"
                supportMultipleSubmits
                resetAfterSuccess
                showLabels={showLabels}
                handler={({ friendlyName }: DeviceInputFormData) =>
                    addition.mutateAsync(friendlyName)
                }
                onError={onError}
            />
        </div>
    );
}
