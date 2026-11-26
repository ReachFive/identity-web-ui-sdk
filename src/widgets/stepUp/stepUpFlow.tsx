import React, { useEffect, useId, useRef, useState } from 'react';

import type { AuthOptions } from '@reachfive/identity-core';

import { Alert, AlertTitle } from '@/components/ui/alert';
import { ItemGroup } from '@/components/ui/item';
import { useViewNavigation, viewAnimation } from '@/components/widget/useViewNavigation';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { widgetErrorMessage } from '@/helpers/errors';
import { challengeOf, StepUpCodeView } from '@/widgets/stepUp/codeView';
import { StepUpFactorRow } from '@/widgets/stepUp/factorRow';
import { stepUpFactors, type CodeFactor } from '@/widgets/stepUp/factors';

import type { OnError, OnSuccess } from '@/types';

export interface StepUpFlowProps {
    /** The step-up token every code is sent with. */
    token: string;
    /** The factors the token accepts. */
    amr: string[];
    auth?: AuthOptions;
    allowTrustDevice?: boolean;
    onSuccess: OnSuccess;
    onError: OnError;
}

/** The routing state a view passes to open the step-up screens. */
export type StepUpViewState = {
    token: string;
    amr: string[];
    allowTrustDevice?: boolean;
    auth?: AuthOptions;
};

type StepUpView = 'entry' | 'code';

interface Challenge {
    authType: CodeFactor;
    challengeId: string;
}

/** The step-up screens: the choice of a factor, then the code sent to it. */
export function StepUpFlow({
    token,
    amr,
    auth,
    allowTrustDevice,
    onSuccess,
    onError,
}: StepUpFlowProps) {
    const client = useReachfive();
    const i18n = useI18n();
    const { codeFactors } = stepUpFactors(amr);
    // a single factor needs no choice: its code is sent at once
    const onlyFactor = codeFactors.length === 1 ? codeFactors[0] : undefined;
    const { view, direction, goTo, back } = useViewNavigation<StepUpView>('entry');
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [sending, setSending] = useState<CodeFactor | null>(null);
    // the last failure, shown until the next attempt
    const [error, setError] = useState<unknown>(null);
    const titleId = useId();
    const rowRefs = {
        email: useRef<HTMLButtonElement>(null),
        sms: useRef<HTMLButtonElement>(null),
    };

    const send = async (authType: CodeFactor) => {
        setSending(authType);
        setError(null);
        try {
            const response = await client.startPasswordless({ authType, stepUp: token });
            setChallenge({ authType, challengeId: challengeOf(response) });
            return true;
        } catch (failure) {
            setError(failure);
            onError(failure);
            return false;
        } finally {
            setSending(null);
        }
    };

    const open = async (authType: CodeFactor) => {
        if (sending) return;
        if (await send(authType)) goTo('code', { returnFocus: rowRefs[authType] });
    };

    // Each send uses the token once: send on mount only, even if the effect runs again.
    // Until the code is sent, the list shows the row, which stays there to retry a failed send.
    const sentOnMount = useRef(false);
    useEffect(() => {
        if (!onlyFactor || sentOnMount.current) return;
        sentOnMount.current = true;
        void open(onlyFactor);
    }, []);

    const renderView = () => {
        if (view === 'code') {
            return challenge ? (
                <StepUpCodeView
                    {...challenge}
                    token={token}
                    auth={auth}
                    allowTrustDevice={allowTrustDevice}
                    onBack={onlyFactor ? undefined : back}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            ) : null;
        }
        return (
            <div className="space-y-4">
                <ViewHeader id={titleId} title={i18n('mfa.stepUp.title')} />
                {error !== null && (
                    <Alert variant="destructive">
                        <AlertTitle className="mb-0">{widgetErrorMessage(error, i18n)}</AlertTitle>
                    </Alert>
                )}
                <ItemGroup aria-labelledby={titleId} className="gap-2">
                    {codeFactors.map(factor => (
                        <StepUpFactorRow
                            key={factor}
                            ref={rowRefs[factor]}
                            factor={factor}
                            pending={sending === factor}
                            onOpen={() => void open(factor)}
                        />
                    ))}
                </ItemGroup>
            </div>
        );
    };

    return (
        <div key={view} className={viewAnimation(direction)}>
            {renderView()}
        </div>
    );
}
