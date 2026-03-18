import React, { useCallback, useEffect, useState } from 'react';

import { AuthOptions, MFA, PasswordlessResponse } from '@reachfive/identity-core';
import { StepUpPasswordlessParams } from '@reachfive/identity-core/es/main/oAuthClient';

import { Form } from '@/components/form/form.tsx';
import { Field } from '@/lib/form.tsx';

import { Info, Intro } from '../../components/miscComponent';
import { createMultiViewWidget } from '../../components/widget/widget';
import { useConfig } from '../../contexts/config.tsx';
import { useI18n } from '../../contexts/i18n';
import { useReachfive } from '../../contexts/reachfive';
import { useRouting } from '../../contexts/routing';
import { toQueryString } from '../../helpers/queryString';

import type { OnError, OnSuccess, Prettify, RequiredProperty } from '../../types';

export type VerificationCodeInputFormData = {
    verificationCode: string;
    trustDevice?: boolean;
};

type StepUpFormData = {
    authType: StepUpPasswordlessParams['authType'];
};

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
    /**
     * Action used in template
     */
    action?: string;
}

export const MainView = ({
    accessToken,
    auth,
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
    showIntro = true,
    showStepUpStart = true,
    allowTrustDevice = false,
    action,
}: MainViewProps) => {
    const coreClient = useReachfive();
    const { goTo } = useRouting();

    const [response, setResponse] = useState<MFA.StepUpResponse | undefined>();

    const onGetStepUpToken = useCallback(async () => {
        try {
            const res = await coreClient.getMfaStepUpToken({
                options: auth,
                accessToken: accessToken,
                action,
            });
            setResponse(res);
            return res;
        } catch (error) {
            onError(error);
            throw error;
        }
    }, [accessToken, action, auth, coreClient, onError]);

    useEffect(() => {
        if (!showStepUpStart) {
            onGetStepUpToken().catch(onError);
        }
    }, [showStepUpStart, onGetStepUpToken]);

    if (showStepUpStart) {
        return (
            <Form
                submitLabel="mfa.stepUp.start"
                handler={onGetStepUpToken}
                onSuccess={(data: MFA.StepUpResponse) =>
                    goTo<FaSelectionViewState>('fa-selection', { ...data, allowTrustDevice, auth })
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
    auth?: AuthOptions;
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

type StepUpHandlerResponse = StepUpResponse & StepUpFormData;

export const FaSelectionView = ({
    onError = (() => {}) as OnError,
    onSuccess,
    ...props
}: FaSelectionViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const state = params as FaSelectionViewState;

    const { allowTrustDevice, amr, auth, showIntro = true, token } = { ...props, ...state };

    const [response, setResponse] = useState<StepUpHandlerResponse | undefined>();

    const onChooseFa = useCallback(
        async (factor: StepUpFormData): Promise<void> => {
            await coreClient.startPasswordless({ ...factor, stepUp: token }).then(resp =>
                setResponse({
                    ...(resp as StepUpResponse),
                    ...factor,
                })
            );
        },
        [coreClient, token]
    );

    useEffect(() => {
        if (amr.length === 1) {
            onChooseFa({ authType: amr[0] as StepUpPasswordlessParams['authType'] }).catch(onError);
        }
    }, [amr, onChooseFa]);

    if (response) {
        return (
            <VerificationCodeView
                {...response}
                auth={auth}
                allowTrustDevice={allowTrustDevice}
                onError={onError}
                onSuccess={onSuccess}
            />
        );
    }

    if (amr.length > 1) {
        return (
            <div>
                {showIntro && <Intro>{i18n('mfa.select.factor')}</Intro>}
                <Form
                    fields={[
                        {
                            type: 'radio-group',
                            key: 'authType',
                            label: 'authType',
                            values: amr.map(value => ({
                                value: value,
                                label: value,
                            })),
                            required: true,
                        },
                    ]}
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

export const VerificationCodeView = ({
    onError = (() => {}) as OnError,
    onSuccess = (() => {}) as OnSuccess,
    ...props
}: VerificationCodeViewProps) => {
    const coreClient = useReachfive();
    const i18n = useI18n();
    const { params } = useRouting();
    const { rbaEnabled, domain } = useConfig();
    const state = params as VerificationCodeViewState;

    const { auth, authType, challengeId, allowTrustDevice } = { ...props, ...state };

    const handleSubmit = (data: VerificationCodeInputFormData) => {
        const isOrchestratedFlow = new URLSearchParams(window.location.search).has(
            'r5_request_token'
        );
        if (isOrchestratedFlow) {
            window.location.replace(
                `https://${domain}/identity/v1/passwordless/verify` +
                    '?' +
                    toQueryString({
                        ...data,
                        challengeId,
                    })
            );
            return Promise.resolve();
        } else {
            return coreClient
                .verifyMfaPasswordless({
                    challengeId,
                    verificationCode: data.verificationCode,
                    trustDevice: data.trustDevice,
                })
                .then(resp => {
                    onSuccess({ name: 'login_2nd_step', authType, authResult: resp });
                    if (data.trustDevice) {
                        onSuccess({ name: 'mfa_trusted_device_added' });
                    }
                    // @ts-expect-error AuthResult is too complex and is not representative of the real response of this request
                    window.location.replace((auth?.redirectUri ?? '') + '?' + toQueryString(resp));
                });
        }
    };

    return (
        <div>
            {authType === 'sms' && <Info>{i18n('passwordless.sms.verification.intro')}</Info>}
            {authType === 'email' && <Info>{i18n('passwordless.email.verification.intro')}</Info>}
            <Form
                fields={[
                    {
                        key: 'verification_code',
                        label: 'verificationCode',
                        type: 'string',
                        required: true,
                    },
                    ...((rbaEnabled && allowTrustDevice
                        ? [
                              {
                                  type: 'checkbox',
                                  key: 'trust_device',
                                  label: 'mfa.stepUp.trustDevice',
                                  defaultChecked: false,
                              },
                          ]
                        : []) satisfies Field[]),
                ]}
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
