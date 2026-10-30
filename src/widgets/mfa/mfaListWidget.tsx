import React, { useEffect, useRef, useState, type RefObject } from 'react';

import { MFA } from '@reachfive/identity-core';

import { ItemGroup } from '@/components/ui/item';
import { createQueryWidget } from '@/components/widget/queryWidget';
import { OnError, OnSuccess } from '@/types';
import {
    credentialKey,
    isEmailOrPhoneCredential,
    type EmailOrPhoneCredential,
} from '@/widgets/mfa/credentials';
import { MfaCredentialsEmpty } from '@/widgets/mfa/mfaCredentialItem';
import { MfaCredentialRow } from '@/widgets/mfa/mfaCredentialRow';
import { isPasskeyCredential, type MfaCredential } from '@/widgets/mfa/passkeyCredential';
import { PasskeysRow } from '@/widgets/mfa/passkeysRow';
import { PasskeysView } from '@/widgets/mfa/passkeysView';
import { useMfaCredentials, useRemoveMfaCredential } from '@/widgets/mfa/queries';
import { type MfaNavigation, useMfaView } from '@/widgets/mfa/useMfaView';
import { PASSKEYS_ROW_KEY, useRowFocus } from '@/widgets/mfa/useRowFocus';

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

interface UseCredentialRemovalOptions {
    accessToken: string;
    onSuccess: OnSuccess;
    onError: OnError;
    /** Called with the row key when its confirmation opens. */
    onOpen: (key: string) => void;
}

/**
 * The removal flow of the list: one confirmation open at a time, then the removal request.
 */
const useCredentialRemoval = ({
    accessToken,
    onSuccess,
    onError,
    onOpen,
}: UseCredentialRemovalOptions) => {
    /** Key of the row showing its removal confirmation. */
    const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
    const removal = useRemoveMfaCredential({ accessToken, onSuccess, onError });
    const close = () => setConfirmingKey(null);

    return {
        confirmingKey,
        pending: removal.isPending,
        open: (key: string) => {
            onOpen(key);
            setConfirmingKey(key);
        },
        cancel: close,
        confirm: (credential: EmailOrPhoneCredential) => {
            if (removal.isPending) return;
            // Settled covers both outcomes: on success the row is already gone from the
            // refetched list, on error it returns to normal with the factor kept.
            removal.mutate(credential, { onSettled: close });
        },
    };
};

interface MfaCredentialsListProps extends Required<Omit<MfaListProps, 'showRemoveMfaCredential'>> {
    credentials: MfaCredential[];
    removable: boolean;
    passkeysRowRef: RefObject<HTMLButtonElement>;
    onOpenPasskeys: () => void;
    /** The Passkeys view is loading its devices. */
    openingPasskeys: boolean;
}

/** The rows of the list, or the empty state without any factor. */
const MfaCredentialsList = ({
    credentials,
    removable,
    passkeysRowRef,
    onOpenPasskeys,
    openingPasskeys,
    ...callbacks
}: MfaCredentialsListProps) => {
    const emailAndPhoneCredentials = credentials.filter(isEmailOrPhoneCredential);
    const passkeyCount = credentials.filter(isPasskeyCredential).length;
    const rowKeys = [
        ...emailAndPhoneCredentials.map(credentialKey),
        ...(passkeyCount > 0 ? [PASSKEYS_ROW_KEY] : []),
    ];
    const focus = useRowFocus(rowKeys, passkeysRowRef);
    const removal = useCredentialRemoval({ ...callbacks, onOpen: focus.watch });

    if (credentials.length === 0) {
        return <MfaCredentialsEmpty ref={focus.emptyStateRef} />;
    }

    return (
        <ItemGroup className="gap-2">
            {emailAndPhoneCredentials.map(credential => {
                const key = credentialKey(credential);
                return (
                    <MfaCredentialRow
                        key={key}
                        credential={credential}
                        removable={removable}
                        trashRef={focus.controlRef(key)}
                        confirming={removal.confirmingKey === key}
                        dimmed={removal.confirmingKey !== null && removal.confirmingKey !== key}
                        pending={removal.pending}
                        onRequestRemoval={() => removal.open(key)}
                        onCancel={removal.cancel}
                        onConfirm={() => removal.confirm(credential)}
                    />
                );
            })}
            {passkeyCount > 0 && (
                <PasskeysRow
                    ref={passkeysRowRef}
                    count={passkeyCount}
                    dimmed={removal.confirmingKey !== null}
                    onOpen={onOpenPasskeys}
                    pending={openingPasskeys}
                />
            )}
        </ItemGroup>
    );
};

/**
 * The entering view slides in from the side the user is heading to; the first view shows
 * without animation. Only the entering view animates: animating the leaving one would mean
 * keeping both mounted.
 */
const VIEW_ANIMATIONS: Record<NonNullable<MfaNavigation>, string> = {
    forward: 'animate-mfa-view-forward motion-reduce:animate-none',
    back: 'animate-mfa-view-back motion-reduce:animate-none',
};

const viewAnimation = (navigation: MfaNavigation) =>
    navigation === null ? undefined : VIEW_ANIMATIONS[navigation];

export const MfaList = ({
    accessToken,
    showRemoveMfaCredential = false,
    onError = () => {},
    onSuccess = () => {},
}: MfaListProps) => {
    const {
        data: { credentials },
    } = useMfaCredentials(accessToken);
    const { view, navigation, openingPasskeys, openPasskeys, backToList, passkeysRowRef } =
        useMfaView();

    useCredentialsListedEvent(credentials, onSuccess);

    // The credentials query stays mounted in both views, so a passkey change made in the
    // Passkeys view refetches the list in the background.
    return (
        <div key={view} className={viewAnimation(navigation)}>
            {view === 'passkeys' ? (
                <PasskeysView
                    accessToken={accessToken}
                    onBack={backToList}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            ) : (
                <MfaCredentialsList
                    accessToken={accessToken}
                    credentials={credentials}
                    removable={showRemoveMfaCredential}
                    passkeysRowRef={passkeysRowRef}
                    onOpenPasskeys={openPasskeys}
                    openingPasskeys={openingPasskeys}
                    onSuccess={onSuccess}
                    onError={onError}
                />
            )}
        </div>
    );
};

export type MfaListWidgetProps = {
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
};

export default createQueryWidget<MfaListWidgetProps>({
    component: MfaList,
});
