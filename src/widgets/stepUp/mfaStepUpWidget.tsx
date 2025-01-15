import React, { useCallback, useEffect, useState } from 'react';
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

export interface MainViewProps {
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
    /**
     * Show the introduction text.
     * 
     * @default true
     */
    showIntro?: boolean
    /**
     * Show the stepup button. Unnecessary for console use
     * 
     * @default true
     */
    showStepUpStart?: boolean
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: () => void
    /**
     * Callback function called when the request has failed.
     */
    onError?: (error?: unknown) => void
}

export const MainView = ({
    accessToken,
    auth,
    onError = () => {},
    onSuccess = () => {},
    showIntro = true,
    showStepUpStart = true
}: MainViewProps) => {
    const coreClient = useReachfive()
    const { goTo } = useRouting()

    const [response, setResponse] = useState<MFA.StepUpResponse | undefined>()

    const onGetStepUpToken = useCallback(
        () => coreClient
            .getMfaStepUpToken({
                options: auth,
                accessToken: accessToken
            })
            .then(res => {
                setResponse(res)
                return res
            }),
        [accessToken, auth, coreClient]
    )

    useEffect(() => {
        if (!showStepUpStart) {
            onGetStepUpToken()
        }
    }, [showStepUpStart, onGetStepUpToken])

    if (showStepUpStart) {
        return (
            <StartStepUpMfaButton
                handler={onGetStepUpToken}
                onSuccess={(data: MFA.StepUpResponse) => goTo<FaSelectionViewState>('fa-selection', { ...data })}
                onError={onError}
            />
        )
    }

    if (response) {
        return (
            <FaSelectionView
                {...response}
                showIntro={showIntro}
                auth={auth}
                onError={onError}
                onSuccess={onSuccess}
            />
        )
    }

    return null
}

export type FaSelectionViewState = MFA.StepUpResponse

export type FaSelectionViewProps = Prettify<Partial<MFA.StepUpResponse> & {
    showIntro?: boolean
    auth?: AuthOptions
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: () => void
    /**
     * Callback function called when the request has failed.
     */
    onError?: (error?: unknown) => void
}>

 // Unlike single factor authentication, StepUp request always returns a challengeId
type StepUpResponse = RequiredProperty<PasswordlessResponse, 'challengeId'>

type StepUpHandlerResponse = StepUpResponse & StartPasswordlessFormData

export const FaSelectionView = (props: FaSelectionViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { params } = useRouting()
    const state = params as FaSelectionViewState

    const { amr, onError = () => {}, showIntro = true, token } = { ...props, ...state }

    const [response, setResponse] = useState<StepUpHandlerResponse | undefined>()

    const onChooseFa = useCallback(
        (factor: StartPasswordlessFormData): Promise<void> =>
            coreClient
                .startPasswordless({ ...factor, stepUp: token, })
                .then(resp => setResponse({
                    ...(resp as StepUpResponse),
                    ...factor,
                })),
        [coreClient, token]
    )

    useEffect(() => {
        if (amr.length === 1) {
            onChooseFa({ authType: amr[0] as PasswordlessParams['authType'] })
        }
    }, [amr, onChooseFa])

    if (response) {
        return (
            <VerificationCodeView
                {...response}
                auth={props.auth}
                onError={props.onError}
                onSuccess={props.onSuccess}
            />
        )
    }

    if (amr.length > 1) {
        return (
            <div>
                {showIntro && <Intro>{i18n('mfa.select.factor')}</Intro>}
                <StartPasswordlessForm
                    options={amr.map(factor => ({key: factor, value: factor, label: factor}))}
                    handler={onChooseFa}
                    onError={onError}
                />
            </div>
        )
    }

    return null;
}

export type VerificationCodeViewState = Prettify<StepUpHandlerResponse>

export type VerificationCodeViewProps = Prettify<Partial<StepUpHandlerResponse> & {
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: () => void
    /**
     * Callback function called when the request has failed.
     */
    onError?: (error?: unknown) => void
}>

export const VerificationCodeView = (props: VerificationCodeViewProps) => {
    const coreClient = useReachfive()
    const i18n = useI18n()
    const { params } = useRouting()
    const state = params as VerificationCodeViewState

    const { auth, authType, challengeId, onError = () => {}, onSuccess = () => {} } = { ...props, ...state }

    const handleSubmit = (data: VerificationCodeInputFormData) =>
        coreClient
            .verifyMfaPasswordless({challengeId, verificationCode: data.verificationCode})
            .then(resp => {
                onSuccess()
                // @ts-expect-error AuthResult is too complex and is not representative of the real response of this request 
                window.location.replace( (auth?.redirectUri ?? '') + "?" + toQueryString(resp))
            })

    return (
        <div>
            {authType === 'sms' && <Info>{i18n('passwordless.sms.verification.intro')}</Info>}
            {authType === 'email' && <Info>{i18n('passwordless.email.verification.intro')}</Info>}
            <VerificationCodeInputForm
                handler={handleSubmit}
                onError={onError}
            />
        </div>
    )
}

export type MfaStepUpProps = MainViewProps & FaSelectionViewProps & VerificationCodeViewProps

export type MfaStepUpWidgetProps = MfaStepUpProps

export default createMultiViewWidget<MfaStepUpWidgetProps, MfaStepUpProps>({
    initialView: 'main',
    views: {
        'main': MainView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView
    },
})
