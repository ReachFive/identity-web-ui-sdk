import React, { type RefObject } from 'react';

import { Shield } from 'lucide-react';

import { ListEmpty } from '@/components/list/listItem';
import { useRowFocus } from '@/components/list/useRowFocus';
import { useRowRemoval } from '@/components/list/useRowRemoval';
import { ItemGroup } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import { credentialKey, isMfaCredential } from '@/widgets/mfa/credentials';
import { MfaCredentialRow } from '@/widgets/mfa/mfaCredentialRow';
import { isPasskeyCredential, type ListedCredential } from '@/widgets/mfa/passkeyCredential';
import { PasskeysRow } from '@/widgets/mfa/passkeysRow';
import { useRemoveMfaCredential } from '@/widgets/mfa/queries';

/** Key of the Passkeys row among the rows of the list. */
const PASSKEYS_ROW_KEY = 'passkeys';

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
    accessToken,
    onSuccess,
    onError,
}: MfaCredentialsListProps) => {
    const i18n = useI18n();
    const mfaCredentials = credentials.filter(isMfaCredential);
    const passkeyCount = credentials.filter(isPasskeyCredential).length;
    const rowKeys = [
        ...mfaCredentials.map(credentialKey),
        ...(passkeyCount > 0 ? [PASSKEYS_ROW_KEY] : []),
    ];
    const focus = useRowFocus(rowKeys, { [PASSKEYS_ROW_KEY]: passkeysRowRef });
    const removal = useRowRemoval({
        removal: useRemoveMfaCredential({ accessToken, onSuccess, onError }),
        onOpen: focus.watch,
    });

    if (credentials.length === 0) {
        return (
            <ListEmpty ref={focus.emptyStateRef} icon={<Shield />} title={i18n('mfaList.empty')} />
        );
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
