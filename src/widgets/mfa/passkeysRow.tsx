import React, { useId } from 'react';

import { ChevronRight, Fingerprint } from 'lucide-react';

import { useI18n } from '@/contexts/i18n';
import {
    MfaCredentialContent,
    MfaCredentialIcon,
    MfaCredentialItem,
} from '@/widgets/mfa/mfaCredentialItem';

interface PasskeysRowProps {
    /** Number of passkeys, taken from the MFA credentials list. */
    count: number;
    /** Opens the Passkeys view. */
    onOpen?: () => void;
}

/**
 * The single row grouping the user's passkeys. It opens the Passkeys view, so it is a button
 * (inside a list item, since a button cannot be one) and has no remove action.
 */
export function PasskeysRow({ count, onOpen }: PasskeysRowProps) {
    const i18n = useI18n();
    const descriptionId = useId();

    return (
        <div role="listitem">
            <MfaCredentialItem
                asChild
                role={undefined}
                className="w-full items-center text-left hover:bg-accent"
            >
                <button
                    type="button"
                    aria-label={i18n('mfaList.managePasskeys')}
                    aria-describedby={descriptionId}
                    onClick={onOpen}
                >
                    <MfaCredentialIcon>
                        <Fingerprint />
                    </MfaCredentialIcon>
                    <MfaCredentialContent
                        title={i18n('mfaList.passkeys')}
                        descriptions={[
                            <span key="count" id={descriptionId}>
                                {`${i18n('mfaList.passkeyCount', { count })} · ${i18n('mfaList.alsoUsedToLogIn')}`}
                            </span>,
                        ]}
                    />
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                </button>
            </MfaCredentialItem>
        </div>
    );
}
