import React, { useMemo } from 'react';

import type { Config, Prettify } from '../../types';

import { createMultiViewWidget } from '../../components/widget/widget';
import { Info, Intro } from '../../components/miscComponent';
import { createForm } from '../../components/form/formComponent';
import { simpleField } from '../../components/form/fields/simpleField';
import phoneNumberField from '../../components/form/fields/phoneNumberField'

import { useReachfive } from '../../contexts/reachfive';
import { useI18n } from '../../contexts/i18n';
import { useRouting } from '../../contexts/routing';
import { useConfig } from '../../contexts/config';

type PhoneNumberFormData = { phoneNumber: string }

const phoneNumberInputForm = (config: Config) => createForm<PhoneNumberFormData>({
    prefix: 'r5-phonenumber-editor-',
    fields: [phoneNumberField({ required: true }, config)]
});

type VerificationCodeFormData = { verificationCode: string }

const VerificationCodeInputForm = createForm<VerificationCodeFormData>({
    prefix: 'r5-phonenumber-editor-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

interface MainViewProps {
    accessToken: string
    showLabels?: boolean
}

const MainView = ({ accessToken, showLabels = false }: MainViewProps) => {
    const coreClient = useReachfive()
    const config = useConfig()
    const i18n = useI18n()
    const { goTo } = useRouting()
    
    const handleSubmit = (data: PhoneNumberFormData) => {
        return coreClient.updatePhoneNumber({
            ...data,
            accessToken
        }).then(() => data);
    };

    const handleSuccess = (data: PhoneNumberFormData) => goTo<VerificationCodeViewState>('verificationCode', data);

    const PhoneNumberInputForm = useMemo(() => phoneNumberInputForm(config), [config]);

    return (
        <div>
            <Intro>{i18n('phoneNumberEditor.intro')}</Intro>
            <PhoneNumberInputForm
                showLabels={showLabels}
                handler={handleSubmit}
                onSuccess={handleSuccess}
            />
        </div>
    )
}

type VerificationCodeViewProps = {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string
    /**
     * Callback function called when the request has failed.
     */
    onSuccess?: () => void
    /**
     * Callback function called after the widget has been successfully loaded and rendered inside the container.
     * The callback is called with the widget instance.
     */
    onError?: () => void
}

type VerificationCodeViewState = {
    /**
     * The phone number to verify.
     */
    phoneNumber: string
}

const VerificationCodeView = ({
    accessToken,
    onSuccess = () => {},
    onError = () => {},
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { params } = useRouting()
    const { phoneNumber } = params as VerificationCodeViewState

    const handleSubmit = (data: VerificationCodeFormData) => {
        return coreClient.verifyPhoneNumber({ ...data, phoneNumber, accessToken });
    };

    return (
        <div>
            <Info>{i18n('phoneNumberEditor.verification.intro')}</Info>
            <VerificationCodeInputForm
                handler={handleSubmit}
                onSuccess={onSuccess}
                onError={onError}
            />
        </div>
    )
}

export type PhoneNumberEditorWidgetProps = Prettify<MainViewProps & VerificationCodeViewProps>

export default createMultiViewWidget<PhoneNumberEditorWidgetProps>({
    initialView: 'main',
    views: {
        main: MainView,
        verificationCode: VerificationCodeView,
    }
});
