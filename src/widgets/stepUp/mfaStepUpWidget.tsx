import { AuthOptions, MFA, PasswordlessResponse } from '@reachfive/identity-core';
import { PasswordlessParams } from '@reachfive/identity-core/es/main/oAuthClient';
import React, { useCallback, useEffect, useState } from 'react';

import type { OnError, OnSuccess, Prettify, RequiredProperty } from '../../types';

import radioboxField from '../../components/form/fields/radioboxField';
import { simpleField } from '../../components/form/fields/simpleField';
import { createForm } from '../../components/form/formComponent';
import { Info, Intro } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';

import { toQueryString } from '../../helpers/queryString';

import checkboxField from '../../components/form/fields/checkboxField';
import { useConfig } from '../../contexts/config.tsx';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';

const StartStepUpMfaButton = createForm({
    prefix: 'r5-mfa-start-step-up-',
    submitLabel: 'mfa.stepUp.start',
});

export type VerificationCodeInputFormData = {
    verificationCode: string;
    trustDevice?: boolean;
};

interface VerificationCodeFormOptions {
    allowTrustDevice?: boolean;
}

const VerificationCodeInputForm = createForm<
    VerificationCodeInputFormData,
    VerificationCodeFormOptions
>({
    prefix: 'r5-passwordless-sms-',
    fields({ allowTrustDevice }) {
        return [
            simpleField({
                key: 'verification_code',
                label: 'verificationCode',
                type: 'text',
            }),
            ...(allowTrustDevice
                ? [
                      checkboxField({
                          key: 'trust_device',
                          label: 'mfa.stepUp.trustDevice',
                          defaultValue: false,
                      }),
                  ]
                : []),
        ];
    },
});

type StartPasswordlessFormData = {
    authType: PasswordlessParams['authType'];
};

type StartPasswordlessFormProps = {
    options: Parameters<typeof radioboxField>[0]['options'];
};

const StartPasswordlessForm = createForm<StartPasswordlessFormData, StartPasswordlessFormProps>({
    prefix: 'r5-mfa-start-passwordless',
    fields({ options }) {
        return [
            radioboxField({
                key: 'authType',
                label: 'authType',
                options,
            }),
        ];
    },
});

