import React, { useEffect, useRef, type ReactNode } from 'react';

import { ArrowLeft } from 'lucide-react';

import { Heading } from '@/components/miscComponent';
import { Button } from '@/components/ui/button';

interface ViewHeaderProps {
    title: ReactNode;
    backLabel: string;
    onBack: () => void;
    /** Focus the back button on mount, for a view whose opener is gone. Defaults to `true`. */
    autoFocus?: boolean;
}

/** The title of a widget view, under a back arrow to the previous one. */
export function ViewHeader({ title, backLabel, onBack, autoFocus = true }: ViewHeaderProps) {
    const backButton = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (autoFocus) backButton.current?.focus();
    }, [autoFocus]);

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
            <Heading role="heading" aria-level={2} className="mb-0">
                {title}
            </Heading>
        </div>
    );
}
