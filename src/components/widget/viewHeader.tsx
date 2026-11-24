import React, { useEffect, useRef, type ReactNode } from 'react';

import { ArrowLeft } from 'lucide-react';

import { Heading } from '@/components/miscComponent';
import { Button } from '@/components/ui/button';

type ViewHeaderProps = {
    title: ReactNode;
    /** The id of the heading, for an element it labels. */
    id?: string;
    /** Focuses the back button on mount. Defaults to `true`. No effect without `onBack`. */
    autoFocus?: boolean;
} & ({ backLabel: string; onBack: () => void } | { backLabel?: undefined; onBack?: undefined });

/** The title of a widget view, with a back arrow to the previous one when `onBack` is given. */
export function ViewHeader({ title, id, backLabel, onBack, autoFocus = true }: ViewHeaderProps) {
    const backButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (autoFocus) backButton.current?.focus();
    }, [autoFocus]);

    if (!onBack) {
        return (
            <Heading id={id} role="heading" aria-level={2} className="mb-0">
                {title}
            </Heading>
        );
    }

    return (
        <div className="grid grid-cols-[2rem_1fr_2rem] items-center">
            <Button
                ref={backButton}
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={backLabel}
                onClick={onBack}
            >
                <ArrowLeft aria-hidden="true" />
            </Button>
            <Heading id={id} role="heading" aria-level={2} className="mb-0">
                {title}
            </Heading>
        </div>
    );
}