export interface MainViewProps {
    /**
     * **Not recommended**
     *
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     *
     * If empty, using an existing SSO session cookie.
     */
    accessToken?: string;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Show the introduction text.
     *
     * @default true
     */
    showIntro?: boolean;
    /**
     * Show the stepup button. Unnecessary for console use
     *
     * @default true
     */
    showStepUpStart?: boolean;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

export const MainView = ({
    accessToken,
    auth,
    onError = (() => {}) as OnSuccess,
    onSuccess = (() => {}) as OnError,
    showIntro = true,
    showStepUpStart = true,
    allowTrustDevice = false,
}: MainViewProps) => {
    const coreClient = useReachfive();
    const { goTo } = useRouting();

    const [response, setResponse] = useState<MFA.StepUpResponse | undefined>();

    const onGetStepUpToken = useCallback(
        () =>
            coreClient
                .getMfaStepUpToken({
                    options: auth,
                    accessToken: accessToken,
                })
                .then(res => {
                    setResponse(res);
                    return res;
                }),
        [accessToken, auth, coreClient]
    );

    useEffect(() => {
        if (!showStepUpStart) {
            onGetStepUpToken();
        }
    }, [showStepUpStart, onGetStepUpToken]);

    if (showStepUpStart) {
        return (
            <StartStepUpMfaButton
                handler={onGetStepUpToken}
                onSuccess={(data: MFA.StepUpResponse) =>
                    goTo<FaSelectionViewState>('fa-selection', { ...data, allowTrustDevice })
                }
                onError={onError}
            />
        );
    }

    if (response) {
        return (
            <FaSelectionView
                {...response}
                showIntro={showIntro}
                auth={auth}
                allowTrustDevice={allowTrustDevice}
                onError={onError}
                onSuccess={onSuccess}
            />
        );
    }

    return null;
};

export type FaSelectionViewState = MFA.StepUpResponse & {
    allowTrustDevice?: boolean;
};

export type FaSelectionViewProps = Prettify<
    Partial<MFA.StepUpResponse> & {
        showIntro?: boolean;
        auth?: AuthOptions;
        allowTrustDevice?: boolean;
        /**
         * Callback function called when the request has succeed.
         */
        onSuccess?: OnSuccess;
        /**
         * Callback function called when the request has failed.
         */
        onError?: OnError;
    }
>;

// Unlike single factor authentication, StepUp request always returns a challengeId
type StepUpResponse = RequiredProperty<PasswordlessResponse, 'challengeId'>;

type StepUpHandlerResponse = StepUpResponse & StartPasswordlessFormData;

export const FaSelectionView = (props: FaSelectionViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const state = params as FaSelectionViewState;

    const {
        amr,
        onError = (() => {}) as OnError,
        showIntro = true,
        token,
    } = { ...props, ...state };

    const [response, setResponse] = useState<StepUpHandlerResponse | undefined>();

    const onChooseFa = useCallback(
        (factor: StartPasswordlessFormData): Promise<void> =>
            coreClient.startPasswordless({ ...factor, stepUp: token }).then(resp =>
                setResponse({
                    ...(resp as StepUpResponse),
                    ...factor,
                })
            ),
        [coreClient, token]
    );

    useEffect(() => {
        if (amr.length === 1) {
            onChooseFa({ authType: amr[0] as PasswordlessParams['authType'] });
        }
    }, [amr, onChooseFa]);

    if (response) {
        return (
            <VerificationCodeView
                {...response}
                auth={props.auth}
                allowTrustDevice={props.allowTrustDevice}
                onError={props.onError}
                onSuccess={props.onSuccess}
            />
        );
    }

    if (amr.length > 1) {
        return (
            <div>
                {showIntro && <Intro>{i18n('mfa.select.factor')}</Intro>}
                <StartPasswordlessForm
                    options={amr.map(factor => ({ key: factor, value: factor, label: factor }))}
                    handler={onChooseFa}
                    onError={onError}
                />
            </div>
        );
    }

    return null;
};

export type VerificationCodeViewState = Prettify<StepUpHandlerResponse>;

export type VerificationCodeViewProps = Prettify<
    Partial<StepUpHandlerResponse> & {
        /**
         * List of authentication options
         */
        auth?: AuthOptions;
        /**
         * Boolean that specifies whether a device can be trusted during step up.
         *
         * @default false
         */
        allowTrustDevice?: boolean;
        /**
         * Callback function called when the request has succeed.
         */
        onSuccess?: OnSuccess;
        /**
         * Callback function called when the request has failed.
         */
        onError?: OnError;
    }
>;

export const VerificationCodeView = (props: VerificationCodeViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const { rbaEnabled } = useConfig();
    const state = params as VerificationCodeViewState;

    const {
        auth,
        authType,
        challengeId,
        allowTrustDevice,
        onError = (() => {}) as OnError,
        onSuccess = (() => {}) as OnSuccess,
    } = { ...props, ...state };

    const handleSubmit = (data: VerificationCodeInputFormData) =>
        coreClient
            .verifyMfaPasswordless({
                challengeId,
                verificationCode: data.verificationCode,
                trustDevice: data.trustDevice,
            })
            .then(resp => {
                onSuccess();
                // @ts-expect-error AuthResult is too complex and is not representative of the real response of this request
                window.location.replace((auth?.redirectUri ?? '') + '?' + toQueryString(resp));
            });

    return (
        <div>
            {authType === 'sms' && <Info>{i18n('passwordless.sms.verification.intro')}</Info>}
            {authType === 'email' && <Info>{i18n('passwordless.email.verification.intro')}</Info>}
            <VerificationCodeInputForm
                allowTrustDevice={rbaEnabled && allowTrustDevice}
                handler={handleSubmit}
                onError={onError}
            />
        </div>
    );
};

export type MfaStepUpProps = MainViewProps & FaSelectionViewProps & VerificationCodeViewProps;

export type MfaStepUpWidgetProps = MfaStepUpProps;

export default createMultiViewWidget<MfaStepUpWidgetProps, MfaStepUpProps>({
    initialView: 'main',
    views: {
        main: MainView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView,
    },
});
