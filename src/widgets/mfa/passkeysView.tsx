import React, { useEffect, useRef } from 'react';

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n';
import { useInvalidateMfaCredentials } from '@/widgets/mfa/queries';
import { WebAuthnDevices } from '@/widgets/webAuthn/webAuthnDevices';

import type { OnError, OnSuccess } from '@/types';
import type { SuccessEvent } from '@/types/events';

/** Device events that change the passkey count shown in the list of factors. */
const passkeyChanges: ReadonlySet<SuccessEvent['name']> = new Set([
    'webauthn_credential_created',
    'webauthn_credential_deleted',
]);

interface PasskeysViewProps {
    accessToken: string;
    onBack: () => void;
    onSuccess: OnSuccess;
    onError: OnError;
}

/**
 * The passkey management view of `showWebAuthnDevices`, unchanged, under a back arrow to the
 * list of factors. Adding or removing a passkey refreshes that list, so the count is up to date
 * on return.
 */
export function PasskeysView({ accessToken, onBack, onSuccess, onError }: PasskeysViewProps) {
    const i18n = useI18n();
    const invalidateCredentials = useInvalidateMfaCredentials(onError);
    const backButton = useRef<HTMLButtonElement>(null);

    // The Passkeys row that opened this view is gone: keep focus inside the widget.
    useEffect(() => backButton.current?.focus(), []);

    const handleSuccess: OnSuccess = event => {
        onSuccess(event);
        if (passkeyChanges.has(event.name)) void invalidateCredentials();
    };

    return (
        <div className="space-y-2">
            <div className="-ml-1.5 flex items-center">
                <Button
                    ref={backButton}
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={i18n('mfaList.back')}
                    onClick={onBack}
                >
                    <ArrowLeft aria-hidden="true" />
                </Button>
            </div>
            <WebAuthnDevices
                accessToken={accessToken}
                onSuccess={handleSuccess}
                onError={onError}
            />
        </div>
    );
}
