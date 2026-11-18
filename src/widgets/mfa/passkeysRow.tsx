import React, { forwardRef } from 'react';

import { Fingerprint } from 'lucide-react';

import { NavigationRow } from '@/components/list/navigationRow';
import { useI18n } from '@/contexts/i18n';

export const PASSKEYS_ROW_KEY = 'passkeys';

interface PasskeysRowProps {
    /** Number of passkeys, taken from the MFA credentials list. */
    count: number;
    onOpen: () => void;
    /** A removal confirmation is open: the row is dimmed and inert. */
    dimmed?: boolean;
    /** The Passkeys view is loading: the row is busy and shows a spinner in place of the chevron. */
    pending?: boolean;
}

/** One row for all the user's passkeys, with their count. No remove action. */
export const PasskeysRow = forwardRef<HTMLButtonElement, PasskeysRowProps>(function PasskeysRow(
    { count, onOpen, dimmed, pending },
    ref
) {
    const i18n = useI18n();

    return (
        <NavigationRow
            ref={ref}
            data-slot="widget-mfa-passkeys"
            icon={<Fingerprint />}
            title={i18n('mfaList.passkeys')}
            description={`${i18n('mfaList.passkeyCount', { count })} · ${i18n('mfaList.alsoUsedToLogIn')}`}
            onOpen={onOpen}
            dimmed={dimmed}
            pending={pending}
        />
    );
});
