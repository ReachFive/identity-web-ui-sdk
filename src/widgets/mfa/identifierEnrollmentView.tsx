import React, { useMemo, useState } from 'react';

import { Form } from '@/components/form/form';
import { Intro } from '@/components/miscComponent';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { type Field, type PhoneNumberOptions } from '@/lib/form';
import { sendsNoCode } from '@/widgets/mfa/factors';
import { useMfaProfile } from '@/widgets/mfa/queries';

import type { EnrollmentViewProps } from '@/widgets/mfa/mfaWidget';

type IdentifierFactor = 'email' | 'sms';

type IdentifierEnrollmentViewProps = EnrollmentViewProps & { factor: IdentifierFactor };

interface IdentifierFormData {
    phoneNumber?: string;
    trustDevice?: boolean;
}

const TITLES: Record<IdentifierFactor, string> = {
    email: 'mfaList.email',
    sms: 'mfaList.phoneNumber',
};

const CODE_INTROS: Record<IdentifierFactor, string> = {
    email: 'mfa.email.intro',
    sms: 'mfa.phoneNumber.intro',
};

const TRUST_DEVICE_FIELD: Field = {
    key: 'trust_device',
    type: 'checkbox',
    label: 'mfa.stepUp.trustDevice',
    defaultChecked: false,
    required: false,
};

const phoneNumberField = (phoneNumberOptions?: PhoneNumberOptions): Field => ({
    key: 'phoneNumber',
    type: 'phone',
    allowInternational: phoneNumberOptions?.allowInternational ?? false,
    defaultCountry: phoneNumberOptions?.defaultCountry,
    phoneNumberOptions,
});

/**
 * The email or phone number enrollment screen. When the identifier is already verified on the
 * profile, the API enables the factor without a code: the screen says so before the click, and
 * offers to trust the device. The response decides the next screen, whatever was predicted.
 */
export function IdentifierEnrollmentView({
    factor,
    accessToken,
    action,
    allowTrustDevice,
    phoneNumberOptions,
    onSuccess,
    onError,
    onBack,
    onEnrolled,
}: IdentifierEnrollmentViewProps) {
    const client = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { data: profile } = useMfaProfile(accessToken);
    const [typedPhoneNumber, setTypedPhoneNumber] = useState<string | undefined>();

    const identifier = factor === 'email' ? (profile.email ?? '') : (typedPhoneNumber ?? '');
    const noCode = sendsNoCode(factor, profile, typedPhoneNumber);
    const showTrustDevice = noCode && allowTrustDevice && config.rbaEnabled;

    const fields = useMemo(
        () => [
            ...(factor === 'sms' ? [phoneNumberField(phoneNumberOptions)] : []),
            ...(showTrustDevice ? [TRUST_DEVICE_FIELD] : []),
        ],
        [factor, phoneNumberOptions, showTrustDevice]
    );

    const start = async ({ phoneNumber, trustDevice: checked }: IdentifierFormData) => {
        // a box checked then hidden keeps its value in the form: it is sent only while shown
        const trustDevice = showTrustDevice && checked === true;
        const request = { accessToken, action, ...(showTrustDevice && { trustDevice }) };
        const { status } =
            factor === 'email'
                ? await client.startMfaEmailRegistration(request)
                : await client.startMfaPhoneNumberRegistration({
                      ...request,
                      phoneNumber: phoneNumber ?? '',
                  });

        onSuccess({
            name:
                factor === 'email'
                    ? 'mfa_email_start_registration'
                    : 'mfa_phone_number_start_registration',
        });
        if (trustDevice && status === 'enabled') onSuccess({ name: 'mfa_trusted_device_added' });

        const enrolledIdentifier = factor === 'email' ? identifier : (phoneNumber ?? '');
        onEnrolled(
            { factor, identifier: enrolledIdentifier, trustDevice },
            status === 'enabled' ? 'done' : 'code'
        );
    };

    return (
        <div className="space-y-4">
            <ViewHeader
                title={i18n(TITLES[factor])}
                backLabel={i18n('mfaList.back')}
                onBack={onBack}
            />
            <Intro>
                {noCode
                    ? i18n('mfa.identifierVerified', { identifier })
                    : i18n(CODE_INTROS[factor])}
            </Intro>
            <Form
                fields={fields}
                submitLabel={noCode ? 'add' : 'mfa.sendCode'}
                handler={start}
                onFieldChange={({ phoneNumber }: IdentifierFormData) =>
                    setTypedPhoneNumber(phoneNumber)
                }
                onError={onError}
            />
        </div>
    );
}
