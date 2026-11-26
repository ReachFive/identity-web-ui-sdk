import React, { useEffect, useRef } from 'react';

import { Check } from 'lucide-react';

import { Heading } from '@/components/miscComponent';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n';

import type { Enrollment } from '@/widgets/mfa/mfaWidget';

interface ConfirmationViewProps {
    enrollment: Enrollment;
    /**
     * The factors are reloading. The button is `aria-disabled`, not `disabled`: `disabled` would
     * move the focus to the page. A second click is ignored.
     */
    addingAnother: boolean;
    onAddAnother: () => void;
}

const FACTOR_ADDED_TITLES: Record<Enrollment['factor'], string> = {
    passkey: 'mfa.factorAdded.passkey',
    email: 'mfa.factorAdded.email',
    sms: 'mfa.factorAdded.phoneNumber',
};

// No quotes around a passkey name: quote marks depend on the language, so the translations
// add them.
const identifierOf = (enrollment: Enrollment): string =>
    enrollment.factor === 'passkey' ? enrollment.friendlyName : enrollment.identifier;

/**
 * Shown once a factor is enrolled. No back arrow: the factor exists. The heading takes the focus,
 * so keyboard and screen reader users land on it.
 */
export function ConfirmationView({
    enrollment,
    addingAnother,
    onAddAnother,
}: ConfirmationViewProps) {
    const i18n = useI18n();
    const heading = useRef<HTMLDivElement>(null);

    useEffect(() => {
        heading.current?.focus();
    }, []);

    return (
        <div data-slot="widget-mfa-confirmation" className="flex flex-col items-center gap-4">
            <div
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success"
            >
                <Check className="size-6" />
            </div>
            <div className="space-y-2 text-center">
                <Heading
                    ref={heading}
                    role="heading"
                    aria-level={2}
                    tabIndex={-1}
                    className="mb-0 outline-none"
                >
                    {i18n(FACTOR_ADDED_TITLES[enrollment.factor])}
                </Heading>
                <p className="text-muted-foreground">
                    {i18n('mfa.factorAdded.description', { identifier: identifierOf(enrollment) })}
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                aria-disabled={addingAnother || undefined}
                aria-busy={addingAnother}
                onClick={onAddAnother}
            >
                {i18n('mfa.addAnotherFactor')}
            </Button>
        </div>
    );
}
