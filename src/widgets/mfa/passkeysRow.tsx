import React, { forwardRef, useId } from 'react';

import { ChevronRight, Fingerprint } from 'lucide-react';

import { Item } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';
import { dimmedRowProps, iconTileClassName, rowClassName } from '@/widgets/mfa/mfaCredentialItem';

interface PasskeysRowProps {
    /** Number of passkeys, taken from the MFA credentials list. */
    count: number;
    /** Opens the Passkeys view. */
    onOpen: () => void;
    /** A removal confirmation is open in the list: the row is dimmed and inert. */
    dimmed?: boolean;
}

/**
 * The single row grouping the user's passkeys. It opens the Passkeys view, so it is a button
 * inside the list item (a button cannot be one), named by its visible title and described by the
 * count. A button only holds phrasing content, hence spans throughout. No remove action.
 */
export const PasskeysRow = forwardRef<HTMLButtonElement, PasskeysRowProps>(function PasskeysRow(
    { count, onOpen, dimmed = false },
    ref
) {
    const i18n = useI18n();
    const titleId = useId();
    const descriptionId = useId();

    return (
        <div data-slot="widget-mfa-credential" role="listitem" {...dimmedRowProps(dimmed)}>
            <Item
                asChild
                variant="outline"
                className={cn(
                    rowClassName,
                    'w-full items-center text-left hover:bg-button-subtle-bg'
                )}
            >
                <button
                    ref={ref}
                    type="button"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    onClick={onOpen}
                >
                    <span
                        aria-hidden="true"
                        className={cn(
                            'flex shrink-0 items-center justify-center',
                            iconTileClassName()
                        )}
                    >
                        <Fingerprint />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                            id={titleId}
                            className="text-sm font-semibold leading-snug text-foreground [overflow-wrap:anywhere]"
                        >
                            {i18n('mfaList.passkeys')}
                        </span>
                        <span
                            id={descriptionId}
                            className="text-balance text-sm font-normal leading-normal text-muted-foreground"
                        >
                            {`${i18n('mfaList.passkeyCount', { count })} · ${i18n('mfaList.alsoUsedToLogIn')}`}
                        </span>
                    </span>
                    <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                    />
                </button>
            </Item>
        </div>
    );
});
