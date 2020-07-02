import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { Card, CloseIcon } from '../../components/form/cardComponent'
import { PrimaryButton } from '../../components/form/buttonComponent';
import { Error, Heading, Info } from '../../components/miscComponent';
import { createWidget } from '../../components/widget/widget';
import { withI18n, withTheme } from '../../components/widget/widgetContext';
import { UserError } from '../../helpers/errors';

const DeviceName = styled.div`
    text-align: center;
`;

const DeviceForm = withTheme(styled.div`
    & > * {
        margin-top: ${props => props.theme.get('spacing')}px;
    }
`);

const DevicesList = withI18n(withTheme(({ devices, i18n, theme, removeWebAuthnDevice }) => (
    <div>
        <Heading>{i18n('webauthn.registredDevices.list')}</Heading>

        <div>
            {devices.map(device => {
                const { id } = device

                return <Card key={id} theme={theme}>
                    <DeviceName>{device.friendlyName}</DeviceName>
                    <CloseIcon title={i18n('remove')} onClick={() => removeWebAuthnDevice(id)} />
                </Card>})
            }
        </div>
    </div>
)));

function WebAuthnDevices (props) {
    const { i18n, theme } = props;

    const [devices, setDevices] = useState(props.devices || []);
    const [error, setError] = useState(undefined);

    const removeWebAuthnDevice = (deviceId) => {
        const { accessToken, apiClient } = props;

        setError(undefined);

        if (!confirm(i18n('webauthn.registredDevices.confirm.removal'))) return;

        return apiClient
            .removeWebAuthnDevice(accessToken, deviceId)
            .then(() => {
                return apiClient.
                    listWebAuthnDevices(accessToken)
                    .then(newDevices => setDevices(newDevices));
            });
    }

    const addNewWebAuthnDevice = () => {
        const { accessToken, apiClient } = props;

        setError(undefined);

        return apiClient
            .addNewWebAuthnDevice(accessToken)
            .then(() => {
                return apiClient.
                    listWebAuthnDevices(accessToken)
                    .then(newDevices => setDevices(newDevices));
            })
            .catch(error => {
                if (error.errorMessageKey === 'error.webauthn.friendlyNameAlreadyAssociated') {
                    setError('This device is already registered.');
                }
            })
    }

    return <div>
        {devices.length === 0
            ? <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            : <DevicesList
                devices={devices}
                i18n={i18n}
                theme={theme}
                removeWebAuthnDevice={removeWebAuthnDevice} />}

        <DeviceForm>
            <PrimaryButton onClick={addNewWebAuthnDevice}>{i18n('webauthn.registredDevices.add')}</PrimaryButton>
            <Error>{error}</Error>
        </DeviceForm>
    </div>
}

export default createWidget({
    name: 'webauthn-devices',
    standalone: false,
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
