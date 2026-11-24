import React, { forwardRef, ReactNode, useId } from 'react';

import { ChevronRight, LoaderCircle } from 'lucide-react';

import { dimmedRowProps, ListItem, ListItemIcon } from '@/components/list/listItem';
import { ItemActions, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

interface NavigationRowProps {
    /** Public styling slot, set by the widget. */
    'data-slot': `widget-${string}`;
    icon: ReactNode;
    /** `success` for an enabled element, `muted` for one to add. */
    iconTone?: 'success' | 'muted';
    title: ReactNode;
    /** Shown after the title, inside the button, so it is part of its accessible name. */
    badge?: ReactNode;
    /** Describes the button (`aria-describedby`). */
    description?: ReactNode;
    onOpen: () => void;
    /** Dims the row and makes it inert, while a removal confirmation is open in the list. */
    dimmed?: boolean;
    /** The target view is loading: the row is busy and shows a spinner instead of its chevron. */
    pending?: boolean;
    /** Outlines the row in the primary color, for the option the user should pick. */
    emphasized?: boolean;
}

/**
 * A row that opens another view. The title is a button stretched over the whole row, so a click
 * anywhere opens it. The button cannot wrap the `Item` layout: it only holds phrasing content.
 */
export const NavigationRow = forwardRef<HTMLButtonElement, NavigationRowProps>(
    function NavigationRow(
        {
            'data-slot': dataSlot,
            icon,
            iconTone = 'success',
            title,
            badge,
            description,
            onOpen,
            dimmed = false,
            pending = false,
            emphasized = false,
        },
        ref
    ) {
        const descriptionId = useId();

        return (
            <ListItem
                data-slot={dataSlot}
                {...dimmedRowProps(
                    dimmed,
                    cn(
                        'relative items-center has-[button:hover]:bg-button-subtle-bg has-[button:focus-visible]:border-ring has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50',
                        emphasized && 'border-primary'
                    )
                )}
            >
                <ListItemIcon
                    tone={iconTone}
                    className="group-has-[[data-slot=item-description]]/item:translate-y-0 group-has-[[data-slot=item-description]]/item:self-center"
                >
                    {icon}
                </ListItemIcon>
                <ItemContent className="min-w-0 gap-0.5">
                    <ItemTitle className="w-auto font-semibold text-foreground [overflow-wrap:anywhere]">
                        <button
                            ref={ref}
                            type="button"
                            className="text-left outline-none after:absolute after:inset-0 after:rounded"
                            aria-describedby={description ? descriptionId : undefined}
                            aria-busy={pending || undefined}
                            onClick={pending ? undefined : onOpen}
                        >
                            {title}
                            {badge ? <> {badge}</> : null}
                        </button>
                    </ItemTitle>
                    {description ? (
                        <ItemDescription id={descriptionId}>{description}</ItemDescription>
                    ) : null}
                </ItemContent>
                <ItemActions aria-hidden="true" className="text-muted-foreground [&_svg]:size-4">
                    {pending ? <LoaderCircle className="animate-spin" /> : <ChevronRight />}
                </ItemActions>
            </ListItem>
        );
    }
);
