import React, { type RefObject } from 'react';

import { Shield } from 'lucide-react';

import { type MFA } from '@reachfive/identity-core';

import { ListEmpty } from '@/components/list/listItem';
import { ItemGroup } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { OnError, OnSuccess } from '@/types';
import { credentialKey } from '@/widgets/mfa/credentials';
import { groupCredentials } from '@/widgets/mfa/factors';
import { MfaCredentialRows, useMfaCredentialRemoval } from '@/widgets/mfa/mfaCredentialRows';
import { PASSKEYS_ROW_KEY, PasskeysRow } from '@/widgets/mfa/passkeysRow';

interface MfaCredentialsListProps {
    accessToken: string;
    credentials: MFA.Credential[];
    removable: boolean;
    passkeysRowRef: RefObject<HTMLButtonElement>;
    /** Holds the list, or the empty state in its place: focusable by script only. */
    listRef: RefObject<HTMLDivElement>;
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
    listRef,
    onOpenPasskeys,
    openingPasskeys,
    accessToken,
    onSuccess,
    onError,
}: MfaCredentialsListProps) => {
    const i18n = useI18n();
    const { enabled: mfaCredentials, passkeyCount } = groupCredentials(credentials);
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

    // ItemGroup takes no ref: a wrapper holds the focus given back by the widget
    return (
        <div ref={listRef} tabIndex={-1} className="outline-none">
            {credentials.length === 0 ? (
                <ListEmpty
                    ref={focus.emptyStateRef}
                    icon={<Shield />}
                    title={i18n('mfaList.empty')}
                />
            ) : (
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
            )}
        </div>
    );
};
