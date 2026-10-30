import React, { useEffect, useRef } from 'react';

import { MFA } from '@reachfive/identity-core';

import { createQueryWidget } from '@/components/widget/queryWidget';
import { useViewNavigation, viewAnimation } from '@/components/widget/useViewNavigation';
import { OnError, OnSuccess } from '@/types';
import { MfaCredentialsList } from '@/widgets/mfa/mfaCredentialsList';
import { PasskeysView } from '@/widgets/mfa/passkeysView';
import { useMfaCredentials } from '@/widgets/mfa/queries';

export interface MfaListProps {
    /**
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     */
    accessToken: string;
    /**
     * Callback function called when the request has succeeded.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Indicates whether delete mfa credential button is displayed
     */
    showRemoveMfaCredential?: boolean;
}

/**
 * Fires `mfa_credentials_listed` once, on the first successful load, and not on later refetches.
 */
const useCredentialsListedEvent = (credentials: MFA.Credential[], onSuccess: OnSuccess) => {
    const listed = useRef(false);

    useEffect(() => {
        if (listed.current) return;
        listed.current = true;
        onSuccess({ name: 'mfa_credentials_listed', credentials });
    }, [credentials, onSuccess]);
};

export const MfaList = ({
    accessToken,
    showRemoveMfaCredential = false,
    onError = () => {},
    onSuccess = () => {},
}: MfaListProps) => {
    const {
        data: { credentials },
    } = useMfaCredentials(accessToken);
    const { view, direction, pending, goTo, back } = useViewNavigation<'list' | 'passkeys'>('list');
    const passkeysRowRef = useRef<HTMLButtonElement>(null);

    useCredentialsListedEvent(credentials, onSuccess);

    // The credentials query stays mounted in both views, so a passkey change made in the
    // Passkeys view refetches the list in the background.
    return (
        <div key={view} className={viewAnimation(direction)}>
            {view === 'passkeys' ? (
                <PasskeysView
                    accessToken={accessToken}
                    onBack={back}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            ) : (
                <MfaCredentialsList
                    accessToken={accessToken}
                    credentials={credentials}
                    removable={showRemoveMfaCredential}
                    passkeysRowRef={passkeysRowRef}
                    onOpenPasskeys={() => goTo('passkeys', { returnFocus: passkeysRowRef })}
                    openingPasskeys={pending}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            )}
        </div>
    );
};

export type MfaListWidgetProps = MfaListProps;

export default createQueryWidget<MfaListWidgetProps>({
    component: MfaList,
});
