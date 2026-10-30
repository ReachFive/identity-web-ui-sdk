import React, { ComponentProps, forwardRef, HTMLAttributes, ReactNode } from 'react';

import { Shield } from 'lucide-react';

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
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

/** The outlined box shared by every row of the list and by its empty state. */
export function MfaItem({ className, ...props }: ComponentProps<typeof Item>) {
    return (
        <Item
            variant="outline"
            className={cn('items-start gap-3 rounded px-3.5 py-3', className)}
            {...props}
        />
    );
}

/**
 * One row of the MFA credentials list. Carries the public `widget-mfa-credential` slot.
 */
export function MfaCredentialItem(props: ComponentProps<typeof Item>) {
    return <MfaItem data-slot="widget-mfa-credential" role="listitem" {...props} />;
}

interface MfaCredentialIconProps extends ComponentProps<typeof ItemMedia> {
    tone?: 'success' | 'muted';
}

/**
 * The factor icon on a light tile, in the theme success colour for an active factor.
 */
export function MfaCredentialIcon({
    tone = 'success',
    className,
    ...props
}: MfaCredentialIconProps) {
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

interface MfaCredentialContentProps {
    title: ReactNode;
    descriptions?: ReactNode[];
}

/**
 * The identifier of the factor, then one muted line per description (type, creation date, …).
 */
export function MfaCredentialContent({ title, descriptions = [] }: MfaCredentialContentProps) {
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

/**
 * Shown in place of the list when the user has no second factor. Focusable by script only, to
 * take the focus when the last factor is removed.
 */
export const MfaCredentialsEmpty = forwardRef<HTMLDivElement>(
    function MfaCredentialsEmpty(_props, ref) {
        const i18n = useI18n();

        return (
            <MfaItem asChild tabIndex={-1} className="items-center border-dashed py-4">
                <div ref={ref}>
                    <MfaCredentialIcon tone="muted">
                        <Shield />
                    </MfaCredentialIcon>
                    <MfaCredentialContent title={i18n('mfaList.empty')} />
                </div>
            </MfaItem>
        );
    }
);
