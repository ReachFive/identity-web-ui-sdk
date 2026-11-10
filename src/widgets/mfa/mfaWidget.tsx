import React, { useRef, useState } from 'react';

import { createQueryWidget } from '@/components/widget/queryWidget';
import { useViewNavigation, viewAnimation } from '@/components/widget/useViewNavigation';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { type PhoneNumberOptions } from '@/lib/form';
import { factorChoices, type AddableFactor } from '@/widgets/mfa/factors';
import { FactorsView, type FactorRowRefs } from '@/widgets/mfa/factorsView';
import { PasskeysView } from '@/widgets/mfa/passkeysView';
import { useMfaCredentials, useMfaProfile } from '@/widgets/mfa/queries';

import type { OnError, OnSuccess } from '@/types';

/** The screens of the widget: the choice, the Passkeys view, one per enrollment step. */
export type MfaView = 'factors' | 'passkeys' | 'passkey' | 'email' | 'sms' | 'code' | 'done';

/** What the user is enrolling, kept from the enrollment screen to the code and confirmation. */
export type Enrollment =
    | { factor: 'passkey'; friendlyName: string }
    | { factor: 'email'; identifier: string; trustDevice: boolean }
    | { factor: 'sms'; identifier: string; trustDevice: boolean };

/** The widget options every enrollment view reads. */
export interface MfaViewProps {
    accessToken: string;
    action?: string;
    allowTrustDevice: boolean;
    phoneNumberOptions?: PhoneNumberOptions;
    onSuccess: OnSuccess;
    onError: OnError;
}

/** The props of an enrollment view (passkey, email, phone number). */
export type EnrollmentViewProps = MfaViewProps & {
    onBack: () => void;
    /** The factor is enrolled, or a code was sent (`next: 'code'`) to finish it. */
    onEnrolled: (enrollment: Enrollment, next: 'code' | 'done') => void;
};

export type MfaCredentialsWidgetProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Boolean to enable (`true`) or disable (`false`) whether the option to remove MFA credentials are displayed.
     *
     * @default true
     */
    showRemoveMfaCredentials?: boolean;
    /**
     * Allow to trust device during enrollment
     */
    allowTrustDevice?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Action used in template
     */
    action?: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * @deprecated No effect: the widget has no introduction text anymore.
     */
    showIntro?: boolean;
    /**
     * @deprecated No effect: the widget has no introduction text anymore.
     */
    requireMfaRegistration?: boolean;
};

/** i18n keys of the enrollment screen titles. */
const ENROLLMENT_TITLES: Record<AddableFactor, string> = {
    passkey: 'mfa.passkey',
    email: 'mfaList.email',
    sms: 'mfaList.phoneNumber',
};

/** Placeholder of an enrollment screen: its title under the back arrow. */
const EnrollmentPlaceholder = ({
    factor,
    onBack,
}: EnrollmentViewProps & { factor: AddableFactor }) => {
    const i18n = useI18n();
    return (
        <ViewHeader
            title={i18n(ENROLLMENT_TITLES[factor])}
            backLabel={i18n('mfaList.back')}
            onBack={onBack}
        />
    );
};

/** Placeholder of the code and confirmation screens. */
const StepPlaceholder = (_props: { enrollment: Enrollment | null }) => null;

const useFactorRowRefs = (): FactorRowRefs => ({
    passkeys: useRef<HTMLButtonElement>(null),
    add: {
        passkey: useRef<HTMLButtonElement>(null),
        email: useRef<HTMLButtonElement>(null),
        sms: useRef<HTMLButtonElement>(null),
    },
});

const Mfa = ({
    accessToken,
    showRemoveMfaCredentials = true,
    allowTrustDevice = false,
    phoneNumberOptions,
    action,
    onSuccess = () => {},
    onError = () => {},
}: MfaCredentialsWidgetProps) => {
    const config = useConfig();
    const {
        data: { credentials },
    } = useMfaCredentials(accessToken);
    const { data: profile } = useMfaProfile(accessToken);
    const { view, direction, pending, goTo, back } = useViewNavigation<MfaView>('factors');
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const rowRefs = useFactorRowRefs();

    const viewProps: MfaViewProps = {
        accessToken,
        action,
        allowTrustDevice,
        phoneNumberOptions,
        onSuccess,
        onError,
    };
    const enrollmentProps: EnrollmentViewProps = {
        ...viewProps,
        onBack: back,
        onEnrolled: (next, nextView) => {
            setEnrollment(next);
            goTo(nextView);
        },
    };

    const renderView = () => {
        switch (view) {
            case 'factors':
                return (
                    <FactorsView
                        accessToken={accessToken}
                        choices={factorChoices(config, credentials, profile)}
                        removable={showRemoveMfaCredentials}
                        rowRefs={rowRefs}
                        onOpenPasskeys={() => goTo('passkeys', { returnFocus: rowRefs.passkeys })}
                        openingPasskeys={pending}
                        onAdd={factor => goTo(factor, { returnFocus: rowRefs.add[factor] })}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                );
            case 'passkeys':
                return (
                    <PasskeysView
                        accessToken={accessToken}
                        onBack={back}
                        onSuccess={onSuccess}
                        onError={onError}
                    />
                );
            case 'passkey':
            case 'email':
            case 'sms':
                return <EnrollmentPlaceholder factor={view} {...enrollmentProps} />;
            case 'code':
            case 'done':
                return <StepPlaceholder enrollment={enrollment} />;
        }
    };

    // The credentials and profile queries stay mounted in every view, so a change made in
    // another view refetches them in the background.
    return (
        <div key={view} className={viewAnimation(direction)}>
            {renderView()}
        </div>
    );
};

export default createQueryWidget<MfaCredentialsWidgetProps>({
    component: Mfa,
});
