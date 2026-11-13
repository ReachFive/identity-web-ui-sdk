import React, { forwardRef } from 'react';

import { Fingerprint } from 'lucide-react';

import { NavigationRow } from '@/components/list/navigationRow';
import { useI18n } from '@/contexts/i18n';

/** Key of the Passkeys row among the rows of a screen. */
export const PASSKEYS_ROW_KEY = 'passkeys';

interface PasskeysRowProps {
    /** Number of passkeys, taken from the MFA credentials list. */
    count: number;
    /** Opens the Passkeys view. */
    onOpen: () => void;
    /** A removal confirmation is open in the list: the row is dimmed and inert. */
    dimmed?: boolean;
    /** The Passkeys view is loading: the row is busy and shows a spinner in place of its chevron. */
    pending?: boolean;
}

/** The single row grouping the user's passkeys, described by their count. No remove action. */
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
