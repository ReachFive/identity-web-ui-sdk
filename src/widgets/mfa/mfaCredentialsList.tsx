import React, { useState, type RefObject } from 'react';

import { ItemGroup } from '@/components/ui/item';
import { OnError, OnSuccess } from '@/types';
import { credentialKey, isMfaCredential, type MfaCredential } from '@/widgets/mfa/credentials';
import { MfaCredentialRow } from '@/widgets/mfa/mfaCredentialRow';
import { MfaCredentialsEmpty } from '@/widgets/mfa/mfaListItem';
import { isPasskeyCredential, type ListedCredential } from '@/widgets/mfa/passkeyCredential';
import { PasskeysRow } from '@/widgets/mfa/passkeysRow';
import { useRemoveMfaCredential } from '@/widgets/mfa/queries';
import { PASSKEYS_ROW_KEY, useRowFocus } from '@/widgets/mfa/useRowFocus';

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
        confirm: (credential: MfaCredential) => {
            if (removal.isPending) return;
            // Settled covers both outcomes: on success the row is already gone from the
            // refetched list, on error it returns to normal with the factor kept.
            removal.mutate(credential, { onSettled: close });
        },
    };
};

interface MfaCredentialsListProps {
    accessToken: string;
    credentials: ListedCredential[];
    removable: boolean;
    passkeysRowRef: RefObject<HTMLButtonElement>;
    onOpenPasskeys: () => void;
    /** The Passkeys view is loading its devices. */
    openingPasskeys: boolean;
    onSuccess: OnSuccess;
    onError: OnError;
}

/** The rows of the list, or the empty state without any factor. */
export const MfaCredentialsList = ({
    credentials,
    removable,
    passkeysRowRef,
    onOpenPasskeys,
    openingPasskeys,
    ...callbacks
}: MfaCredentialsListProps) => {
    const mfaCredentials = credentials.filter(isMfaCredential);
    const passkeyCount = credentials.filter(isPasskeyCredential).length;
    const rowKeys = [
        ...mfaCredentials.map(credentialKey),
        ...(passkeyCount > 0 ? [PASSKEYS_ROW_KEY] : []),
    ];
    const focus = useRowFocus(rowKeys, passkeysRowRef);
    const removal = useCredentialRemoval({ ...callbacks, onOpen: focus.watch });

    if (credentials.length === 0) {
        return <MfaCredentialsEmpty ref={focus.emptyStateRef} />;
    }

    return (
        <ItemGroup className="gap-2">
            {mfaCredentials.map(credential => {
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
