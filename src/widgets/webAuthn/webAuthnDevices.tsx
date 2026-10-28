import React, { useEffect, useState } from 'react';

import { LoaderCircle, TrashIcon } from 'lucide-react';

import type { DeviceCredential } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { Alternative, Heading, Info } from '@/components/miscComponent';
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
import { useReachfive } from '@/contexts/reachfive';

import { getProviderData } from './providerData';

import type { OnError, OnSuccess } from '@/types';

type DeviceInputFormData = {
    friendlyName: string;
};

interface DevicesListProps {
    devices: DeviceCredential[];
    removeWebAuthnDevice: (id: string) => Promise<void>;
}

const noop = () => {};

const dateFormat = (dateString: string, locales?: Intl.LocalesArgument) =>
    new Date(dateString).toLocaleDateString(locales, {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });

const DevicesList = ({ devices, removeWebAuthnDevice }: DevicesListProps) => {
    const i18n = useI18n();
    const config = useConfig();

    return (
        <div className="space-y-4">
            <Heading>{i18n('webauthn.registredDevices.list')}</Heading>

            <ItemGroup>
                {devices.map(device => {
                    const { id, friendlyName, createdAt, lastUsedAt, aaguid } = device;
                    const [provider, Icon] = getProviderData(aaguid ?? '');

                    return (
                        <Item key={id} data-testid="device" variant="outline">
                            <ItemMedia
                                variant="icon"
                                className="group-has-[[data-slot=item-description]]/item:self-center"
                            >
                                <Icon className="size-8" />
                            </ItemMedia>
                            <ItemContent>
                                <ItemTitle data-testid="device-name">{friendlyName}</ItemTitle>
                                {provider && (
                                    <ItemDescription data-testid="device-provider">
                                        {provider}
                                    </ItemDescription>
                                )}
                                {createdAt && (
                                    <ItemDescription data-testid="device-created-at">
                                        {i18n('webauthn.registredDevices.createdAt')}:&nbsp;
                                        <time dateTime={createdAt}>
                                            {dateFormat(createdAt, config.language)}
                                        </time>
                                    </ItemDescription>
                                )}
                                {lastUsedAt && (
                                    <ItemDescription data-testid="device-last-used-at">
                                        {i18n('webauthn.registredDevices.lastUsedAt')}:&nbsp;
                                        <time dateTime={lastUsedAt}>
                                            {dateFormat(lastUsedAt, config.language)}
                                        </time>
                                    </ItemDescription>
                                )}
                            </ItemContent>
                            <ItemActions>
                                <Button
                                    size="icon-sm"
                                    variant="destructive"
                                    className="rounded-full"
                                    aria-label={i18n('remove')}
                                    title={i18n('remove')}
                                    onClick={() => void removeWebAuthnDevice(id)}
                                    data-testid="device-remove"
                                >
                                    <TrashIcon />
                                </Button>
                            </ItemActions>
                        </Item>
                    );
                })}
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
     * Registred FIDO2 devices, already loaded by the caller.
     * When omitted, the component loads them itself from the access token.
     */
    devices?: DeviceCredential[];
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

type LoadState =
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; devices: DeviceCredential[] };

function useWebAuthnDevices(
    accessToken: string,
    initialDevices: DeviceCredential[] | undefined,
    onError: OnError
) {
    const coreClient = useReachfive();
    const [state, setState] = useState<LoadState>(
        initialDevices ? { status: 'ready', devices: initialDevices } : { status: 'loading' }
    );
    const shouldLoad = initialDevices === undefined;

    useEffect(() => {
        if (!shouldLoad) return;
        let cancelled = false;
        coreClient
            .listWebAuthnDevices(accessToken)
            .then(devices => {
                if (!cancelled) setState({ status: 'ready', devices });
            })
            .catch((error: unknown) => {
                if (cancelled) return;
                setState({ status: 'error' });
                onError(error);
            });
        return () => {
            cancelled = true;
        };
        // Load once per access token; callbacks are not reload triggers.
    }, [accessToken, coreClient, shouldLoad]);

    const setDevices = (devices: DeviceCredential[]) => setState({ status: 'ready', devices });

    return [state, setDevices] as const;
}

/**
 * Lists, adds and removes the passkey (FIDO2) devices of the user identified by the access token.
 * Mountable in any widget providing the config, i18n and ReachFive client contexts.
 */
export function WebAuthnDevices({
    accessToken,
    devices: initialDevices,
    showLabels = false,
    onError = noop as OnError,
    onSuccess = noop as OnSuccess,
}: WebAuthnDevicesProps) {
    const coreClient = useReachfive();
    const i18n = useI18n();

    const [state, setDevices] = useWebAuthnDevices(accessToken, initialDevices, onError);

    const removeWebAuthnDevice = async (deviceId: string) => {
        if (!confirm(i18n('webauthn.registredDevices.confirm.removal'))) return;

        try {
            await coreClient.removeWebAuthnDevice(accessToken, deviceId);
            onSuccess({ name: 'webauthn_credential_deleted', deviceId });
            const newDevices = await coreClient.listWebAuthnDevices(accessToken);
            setDevices(newDevices);
        } catch (error) {
            onError(error);
        }
    };

    const addNewWebAuthnDevice = ({ friendlyName }: DeviceInputFormData) => {
        return coreClient.addNewWebAuthnDevice(accessToken, friendlyName).then(() => {
            onSuccess({ name: 'webauthn_credential_created', friendlyName });
            return coreClient
                .listWebAuthnDevices(accessToken)
                .then(newDevices => setDevices(newDevices));
        });
    };

    if (state.status === 'loading') {
        return <LoaderCircle className="animate-spin" />;
    }

    if (state.status === 'error') {
        return null;
    }

    const { devices } = state;

    return (
        <div className="space-y-4">
            {devices.length === 0 ? (
                <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            ) : (
                <DevicesList devices={devices} removeWebAuthnDevice={removeWebAuthnDevice} />
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
                handler={addNewWebAuthnDevice}
                onError={onError}
            />
        </div>
    );
}
