import React, { useEffect, useRef, type ReactNode } from 'react';

import { ArrowLeft } from 'lucide-react';

import { Heading } from '@/components/miscComponent';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ViewHeaderProps = {
    title: ReactNode;
    /** Focuses the back button on mount. Defaults to `true`. */
    autoFocus?: boolean;
} & ({ backLabel: string; onBack: () => void } | { backLabel?: undefined; onBack?: undefined });

/** The title of a widget view, with a back arrow to the previous one when `onBack` is given. */
export function ViewHeader({ title, backLabel, onBack, autoFocus = true }: ViewHeaderProps) {
    const backButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (autoFocus) backButton.current?.focus();
    }, [autoFocus]);

    return (
        <div className="grid grid-cols-[2rem_1fr_2rem] items-center">
            {onBack && (
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
            )}
            <Heading role="heading" aria-level={2} className={cn('mb-0', !onBack && 'col-start-2')}>
                {title}
            </Heading>
        </div>
    );
}
