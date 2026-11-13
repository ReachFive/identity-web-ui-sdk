import React, { ComponentProps, forwardRef, HTMLAttributes, ReactNode } from 'react';

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { cn } from '@/lib/utils';

/**
 * The props of a row while another row shows its removal confirmation: dimmed and inert, so it
 * can be neither read nor reached. React 18 has no typing for `inert` and only forwards it as a
 * string; an empty string sets it. To revisit with React 19, where `inert` becomes a boolean prop.
 */
export const dimmedRowProps = (dimmed: boolean, className?: string): HTMLAttributes<HTMLElement> =>
    ({
        className: cn(className, dimmed && 'opacity-45') || undefined,
        ...(dimmed ? { inert: '' } : {}),
    }) as HTMLAttributes<HTMLElement>;

interface ListItemProps extends ComponentProps<typeof Item> {
    /** The public styling slot of the row, named by the widget (see the data-slot rule). */
    'data-slot': `widget-${string}`;
}

/** The outlined box of one row of a list the user manages (MFA credentials, devices, …). */
export function ListItem({ className, ...props }: ListItemProps) {
    return (
        <Item
            role="listitem"
            variant="outline"
            className={cn('items-start gap-3 rounded px-3.5 py-3', className)}
            {...props}
        />
    );
}

interface ListItemIconProps extends ComponentProps<typeof ItemMedia> {
    tone?: 'success' | 'muted';
}

/** The icon of a row on a light tile, in the theme success colour for an active element. */
export function ListItemIcon({ tone = 'success', className, ...props }: ListItemIconProps) {
    return (
        <ItemMedia
            aria-hidden="true"
            className={cn(
                'size-8 rounded [&_svg]:size-4',
                tone === 'success'
                    ? 'bg-success/10 text-success'
                    : 'bg-muted text-muted-foreground',
                className
            )}
            {...props}
        />
    );
}

interface ListItemContentProps {
    title: ReactNode;
    descriptions?: ReactNode[];
}

/** The name of the element, then one muted line per description (type, creation date, …). */
export function ListItemContent({ title, descriptions = [] }: ListItemContentProps) {
    return (
        <ItemContent className="min-w-0 gap-0.5">
            <ItemTitle className="w-auto font-semibold text-foreground [overflow-wrap:anywhere]">
                {title}
            </ItemTitle>
            {descriptions.map((description, index) => (
                <ItemDescription key={index}>{description}</ItemDescription>
            ))}
        </ItemContent>
    );
}

interface ListEmptyProps {
    icon: ReactNode;
    title: ReactNode;
}

/**
 * Shown in place of an empty list: the box of a row, dashed, but not a list item. Focusable by
 * script only, to take the focus when the last row is removed.
 */
export const ListEmpty = forwardRef<HTMLDivElement, ListEmptyProps>(function ListEmpty(
    { icon, title },
    ref
) {
    return (
        <Item
            asChild
            variant="outline"
            tabIndex={-1}
            className="items-center gap-3 rounded border-dashed px-3.5 py-4"
        >
            <div ref={ref}>
                <ListItemIcon tone="muted">{icon}</ListItemIcon>
                <ListItemContent title={title} />
            </div>
        </Item>
    );
});
