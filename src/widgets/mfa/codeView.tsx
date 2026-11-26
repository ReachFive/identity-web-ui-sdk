import React, { useMemo } from 'react';

import { Form } from '@/components/form/form';
import { Intro } from '@/components/miscComponent';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useTrustDeviceField } from '@/widgets/mfa/trustDeviceField';

import type { Enrollment, MfaViewProps } from '@/widgets/mfa/mfaWidget';

type CodeViewProps = MfaViewProps & {
    enrollment: Extract<Enrollment, { factor: 'email' | 'sms' }>;
    onBack: () => void;
    onVerified: () => void;
};

interface CodeFormData {
    verificationCode: string;
    trustDevice?: boolean;
}

/** Code entry screen. "Resend" sends the same request as the first send. */
export function CodeView({
    enrollment,
    accessToken,
    action,
    allowTrustDevice,
    onSuccess,
    onError,
    onBack,
    onVerified,
}: CodeViewProps) {
    const client = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { factor, identifier, trustDevice: enrolledTrustDevice } = enrollment;
    const showTrustDevice = allowTrustDevice && config.rbaEnabled;

    const resend = async () => {
        try {
            const request = { accessToken, action, trustDevice: enrolledTrustDevice };
            if (factor === 'email') {
                await client.startMfaEmailRegistration(request);
                onSuccess({ name: 'mfa_email_start_registration' });
            } else {
                await client.startMfaPhoneNumberRegistration({
                    ...request,
                    phoneNumber: identifier,
                });
                onSuccess({ name: 'mfa_phone_number_start_registration' });
            }
        } catch (error) {
            onError(error);
            throw error;
        }
    };

    const trustDeviceField = useTrustDeviceField();
    const fields = useMemo(
        () => [
            // no auto-submit with the checkbox: the user must be able to tick it first
            { key: 'verification_code', onResend: resend, autoSubmit: !showTrustDevice },
            ...(showTrustDevice ? [trustDeviceField] : []),
        ],
        // every value `resend` reads, so the field never keeps an old `resend`
        [
            showTrustDevice,
            trustDeviceField,
            client,
            accessToken,
            action,
            factor,
            identifier,
            enrolledTrustDevice,
            onSuccess,
            onError,
        ]
    );

    const verify = async ({ verificationCode, trustDevice: checked }: CodeFormData) => {
        const trustDevice = showTrustDevice && checked === true;
        const request = { accessToken, verificationCode, trustDevice };
        if (factor === 'email') {
            await client.verifyMfaEmailRegistration(request);
            onSuccess({ name: 'mfa_email_verify_registration' });
        } else {
            await client.verifyMfaPhoneNumberRegistration(request);
            onSuccess({ name: 'mfa_phone_number_verify_registration' });
        }
        if (trustDevice) onSuccess({ name: 'mfa_trusted_device_added' });
    };

    return (
        <div className="space-y-4">
            <ViewHeader
                title={i18n('mfa.code.title')}
                backLabel={i18n('mfaList.back')}
                onBack={onBack}
            />
            <Intro>{i18n('mfa.code.sentTo', { identifier })}</Intro>
            <Form
                fields={fields}
                submitLabel="mfa.verify"
                handler={verify}
                onSuccess={onVerified}
                onError={onError}
            />
        </div>
    );
}
