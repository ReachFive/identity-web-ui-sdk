import React, { useMemo, useState } from 'react';

import type { AuthOptions, PasswordlessResponse } from '@reachfive/identity-core';

import { Form } from '@/components/form/form';
import { Intro } from '@/components/miscComponent';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useTrustDeviceField } from '@/widgets/mfa/trustDeviceField';
import { completeStepUp } from '@/widgets/stepUp/redirect';

import type { OnError, OnSuccess } from '@/types';
import type { CodeFactor } from '@/widgets/stepUp/factors';

/** The default of `step-up-token.max_trials`, when the remote settings do not tell. */
const DEFAULT_STEP_UP_TOKEN_MAX_USES = 3;

export interface StepUpCodeViewProps {
    token: string;
    authType: CodeFactor;
    /** The challenge of the code first sent. */
    challengeId: string;
    auth?: AuthOptions;
    allowTrustDevice?: boolean;
    onBack?: () => void;
    onSuccess: OnSuccess;
    onError: OnError;
}

interface CodeFormData {
    verificationCode: string;
    trustDevice?: boolean;
}

/** The challenge of a code sent for a step-up. Throws when the response has none. */
export function challengeOf(response: PasswordlessResponse): string {
    if (!response.challengeId) throw new Error('The step-up code was sent without a challenge');
    return response.challengeId;
}

/** Code entry screen of a step-up. */
export function StepUpCodeView({
    token,
    authType,
    challengeId: firstChallengeId,
    auth,
    allowTrustDevice,
    onBack,
    onSuccess,
    onError,
}: StepUpCodeViewProps) {
    const client = useReachfive();
    const { rbaEnabled, stepUpTokenMaxUses } = useConfig();
    const i18n = useI18n();
    // every code sent opens a new challenge
    const [challengeId, setChallengeId] = useState(firstChallengeId);
    const showTrustDevice = allowTrustDevice === true && rbaEnabled === true;
    const trustDeviceField = useTrustDeviceField();

    const fields = useMemo(() => {
        // a new code can only be sent with the step-up token the first one was sent with
        const resend = async () => {
            try {
                const response = await client.startPasswordless({ authType, stepUp: token });
                setChallengeId(challengeOf(response));
            } catch (error) {
                onError(error);
                throw error;
            }
        };
        return [
            {
                key: 'verification_code',
                maxSends: stepUpTokenMaxUses ?? DEFAULT_STEP_UP_TOKEN_MAX_USES,
                onResend: resend,
                // no auto-submit with the checkbox: the user must be able to tick it first
                autoSubmit: !showTrustDevice,
            },
            ...(showTrustDevice ? [trustDeviceField] : []),
        ];
    }, [client, authType, token, stepUpTokenMaxUses, showTrustDevice, trustDeviceField, onError]);

    const verify = async ({ verificationCode, trustDevice }: CodeFormData) => {
        const authResult = await client.verifyMfaPasswordless({
            challengeId,
            verificationCode,
            trustDevice,
        });
        onSuccess({ name: 'login_2nd_step', authType, authResult });
        if (trustDevice) onSuccess({ name: 'mfa_trusted_device_added' });
        completeStepUp(auth, authResult);
    };

    return (
        <div className="space-y-4">
            {onBack ? (
                <ViewHeader
                    title={i18n('mfa.code.title')}
                    backLabel={i18n('mfaList.back')}
                    onBack={onBack}
                />
            ) : (
                <ViewHeader title={i18n('mfa.code.title')} />
            )}
            <Intro>{i18n(`passwordless.${authType}.verification.intro`)}</Intro>
            <Form fields={fields} submitLabel="mfa.verify" handler={verify} onError={onError} />
        </div>
    );
}
