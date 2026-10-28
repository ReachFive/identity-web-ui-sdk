import React, { ComponentProps, HTMLAttributes, ReactNode } from 'react';

import { Shield } from 'lucide-react';

import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
import { useI18n } from '@/contexts/i18n';
import { cn } from '@/lib/utils';

const rowClassName = 'items-start gap-3 rounded px-3.5 py-3';

/**
 * Makes a row inert. React 18 has no typing for `inert` and only forwards it as a string; an
 * empty string sets it. To revisit with React 19, where `inert` becomes a boolean prop.
 */
export const inertProps = (inert: boolean): HTMLAttributes<HTMLElement> =>
    (inert ? { inert: '' } : {}) as HTMLAttributes<HTMLElement>;

/**
 * One row of the MFA credentials list. Carries the public `widget-mfa-credential` slot.
 */
export function MfaCredentialItem({ className, ...props }: ComponentProps<typeof Item>) {
    return (
        <Item
            data-slot="widget-mfa-credential"
            role="listitem"
            variant="outline"
            className={cn(rowClassName, className)}
            {...props}
        />
    );
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
 * Shown in place of the list when the user has no second factor.
 */
export function MfaCredentialsEmpty() {
    const i18n = useI18n();

    return (
        <Item variant="outline" className={cn(rowClassName, 'items-center border-dashed py-4')}>
            <MfaCredentialIcon tone="muted">
                <Shield />
            </MfaCredentialIcon>
            <MfaCredentialContent title={i18n('mfaList.empty')} />
        </Item>
    );
}
