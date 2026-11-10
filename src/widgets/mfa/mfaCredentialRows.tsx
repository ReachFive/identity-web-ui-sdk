import React, { type RefObject } from 'react';

import { useRowFocus, type RowFocus } from '@/components/list/useRowFocus';
import { useRowRemoval } from '@/components/list/useRowRemoval';
import { credentialKey, type MfaCredential } from '@/widgets/mfa/credentials';
import { MfaCredentialRow } from '@/widgets/mfa/mfaCredentialRow';
import { useRemoveMfaCredential } from '@/widgets/mfa/queries';

import type { OnError, OnSuccess } from '@/types';

interface UseMfaCredentialRemovalOptions {
    accessToken: string;
    /** The keys of every focusable row of the screen, in display order. */
    rowKeys: string[];
    /** The rows without a trash button, by key: the focus can land on them after a removal. */
    fixedControls?: Readonly<Record<string, RefObject<HTMLElement>>>;
    onSuccess: OnSuccess;
    onError: OnError;
}

export type MfaCredentialRemoval = {
    focus: RowFocus;
    removal: ReturnType<typeof useRowRemoval<MfaCredential>>;
};

/**
 * The inline removal of MFA credential rows, with the focus kept on screen when a row closes its
 * confirmation or disappears.
 */
export function useMfaCredentialRemoval({
    accessToken,
    rowKeys,
    fixedControls,
    onSuccess,
    onError,
}: UseMfaCredentialRemovalOptions): MfaCredentialRemoval {
    const focus = useRowFocus(rowKeys, fixedControls);
    const removal = useRowRemoval({
        removal: useRemoveMfaCredential({ accessToken, onSuccess, onError }),
        onOpen: focus.watch,
    });
    return { focus, removal };
}

interface MfaCredentialRowsProps extends MfaCredentialRemoval {
    credentials: MfaCredential[];
    removable: boolean;
}

/** One removable row per MFA credential. */
export function MfaCredentialRows({
    credentials,
    removable,
    focus,
    removal,
}: MfaCredentialRowsProps) {
    return (
        <>
            {credentials.map(credential => {
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
        </>
    );
}
