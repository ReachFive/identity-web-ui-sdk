import { useState } from 'react';

import type { UseMutationResult } from '@tanstack/react-query';

interface UseRowRemovalOptions<T> {
    /** The removal request of one element. */
    removal: UseMutationResult<unknown, unknown, T>;
    /** Called with the row key when its confirmation opens. */
    onOpen?: (key: string) => void;
}

/**
 * The removal flow of a list: one confirmation open at a time, then the removal request.
 */
export function useRowRemoval<T>({ removal, onOpen }: UseRowRemovalOptions<T>) {
    /** Key of the row showing its removal confirmation. */
    const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
    const close = () => setConfirmingKey(null);

    return {
        confirmingKey,
        pending: removal.isPending,
        open: (key: string) => {
            onOpen?.(key);
            setConfirmingKey(key);
        },
        cancel: close,
        confirm: (element: T) => {
            if (removal.isPending) return;
            // Settled covers both outcomes: on success the row is already gone from the
            // refetched list, on error it returns to normal with the element kept.
            removal.mutate(element, { onSettled: close });
        },
    };
}
