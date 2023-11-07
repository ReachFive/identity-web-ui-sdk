import React, { useState } from 'react';
import styled from 'styled-components';
import { DeviceCredential } from '@reachfive/identity-core';

import { Card, CloseIcon } from '../../components/form/cardComponent';
import { buildFormFields } from '../../components/form/formFieldFactory';
import { createForm } from '../../components/form/formComponent';
import { Heading, Info, Separator } from '../../components/miscComponent';
import { createWidget } from '../../components/widget/widget';

import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useConfig } from '../../contexts/config';

import { UserError } from '../../helpers/errors';

const DeviceName = styled.div`
    text-align: center;
`;

interface FormData {
    friendlyName: string
}

const DeviceInputForm = createForm<FormData>({
    prefix: 'r5-device-editor-',
    submitLabel: 'add',
    supportMultipleSubmits: true,
    resetAfterSuccess: true
});

const DevicesListWrapper = styled.div`
    margin-bottom: ${props => props.theme.spacing}px
`

interface DevicesListProps {
    devices: DeviceCredential[]
    removeWebAuthnDevice: (id: string) => void
}

const DevicesList = ({ devices, removeWebAuthnDevice }: DevicesListProps) => {
    const i18n = useI18n()
    return (
        <DevicesListWrapper>
            <Heading>{i18n('webauthn.registredDevices.list')}</Heading>
    
            <div>
                {devices.map(device => {
                    const { id } = device
    
                    return <Card key={id}>
                        <DeviceName>{device.friendlyName}</DeviceName>
                        <CloseIcon title={i18n('remove')} onClick={() => removeWebAuthnDevice(id)} />
                    </Card>})
                }
            </div>
        </DevicesListWrapper>
    )
}

export interface WebAuthnDevicesProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Registred FIDO2 devices
     */
    devices: DeviceCredential[]
    /**
     * Whether the form fields's labels are displayed on the login view.
     * 
     * @default false
     */
    showLabels?: boolean
}

function WebAuthnDevices ({
    accessToken,
    devices: initDevices,
    showLabels = false,
}: WebAuthnDevicesProps) {
    const coreClient = useReachfive()
    const config = useConfig()
    const i18n = useI18n()

    const [devices, setDevices] = useState<DeviceCredential[]>(initDevices || []);

    const removeWebAuthnDevice = (deviceId: string) => {
        if (!confirm(i18n('webauthn.registredDevices.confirm.removal'))) return;

        return coreClient
            .removeWebAuthnDevice(accessToken, deviceId)
            .then(() => {
                return coreClient.
                    listWebAuthnDevices(accessToken)
                    .then(newDevices => setDevices(newDevices));
            });
    }

    const addNewWebAuthnDevice = ({ friendlyName }: FormData) => {
        return coreClient
            .addNewWebAuthnDevice(accessToken, friendlyName)
            .then(() => {
                return coreClient.
                    listWebAuthnDevices(accessToken)
                    .then(newDevices => setDevices(newDevices));
            })
    }

    const fields = buildFormFields(['friendly_name'], config)

    return <div>
        {devices.length === 0
            ? <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            : <DevicesList
                devices={devices}
                removeWebAuthnDevice={removeWebAuthnDevice}
            />}

        <Separator text={i18n('webauthn.registredDevices.add')} />

        <DeviceInputForm
            fields={fields}
            showLabels={showLabels}
            handler={addNewWebAuthnDevice} />
    </div>
}

export type WebAuthnWidgetProps = Omit<WebAuthnDevicesProps, 'devices'>

export default createWidget<WebAuthnWidgetProps, WebAuthnDevicesProps>({
    name: 'webauthn-devices',
    component: WebAuthnDevices,
    prepare: (options, { apiClient, config }) => {
        const { accessToken } = options;

        if (!config.webAuthn) {
            throw new UserError('The WebAuthn feature is not available on your account.');
        }

        if (!accessToken) {
            throw new UserError('You must be logged in to manage the FIDO2 devices.');
        }

        return apiClient
            .listWebAuthnDevices(accessToken)
            .then(devices => ({
                ...options,
                devices
            }));
    }
});
