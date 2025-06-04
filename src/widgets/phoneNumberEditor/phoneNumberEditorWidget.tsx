import React, { useMemo } from 'react';

import type { Config, Prettify } from '../../types';

import phoneNumberField, {
    type PhoneNumberOptions,
} from '../../components/form/fields/phoneNumberField';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { Info, Intro } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';

import { useConfig } from '../../contexts/config';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

import type { OnError, OnSuccess } from '../../types';

type PhoneNumberFormData = { phoneNumber: string };

const phoneNumberInputForm = (config: Config) =>
    createForm<PhoneNumberFormData, { phoneNumberOptions?: PhoneNumberOptions }>({
        prefix: 'r5-phonenumber-editor-',
        fields: ({ phoneNumberOptions }) => [
            phoneNumberField(
                {
                    required: true,
                    ...phoneNumberOptions,
                },
                config
            ),
        ],
    });

type VerificationCodeFormData = { verificationCode: string };

const VerificationCodeInputForm = createForm<VerificationCodeFormData>({
    prefix: 'r5-phonenumber-editor-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text',
        }),
    ],
});

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
}

const MainView = ({
    accessToken,
    showLabels = false,
    phoneNumberOptions,
    onError = (() => {}) as OnError,
}: MainViewProps) => {
    const coreClient = useReachfive();
    const config = useConfig();
    const i18n = useI18n();
    const { goTo } = useRouting();

    const handleSubmit = (data: PhoneNumberFormData) => {
        return coreClient
            .updatePhoneNumber({
                ...data,
                accessToken,
            })
            .then(() => data);
    };

    const handleSuccess = (data: PhoneNumberFormData) =>
        goTo<VerificationCodeViewState>('verificationCode', data);

    const PhoneNumberInputForm = useMemo(() => phoneNumberInputForm(config), [config]);

    return (
        <div>
            <Intro>{i18n('phoneNumberEditor.intro')}</Intro>
            <PhoneNumberInputForm
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
            <VerificationCodeInputForm
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
