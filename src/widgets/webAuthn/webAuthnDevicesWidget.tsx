import { DeviceCredential } from '@reachfive/identity-core';
import React, { useState } from 'react';
import styled from 'styled-components';

import { Card, CloseIcon } from '../../components/form/cardComponent';
import { createForm } from '../../components/form/formComponent';
import { buildFormFields } from '../../components/form/formFieldFactory';
import { Heading, Info, MutedText, Paragraph } from '../../components/miscComponent';
import { createWidget } from '../../components/widget/widget';

import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';

import { UserError } from '../../helpers/errors';

import type { OnError, OnSuccess } from '../../types';

const DeviceName = styled.div`
    font-weight: bold;
    line-height: 2;
`;

type DeviceInputFormData = {
    friendlyName: string;
};

const DeviceInputForm = createForm<DeviceInputFormData>({
    prefix: 'r5-device-editor-',
    submitLabel: 'add',
    supportMultipleSubmits: true,
    resetAfterSuccess: true,
});

const DevicesListWrapper = styled.div`
    margin-bottom: ${props => props.theme.spacing}px;
`;

interface DevicesListProps {
    devices: DeviceCredential[];
    removeWebAuthnDevice: (id: string) => void;
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

const iconStyle = `
    width: 40px;
    height: 40px;
`;
const CardContent = styled.div`
    display: flex;
    align-items: center;
`;
const CardIcon = styled.div`
    flex-shrink: 0;
    margin-right: 16px;
`;

const CardText = styled.div`
    flex-grow: 1;
`;

const DevicesList = ({ devices, removeWebAuthnDevice }: DevicesListProps) => {
    const { config } = useReachfive();
    const i18n = useI18n();

    return (
        <DevicesListWrapper>
            <Heading>{i18n('webauthn.registredDevices.list')}</Heading>

            <div>
                {devices.map(device => {
                    const { id, friendlyName, createdAt, lastUsedAt, aaguid } = device;
                    const [provider, icon] = getProviderData(aaguid ?? '');
                    const Icon =
                        icon &&
                        styled(icon)`
                            ${iconStyle}
                        `;

                    return (
                        <Card key={id} data-testid="device">
                            <CardContent>
                                <CardIcon>
                                    <Icon />
                                </CardIcon>
                                <CardText>
                                    <DeviceName data-testid="device-name">
                                        {friendlyName}
                                    </DeviceName>
                                    {provider && (
                                        <div data-testid="device-provider">{provider}</div>
                                    )}
                                    {createdAt && (
                                        <div data-testid="device-created-at">
                                            {i18n('webauthn.registredDevices.createdAt')}:&nbsp;
                                            <time dateTime={createdAt}>
                                                {dateFormat(createdAt, config.language)}
                                            </time>
                                        </div>
                                    )}
                                    {lastUsedAt && (
                                        <div data-testid="device-last-used-at">
                                            {i18n('webauthn.registredDevices.lastUsedAt')}:&nbsp;
                                            <time dateTime={lastUsedAt}>
                                                {dateFormat(lastUsedAt, config.language)}
                                            </time>
                                        </div>
                                    )}
                                </CardText>
                            </CardContent>
                            <CloseIcon
                                title={i18n('remove')}
                                onClick={() => removeWebAuthnDevice(id)}
                                data-testid="device-remove"
                            />
                        </Card>
                    );
                })}
            </div>
        </DevicesListWrapper>
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
    const { client: coreClient, config } = useReachfive();
    const i18n = useI18n();

    const [devices, setDevices] = useState<DeviceCredential[]>(initDevices || []);

    const removeWebAuthnDevice = (deviceId: string) => {
        if (!confirm(i18n('webauthn.registredDevices.confirm.removal'))) return;

        return coreClient
            .removeWebAuthnDevice(accessToken, deviceId)
            .then(() => {
                onSuccess({ name: 'webauthn_credential_deleted', deviceId });
                return coreClient
                    .listWebAuthnDevices(accessToken)
                    .then(newDevices => setDevices(newDevices));
            })
            .catch(onError);
    };

    const addNewWebAuthnDevice = ({ friendlyName }: DeviceInputFormData) => {
        return coreClient.addNewWebAuthnDevice(accessToken, friendlyName).then(() => {
            onSuccess({ name: 'webauthn_credential_created', friendlyName });
            return coreClient
                .listWebAuthnDevices(accessToken)
                .then(newDevices => setDevices(newDevices));
        });
    };

    const fields = buildFormFields(['friendly_name'], config);

    return (
        <div>
            {devices.length === 0 ? (
                <Info>{i18n('webauthn.registredDevices.no.list')}</Info>
            ) : (
                <DevicesList devices={devices} removeWebAuthnDevice={removeWebAuthnDevice} />
            )}

            <Paragraph align="center">
                <MutedText>{i18n('webauthn.registredDevices.add')}</MutedText>
            </Paragraph>

            <DeviceInputForm
                fields={fields}
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
    prepare: (options, { client, config }) => {
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

        return client
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

// Source https://github.com/passkeydeveloper/passkey-authenticator-aaguids
import { ReactComponent as FingerPrint } from '../../icons/fingerprint.svg';
import { ReactComponent as OnePassword } from '../../icons/webauthn/1password.svg';
import { ReactComponent as Apple } from '../../icons/webauthn/apple.svg';
import { ReactComponent as Bitwarden } from '../../icons/webauthn/bitwarden.svg';
import { ReactComponent as Chrome } from '../../icons/webauthn/chrome.svg';
import { ReactComponent as Dashlane } from '../../icons/webauthn/dashlane.svg';
import { ReactComponent as Edge } from '../../icons/webauthn/edge.svg';
import { ReactComponent as Enpass } from '../../icons/webauthn/enpass.svg';
import { ReactComponent as GooglePasswordManager } from '../../icons/webauthn/google-password-manager.svg';
import { ReactComponent as IDmelon } from '../../icons/webauthn/idmelon.svg';
import { ReactComponent as KeePassXC } from '../../icons/webauthn/keepassxc.svg';
import { ReactComponent as Keeper } from '../../icons/webauthn/keeper.svg';
import { ReactComponent as NordPass } from '../../icons/webauthn/nordpass.svg';
import { ReactComponent as ProtonPass } from '../../icons/webauthn/proton-pass.svg';
import { ReactComponent as SamsungPass } from '../../icons/webauthn/samsung-pass.svg';
import { ReactComponent as Thales } from '../../icons/webauthn/thales.svg';
import { ReactComponent as WindowsHello } from '../../icons/webauthn/windows-hello.svg';

const providerData = new Map<
    string,
    [string, React.FunctionComponent<React.SVGAttributes<SVGElement>> | null]
>([
    ['ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4', ['Google Password Manager', GooglePasswordManager]],
    ['adce0002-35bc-c60a-648b-0b25f1f05503', ['Chrome on Mac', Chrome]],
    ['08987058-cadc-4b81-b6e1-30de50dcbe96', ['Windows Hello', WindowsHello]],
    ['9ddd1817-af5a-4672-a2b9-3e3dd95000a9', ['Windows Hello', WindowsHello]],
    ['6028b017-b1d4-4c02-b4b3-afcdafc96bb2', ['Windows Hello', WindowsHello]],
    ['dd4ec289-e01d-41c9-bb89-70fa845d4bf2', ['iCloud Keychain (Managed)', Apple]],
    ['531126d6-e717-415c-9320-3d9aa6981239', ['Dashlane', Dashlane]],
    ['bada5566-a7aa-401f-bd96-45619a55120d', ['1Password', OnePassword]],
    ['b84e4048-15dc-4dd0-8640-f4f60813c8af', ['NordPass', NordPass]],
    ['0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6', ['Keeper', Keeper]],
    ['f3809540-7f14-49c1-a8b3-8f813b225541', ['Enpass', Enpass]],
    ['b5397666-4885-aa6b-cebf-e52262a439a2', ['Chromium Browser', null]],
    ['771b48fd-d3d4-4f74-9232-fc157ab0507a', ['Edge on Mac', Edge]],
    ['39a5647e-1853-446c-a1f6-a79bae9f5bc7', ['IDmelon', IDmelon]],
    ['d548826e-79b4-db40-a3d8-11116f7e8349', ['Bitwarden', Bitwarden]],
    ['fbfc3007-154e-4ecc-8c0b-6e020557d7bd', ['iCloud Keychain', Apple]],
    ['53414d53-554e-4700-0000-000000000000', ['Samsung Pass', SamsungPass]],
    ['66a0ccb3-bd6a-191f-ee06-e375c50b9846', ['Thales Bio iOS SDK', Thales]],
    ['8836336a-f590-0921-301d-46427531eee6', ['Thales Bio Android SDK', Thales]],
    ['cd69adb5-3c7a-deb9-3177-6800ea6cb72a', ['Thales PIN Android SDK', Thales]],
    ['17290f1e-c212-34d0-1423-365d729f09d9', ['Thales PIN iOS SDK', Thales]],
    ['50726f74-6f6e-5061-7373-50726f746f6e', ['Proton Pass', ProtonPass]],
    ['fdb141b2-5d84-443e-8a35-4698c205a502', ['KeePassXC', KeePassXC]],
]);

function getProviderData(
    aaguid: string
): [string | null, React.FunctionComponent<React.SVGAttributes<SVGElement>>] {
    const data = providerData.get(aaguid);

    if (data === undefined) {
        return [null, FingerPrint];
    } else {
        const [provider, icon] = data;
        return [provider, icon ?? FingerPrint];
    }
}
