import React, { useState } from 'react';

import { TrashIcon } from 'lucide-react';

import type { DeviceCredential } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { Heading, Info, MutedText, Paragraph } from '@/components/miscComponent';
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
import { createWidget } from '@/components/widget/widget';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { UserError } from '@/helpers/errors';

import { getProviderData } from './providerData';

import type { OnError, OnSuccess } from '@/types';

type DeviceInputFormData = {
    friendlyName: string;
};

interface DevicesListProps {
    devices: DeviceCredential[];
    removeWebAuthnDevice: (id: string) => Promise<void>;
}

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
     * Registred FIDO2 devices
     */
    devices: DeviceCredential[];
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

function WebAuthnDevices({
    accessToken,
    devices: initDevices,
    showLabels = false,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: WebAuthnDevicesProps) {
    const coreClient = useReachfive();
    const i18n = useI18n();

    const [devices, setDevices] = useState<DeviceCredential[]>(initDevices || []);

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

    return (
        <div className="space-y-4">
            {devices.length === 0 ? (
                <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            ) : (
                <DevicesList devices={devices} removeWebAuthnDevice={removeWebAuthnDevice} />
            )}

            <Paragraph align="center">
                <MutedText>{i18n('webauthn.registredDevices.add')}</MutedText>
            </Paragraph>

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

export type WebAuthnWidgetProps = Omit<WebAuthnDevicesProps, 'devices'>;

export default createWidget<WebAuthnWidgetProps, WebAuthnDevicesProps>({
    name: 'webauthn-devices',
    component: WebAuthnDevices,
    prepare: (options, { apiClient, config }) => {
        const { accessToken } = options;

        if (!config.webAuthn) {
            const error = new UserError('The WebAuthn feature is not available on your account.');
            options.onError?.(error);
            throw error;
        }

        if (!accessToken) {
            const error = new UserError('You must be logged in to manage the FIDO2 devices.');
            options.onError?.(error);
            throw error;
        }

        return apiClient
            .listWebAuthnDevices(accessToken)
            .then(devices => ({
                ...options,
                devices,
            }))
            .catch(err => {
                options.onError?.(err);
                throw err;
            });
    },
});
