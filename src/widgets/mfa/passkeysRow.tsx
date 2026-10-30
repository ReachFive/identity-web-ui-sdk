import React, { forwardRef, useId } from 'react';

import { ChevronRight, Fingerprint, LoaderCircle } from 'lucide-react';

import { ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import {
    dimmedRowProps,
    MfaCredentialIcon,
    MfaCredentialItem,
} from '@/widgets/mfa/mfaCredentialItem';

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

/**
 * The single row grouping the user's passkeys. Its title is a button stretched over the whole
 * row, so the row opens the Passkeys view from anywhere while keeping the `Item` layout (a button
 * only holds phrasing content). The button is described by the count. No remove action.
 */
export const PasskeysRow = forwardRef<HTMLButtonElement, PasskeysRowProps>(function PasskeysRow(
    { count, onOpen, dimmed = false, pending = false },
    ref
) {
    const i18n = useI18n();
    const descriptionId = useId();

    return (
        <MfaCredentialItem
            {...dimmedRowProps(
                dimmed,
                'relative items-center has-[button:hover]:bg-button-subtle-bg has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50'
            )}
        >
            <MfaCredentialIcon className="group-has-[[data-slot=item-description]]/item:translate-y-0 group-has-[[data-slot=item-description]]/item:self-center">
                <Fingerprint />
            </MfaCredentialIcon>
            <ItemContent className="min-w-0 gap-0.5">
                <ItemTitle className="w-auto font-semibold text-foreground [overflow-wrap:anywhere]">
                    <button
                        ref={ref}
                        type="button"
                        className="text-left outline-none after:absolute after:inset-0 after:rounded"
                        aria-describedby={descriptionId}
                        aria-busy={pending || undefined}
                        onClick={pending ? undefined : onOpen}
                    >
                        {i18n('mfaList.passkeys')}
                    </button>
                </ItemTitle>
                <ItemDescription id={descriptionId}>
                    {`${i18n('mfaList.passkeyCount', { count })} · ${i18n('mfaList.alsoUsedToLogIn')}`}
                </ItemDescription>
            </ItemContent>
            <ItemActions aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
                {pending ? <LoaderCircle className="animate-spin" /> : <ChevronRight />}
            </ItemActions>
        </MfaCredentialItem>
    );
});
