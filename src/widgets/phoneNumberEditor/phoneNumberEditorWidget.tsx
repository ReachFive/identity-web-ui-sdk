import React from 'react';

import { Form } from '@/components/form/form';

import { Info, Intro } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { type PhoneNumberOptions } from '../../lib/form';

import type { OnError, OnSuccess, Prettify } from '../../types';

type PhoneNumberFormData = { phoneNumber: string };

type VerificationCodeFormData = { verificationCode: string };

interface MainViewProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Whether the form fields's labels are displayed on the login view.
     *
     * @default false
     */
    showLabels?: boolean;
    /**
     * Phone number field options.
     */
    phoneNumberOptions?: PhoneNumberOptions;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Callback function called when the request has succeeded
     */
    onSuccess?: OnSuccess;
}

const MainView = ({
    accessToken,
    showLabels = false,
    phoneNumberOptions,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
}: MainViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { goTo } = useRouting();

    const handleSubmit = (data: PhoneNumberFormData) => {
        return coreClient
            .updatePhoneNumber({
                ...data,
                accessToken,
            })
            .then(() => {
                onSuccess({ name: 'phone_number_updated' });
                return data;
            });
    };

    const handleSuccess = (data: PhoneNumberFormData) =>
        goTo<VerificationCodeViewState>('verificationCode', data);

    return (
        <div>
            <Intro>{i18n('phoneNumberEditor.intro')}</Intro>
            <Form
                fields={[
                    {
                        key: 'phoneNumber',
                        type: 'phone',
                        required: true,
                        allowInternational: phoneNumberOptions?.allowInternational ?? false,
                        defaultCountry: phoneNumberOptions?.defaultCountry,
                        phoneNumberOptions,
                    },
                ]}
                showLabels={showLabels}
                handler={handleSubmit}
                onSuccess={handleSuccess}
                onError={onError}
                phoneNumberOptions={phoneNumberOptions}
            />
        </div>
    );
};

type VerificationCodeViewProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
};

type VerificationCodeViewState = {
    /**
     * The phone number to verify.
     */
    phoneNumber: string;
};

const VerificationCodeView = ({
    accessToken,
    onSuccess = (() => {}) as OnSuccess,
    onError = (() => {}) as OnError,
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const { phoneNumber } = params as VerificationCodeViewState;

    const handleSubmit = (data: VerificationCodeFormData) => {
        return coreClient.verifyPhoneNumber({
            ...data,
            phoneNumber,
            accessToken,
        });
    };

    return (
        <div>
            <Info>{i18n('phoneNumberEditor.verification.intro')}</Info>
            <Form
                fields={[
                    {
                        key: 'verification_code',
                        label: 'verificationCode',
                        type: 'string',
                        required: true,
                    },
                ]}
                handler={handleSubmit}
                onSuccess={() => onSuccess({ name: 'phone_number_verified', phoneNumber })}
                onError={onError}
            />
        </div>
    );
};

export type PhoneNumberEditorWidgetProps = Prettify<MainViewProps & VerificationCodeViewProps>;

export default createMultiViewWidget<PhoneNumberEditorWidgetProps>({
    initialView: 'main',
    views: {
        main: MainView,
        verificationCode: VerificationCodeView,
    },
});
