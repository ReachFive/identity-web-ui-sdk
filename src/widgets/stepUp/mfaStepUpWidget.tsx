import React from 'react';
import { AuthOptions, MFA, PasswordlessResponse } from '@reachfive/identity-core';
import { PasswordlessParams } from '@reachfive/identity-core/es/main/oAuthClient';

import { Prettify, RequiredProperty } from '../../types'

import {createMultiViewWidget} from '../../components/widget/widget';
import {createForm} from '../../components/form/formComponent';
import radioboxField from '../../components/form/fields/radioboxField';
import {Info, Intro} from '../../components/miscComponent';
import {simpleField} from '../../components/form/fields/simpleField';

import { toQueryString } from '../../helpers/queryString';

import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { useI18n } from '../../contexts/i18n';

const StartStepUpMfaButton = createForm({
    prefix: 'r5-mfa-start-step-up-',
    submitLabel: 'mfa.stepUp.start',
});

interface VerificationCodeInputFormData {
    verificationCode: string
}

const VerificationCodeInputForm = createForm<VerificationCodeInputFormData>({
    prefix: 'r5-passwordless-sms-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

interface StartPasswordlessFormData {
    authType: PasswordlessParams['authType']
}

interface StartPasswordlessFormProps {
    options: Parameters<typeof radioboxField>[0]['options']
}

const StartPasswordlessForm = createForm<StartPasswordlessFormData, StartPasswordlessFormProps>({
    prefix: 'r5-mfa-start-passwordless',
    fields({ options }) {
        return [
            radioboxField({
                key: 'authType',
                options
            }),
        ]
    }
})

export interface MfaStepUpViewProps {
    /**
     * **Not recommended**
     * 
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     * 
     * If empty, using an existing SSO session cookie.
     */
    accessToken?: string
    /**
     * List of authentication options
     */
    auth?: AuthOptions
}

export const MfaStepUpView = ({ accessToken, auth }: MfaStepUpViewProps) => {
    const coreClient = useReachfive()
    const { goTo } = useRouting()

    const onGetStepUpToken = () => 
        coreClient.getMfaStepUpToken({
            options: auth,
            accessToken: accessToken
        })

    return (
        <div>
            <StartStepUpMfaButton
                handler={onGetStepUpToken}
                onSuccess={(data: MFA.StepUpResponse) => goTo<FaSelectionViewState>('fa-selection', { ...data })}
            />
        </div>
    )
}

export type FaSelectionViewState = MFA.StepUpResponse

export type FaSelectionViewProps = { showIntro?: boolean }

 // Unlike single factor authentication, StepUp request always returns a challengeId
type StepUpResponse = RequiredProperty<PasswordlessResponse, 'challengeId'>

type StepUpHandlerResponse = StepUpResponse & StartPasswordlessFormData

export const FaSelectionView = ({ showIntro = true }: FaSelectionViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { goTo, params } = useRouting()
    const { amr, token } = params as FaSelectionViewState

    const onChooseFa = (factor: StartPasswordlessFormData): Promise<StepUpHandlerResponse> =>
        coreClient
            .startPasswordless({ ...factor, stepUp: token, })
            .then(resp => ({
                ...(resp as StepUpResponse),
                ...factor,
            }) )

    return (
        <div>
            {showIntro && <Intro>{i18n('mfa.select.factor')}</Intro>}
            <StartPasswordlessForm
                options={amr.map(factor => ({ key: factor, value: factor, label: factor }))}
                handler={onChooseFa}
                onSuccess={(data: StepUpHandlerResponse) => goTo<VerificationCodeViewState>('verification-code', { ...data, amr, token })
            }/>
        </div>
    )
}

export type VerificationCodeViewState = Prettify<StepUpHandlerResponse & FaSelectionViewState>

export type VerificationCodeViewProps = {
    /**
     * List of authentication options
     */
    auth?: AuthOptions
}

export const VerificationCodeView = ({ auth }: VerificationCodeViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { params } = useRouting()
    const { authType, challengeId } = params as VerificationCodeViewState

    const handleSubmit = (data: VerificationCodeInputFormData) =>
        coreClient
            .verifyMfaPasswordless({challengeId, verificationCode: data.verificationCode})
            // @ts-expect-error AuthResult is too complex and is not representative of the real response of this request 
            .then(resp => window.location.replace( auth.redirectUri + "?" + toQueryString(resp)))

    return (
        <div>
            {authType === "sms" && <Info>{i18n('passwordless.sms.verification.intro')}</Info>}
            {authType === "email" && <Info>{i18n('passwordless.email.verification.intro')}</Info>}
            <VerificationCodeInputForm handler={handleSubmit}/>
        </div>
    )
}

export type MfaStepUpProps = MfaStepUpViewProps & FaSelectionViewProps & VerificationCodeViewProps

export type MfaStepUpWidgetProps = MfaStepUpProps

export default createMultiViewWidget<MfaStepUpWidgetProps, MfaStepUpProps>({
    initialView: 'mfa-step-up',
    views: {
        'mfa-step-up': MfaStepUpView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView
    },
})
