import React from 'react';

import { WidgetErrorBoundary } from '@/components/widget/queryWidget';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useI18n } from '@/contexts/i18n';
import {
    useForgetFailedPasskeyDevicesOnLeave,
    useInvalidateMfaCredentials,
} from '@/widgets/mfa/queries';
import { WebAuthnDevices } from '@/widgets/webAuthn/webAuthnDevices';

import type { OnError, OnSuccess } from '@/types';

interface PasskeysViewProps {
    accessToken: string;
    onBack: () => void;
    onSuccess: OnSuccess;
    onError: OnError;
}

/**
 * The `showWebAuthnDevices` view, under a back arrow to the list of factors. The device view only
 * emits events for a passkey added or removed, so each event refreshes the list of factors. A
 * failed device load shows the widget error under the back arrow. Opened in a transition, the view
 * replaces the list only once its devices are loaded.
 */
export function PasskeysView({ accessToken, onBack, onSuccess, onError }: PasskeysViewProps) {
    const i18n = useI18n();
    const invalidateCredentials = useInvalidateMfaCredentials(onError);
    useForgetFailedPasskeyDevicesOnLeave();

    const handleSuccess: OnSuccess = event => {
        onSuccess(event);
        void invalidateCredentials();
    };

    return (
        <div className="space-y-2">
            <ViewHeader
                title={i18n('webauthn.registredDevices.list')}
                backLabel={i18n('mfaList.back')}
                onBack={onBack}
            />
            <WidgetErrorBoundary onError={onError}>
                <WebAuthnDevices
                    accessToken={accessToken}
                    onSuccess={handleSuccess}
                    onError={onError}
                    showIntro={false}
                />
            </WidgetErrorBoundary>
        </div>
    );
}
