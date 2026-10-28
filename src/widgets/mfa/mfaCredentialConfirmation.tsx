import React, { KeyboardEvent, ReactNode, useEffect, useId, useRef } from 'react';

import { LoaderCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/i18n';

interface MfaCredentialConfirmationProps {
    /** The question that labels the block, e.g. "Remove +33 6 12 34 56 78?". */
    question: string;
    /** The factor icon, shown on a light tile in the danger colour. */
    icon: ReactNode;
    /** True while the removal request is running: both buttons are disabled and Remove spins. */
    pending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

/**
 * The danger-styled block a row turns into when its trash button is pressed. It is a group
 * labelled by its question, not an alert dialog, since nothing around it is modal. Focus moves to
 * Cancel on open, and Escape cancels. Carries the public `widget-mfa-credential-confirm` slot.
 */
export function MfaCredentialConfirmation({
    question,
    icon,
    pending,
    onCancel,
    onConfirm,
}: MfaCredentialConfirmationProps) {
    const i18n = useI18n();
    const questionId = useId();
    const cancelRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        cancelRef.current?.focus();
    }, []);

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'Escape' || pending) return;
        event.stopPropagation();
        onCancel();
    };

    return (
        <div
            data-slot="widget-mfa-credential-confirm"
            role="group"
            aria-labelledby={questionId}
            onKeyDown={handleKeyDown}
            className="flex w-full flex-col gap-3 rounded border border-destructive/40 bg-destructive/10 px-3.5 pb-3.5 pt-3"
        >
            <div className="flex items-center gap-3">
                <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded bg-background text-destructive [&_svg]:size-4"
                >
                    {icon}
                </span>
                <span
                    id={questionId}
                    className="min-w-0 flex-1 font-semibold text-foreground [overflow-wrap:anywhere]"
                >
                    {question}
                </span>
            </div>
            <div className="flex justify-end gap-2">
                <Button
                    ref={cancelRef}
                    type="button"
                    variant="outline"
                    className="h-8 px-3.5 text-foreground"
                    disabled={pending}
                    onClick={onCancel}
                >
                    {i18n('mfaList.cancel')}
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    className="h-8 px-3.5"
                    disabled={pending}
                    aria-busy={pending}
                    onClick={onConfirm}
                >
                    {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
                    {i18n('mfaList.remove')}
                </Button>
            </div>
        </div>
    );
}
