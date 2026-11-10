import React from 'react';

import { Form } from '@/components/form/form';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useI18n } from '@/contexts/i18n';
import { useInvalidateMfaCredentials } from '@/widgets/mfa/queries';
import { useAddWebAuthnDevice } from '@/widgets/webAuthn/queries';

import type { EnrollmentViewProps } from '@/widgets/mfa/mfaWidget';

type PasskeyEnrollmentViewProps = Pick<
    EnrollmentViewProps,
    'accessToken' | 'onSuccess' | 'onError' | 'onBack' | 'onEnrolled'
>;

interface PasskeyFormData {
    friendlyName: string;
}

/**
 * The passkey enrollment screen: the device name, then the browser creates the passkey. The form
 * reports a refused creation and the screen stays open, so the user can try again or go back.
 */
export function PasskeyEnrollmentView({
    accessToken,
    onSuccess,
    onError,
    onBack,
    onEnrolled,
}: PasskeyEnrollmentViewProps) {
    const i18n = useI18n();
    const invalidateCredentials = useInvalidateMfaCredentials(onError);
    const addition = useAddWebAuthnDevice({ accessToken, onSuccess, onError });

    const enroll = async ({ friendlyName }: PasskeyFormData) => {
        await addition.mutateAsync(friendlyName);
        await invalidateCredentials();
        onEnrolled({ factor: 'passkey', friendlyName }, 'done');
    };

    return (
        <div className="space-y-4">
            <ViewHeader
                title={i18n('mfa.passkey')}
                backLabel={i18n('mfaList.back')}
                onBack={onBack}
            />
            <Form
                fields={[{ key: 'friendly_name', label: 'mfa.passkey.deviceName', required: true }]}
                submitLabel="mfa.passkey.create"
                showLabels
                handler={enroll}
                onError={onError}
            />
        </div>
    );
}
