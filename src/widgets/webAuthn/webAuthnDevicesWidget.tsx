import { createQueryWidget } from '@/components/widget/queryWidget';
import { UserError } from '@/helpers/errors';

import { WebAuthnDevices, type WebAuthnDevicesProps } from './webAuthnDevices';

export type WebAuthnWidgetProps = WebAuthnDevicesProps;

export default createQueryWidget<WebAuthnWidgetProps>({
    name: 'webauthn-devices',
    component: WebAuthnDevices,
    prepare: (options, { config }) => {
        if (!config.webAuthn) {
            const error = new UserError('The WebAuthn feature is not available on your account.');
            options.onError?.(error);
            throw error;
        }

        if (!options.accessToken) {
            const error = new UserError('You must be logged in to manage the FIDO2 devices.');
            options.onError?.(error);
            throw error;
        }

        return options;
    },
});
