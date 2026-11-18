import { useState } from 'react';

import type { UseMutationResult } from '@tanstack/react-query';

interface UseRowRemovalOptions<T> {
    /** The removal request of one element. */
    removal: UseMutationResult<unknown, unknown, T>;
    /** Called with the row key when its confirmation opens. */
    onOpen?: (key: string) => void;
}

/** The removal flow of a list: one confirmation open at a time, then the removal request. */
export function useRowRemoval<T>({ removal, onOpen }: UseRowRemovalOptions<T>) {
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
            // Closes on both outcomes: on success the row is gone, on error it shows again.
            removal.mutate(element, { onSettled: close });
        },
    };
}
