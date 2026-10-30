import React from 'react';

import { TrashIcon } from 'lucide-react';

import type { DeviceCredential } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { Alternative, Heading, Info } from '@/components/miscComponent';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { dateFormat } from '@/helpers/utils';

import { getProviderData } from './providerData';
import { useAddWebAuthnDevice, useRemoveWebAuthnDevice, useWebAuthnDevices } from './queries';

import type { OnError, OnSuccess } from '@/types';

type DeviceInputFormData = {
    friendlyName: string;
};

interface DevicesListProps {
    devices: DeviceCredential[];
    removeWebAuthnDevice: (id: string) => void;
}

interface DeviceItemProps {
    device: DeviceCredential;
    removeWebAuthnDevice: (id: string) => void;
}

interface RemoveDeviceDialogProps {
    onConfirm: () => void;
}

/** Asks for confirmation before removing one device; each device owns its dialog. */
const RemoveDeviceDialog = ({
    children,
    onConfirm,
}: React.PropsWithChildren<RemoveDeviceDialogProps>) => {
    const i18n = useI18n();

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {i18n('webauthn.registredDevices.confirm.removal')}
                    </AlertDialogTitle>
                    <AlertDialogDescription />
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{i18n('confirmation.cancel')}</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={onConfirm}>
                        {i18n('remove')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const DeviceItem = ({ device, removeWebAuthnDevice }: DeviceItemProps) => {
    const i18n = useI18n();
    const config = useConfig();
    const { id, friendlyName, createdAt, lastUsedAt, aaguid } = device;
    const [provider, Icon] = getProviderData(aaguid ?? '');

    return (
        <Item data-testid="device" variant="outline">
            <ItemMedia
                variant="icon"
                className="group-has-[[data-slot=item-description]]/item:self-center"
            >
                <Icon className="size-8" />
            </ItemMedia>
            <ItemContent>
                <ItemTitle data-testid="device-name">{friendlyName}</ItemTitle>
                {provider && (
                    <ItemDescription data-testid="device-provider">{provider}</ItemDescription>
                )}
                {createdAt && (
                    <ItemDescription data-testid="device-created-at">
                        {i18n('webauthn.registredDevices.createdAt')}:&nbsp;
                        <time dateTime={createdAt}>
                            {dateFormat(createdAt, config.language, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </time>
                    </ItemDescription>
                )}
                {lastUsedAt && (
                    <ItemDescription data-testid="device-last-used-at">
                        {i18n('webauthn.registredDevices.lastUsedAt')}:&nbsp;
                        <time dateTime={lastUsedAt}>
                            {dateFormat(lastUsedAt, config.language, {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                            })}
                        </time>
                    </ItemDescription>
                )}
            </ItemContent>
            <ItemActions>
                <RemoveDeviceDialog onConfirm={() => removeWebAuthnDevice(id)}>
                    <Button
                        size="icon-sm"
                        variant="destructive"
                        className="rounded-full"
                        aria-label={i18n('remove')}
                        title={i18n('remove')}
                        data-testid="device-remove"
                    >
                        <TrashIcon />
                    </Button>
                </RemoveDeviceDialog>
            </ItemActions>
        </Item>
    );
};

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
