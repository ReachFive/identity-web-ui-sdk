import React, { type RefObject } from 'react';

import { Shield } from 'lucide-react';

import { ListEmpty } from '@/components/list/listItem';
import { ItemGroup } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import { credentialKey, isMfaCredential } from '@/widgets/mfa/credentials';
import { MfaCredentialRows, useMfaCredentialRemoval } from '@/widgets/mfa/mfaCredentialRows';
import { isPasskeyCredential, type ListedCredential } from '@/widgets/mfa/passkeyCredential';
import { PasskeysRow } from '@/widgets/mfa/passkeysRow';

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
    const { focus, removal } = useMfaCredentialRemoval({
        accessToken,
        rowKeys,
        fixedControls: { [PASSKEYS_ROW_KEY]: passkeysRowRef },
        onSuccess,
        onError,
    });

    if (credentials.length === 0) {
        return (
            <ListEmpty ref={focus.emptyStateRef} icon={<Shield />} title={i18n('mfaList.empty')} />
        );
    }

    return (
        <ItemGroup className="gap-2">
            <MfaCredentialRows
                credentials={mfaCredentials}
                removable={removable}
                focus={focus}
                removal={removal}
            />
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
