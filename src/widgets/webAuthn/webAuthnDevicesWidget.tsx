import { createWidget } from '@/components/widget/widget';
import { UserError } from '@/helpers/errors';

import { WebAuthnDevices, type WebAuthnDevicesProps } from './webAuthnDevices';

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
