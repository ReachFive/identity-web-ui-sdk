import React, { useEffect, useId, useRef, useState } from 'react';

import type { AuthOptions, AuthResult } from '@reachfive/identity-core';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ItemGroup } from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { useViewNavigation, viewAnimation } from '@/components/widget/useViewNavigation';
import { ViewHeader } from '@/components/widget/viewHeader';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';
import { useReachfive } from '@/contexts/reachfive';
import { useTrustDeviceLabel } from '@/widgets/mfa/trustDeviceField';
import { challengeOf, StepUpCodeView } from '@/widgets/stepUp/codeView';
import { StepUpFactorRow } from '@/widgets/stepUp/factorRow';
import { stepUpFactors, type CodeFactor } from '@/widgets/stepUp/factors';
import { PasskeyCard } from '@/widgets/stepUp/passkeyCard';

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

type FlowView = 'entry' | 'other' | 'code';

interface Challenge {
    authType: CodeFactor;
    challengeId: string;
}

interface TrustDeviceCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

function TrustDeviceCheckbox({ checked, onChange }: TrustDeviceCheckboxProps) {
    const id = useId();
    const label = useTrustDeviceLabel();
    return (
        <div className="flex items-center gap-2">
            <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={value => onChange(value === true)}
            />
            <Label htmlFor={id} className="font-normal">
                {label}
            </Label>
        </div>
    );
}

/**
 * The step-up screens: the passkey first when offered, the choice of a code factor, then the code
 * sent to it.
 */
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
    const config = useConfig();
    const { passkey, codeFactors } = stepUpFactors(amr, config);
    // a single factor needs no choice: its code is sent at once, unless the passkey comes first
    const onlyFactor = !passkey && codeFactors.length === 1 ? codeFactors[0] : undefined;
    const { view, direction, goTo, back } = useViewNavigation<FlowView>('entry');
    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [sending, setSending] = useState<CodeFactor | null>(null);
    // held here so it survives a visit to the other methods
    const [trustDevice, setTrustDevice] = useState(false);
    const showTrustDevice = allowTrustDevice === true && config.rbaEnabled === true;
    const passkeyOpen = useRef(false);
    const otherMethodsLink = useRef<HTMLButtonElement>(null);
    const rowRefs = {
        email: useRef<HTMLButtonElement>(null),
        sms: useRef<HTMLButtonElement>(null),
    };

    // Core sends the user on after a success: no redirect here. No waiting state either, the
    // browser shows its own prompt.
    const stepUpWithPasskey = async () => {
        if (passkeyOpen.current) return;
        passkeyOpen.current = true;
        let authResult: AuthResult;
        try {
            authResult = await client.achieveStepUpWithWebAuthn({
                stepUpToken: token,
                trustDevice,
            });
        } catch (error) {
            onError(error);
            return;
        } finally {
            passkeyOpen.current = false;
        }
        onSuccess({ name: 'login_2nd_step', authType: 'webauthn', authResult });
        if (trustDevice) onSuccess({ name: 'mfa_trusted_device_added' });
    };

    const send = async (authType: CodeFactor) => {
        setSending(authType);
        try {
            const response = await client.startPasswordless({ authType, stepUp: token });
            setChallenge({ authType, challengeId: challengeOf(response) });
            return true;
        } catch (error) {
            onError(error);
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
        const factorRows = (
            <ItemGroup aria-label={i18n('mfa.stepUp.title')} className="gap-2">
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
        );
        if (view === 'other') {
            return (
                <div className="space-y-4">
                    <ViewHeader
                        title={i18n('mfa.stepUp.chooseAnotherMethod')}
                        backLabel={i18n('mfaList.back')}
                        onBack={back}
                    />
                    {factorRows}
                </div>
            );
        }
        if (!passkey) {
            return (
                <div className="space-y-4">
                    <ViewHeader title={i18n('mfa.stepUp.title')} />
                    {factorRows}
                </div>
            );
        }
        return (
            <div className="space-y-4">
                <ViewHeader title={i18n('mfa.stepUp.title')} />
                <ItemGroup aria-label={i18n('mfa.stepUp.title')}>
                    <PasskeyCard onOpen={() => void stepUpWithPasskey()} />
                </ItemGroup>
                {showTrustDevice ? (
                    <TrustDeviceCheckbox checked={trustDevice} onChange={setTrustDevice} />
                ) : null}
                {codeFactors.length > 0 ? (
                    <Button
                        ref={otherMethodsLink}
                        type="button"
                        variant="link"
                        className="w-full"
                        onClick={() => goTo('other', { returnFocus: otherMethodsLink })}
                    >
                        {i18n('mfa.stepUp.useAnotherMethod')}
                    </Button>
                ) : null}
            </div>
        );
    };

    return (
        <div key={view} className={viewAnimation(direction)}>
            {renderView()}
        </div>
    );
}
