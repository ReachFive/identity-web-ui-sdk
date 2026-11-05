import { useEffect, useRef, type RefCallback, type RefObject } from 'react';

interface FocusRequest {
    key: string;
    index: number;
}

export interface RowFocus {
    /** Attach to the control of a row (its trash button) under that row's key. */
    controlRef: (key: string) => RefCallback<HTMLElement>;
    /** Attach to the empty state, which takes the focus when the last row is removed. */
    emptyStateRef: RefObject<HTMLDivElement>;
    /**
     * Call when a row opens its removal confirmation. Once the confirmation closes, focus goes
     * back to the row's control if the row is still there (cancelled or failed removal), or to
     * the row that took its place, else the previous one, else the empty state.
     */
    watch: (key: string) => void;
}

/**
 * Keeps the focus in the list when a row turns into a confirmation and back, or disappears:
 * never on `<body>`. `rowKeys` lists the rows in display order. A row whose control is not
 * attached through `controlRef` (one without a trash button) passes it in `fixedControls`.
 */
export function useRowFocus(
    rowKeys: string[],
    fixedControls: Readonly<Record<string, RefObject<HTMLElement>>> = {}
): RowFocus {
    const controls = useRef(new Map<string, HTMLElement>());
    const emptyStateRef = useRef<HTMLDivElement>(null);
    const request = useRef<FocusRequest | null>(null);

    const controlOf = (key: string | undefined) => {
        if (key === undefined) return emptyStateRef.current;
        return fixedControls[key]?.current ?? controls.current.get(key) ?? null;
    };

    // After every commit: a row's control only comes back once its confirmation has closed.
    useEffect(() => {
        if (!request.current) return;
        const { key, index } = request.current;
        const target = rowKeys.includes(key)
            ? controlOf(key)
            : controlOf(rowKeys[Math.min(index, rowKeys.length - 1)]);
        if (!target) return;
        request.current = null;
        target.focus();
    });

    return {
        controlRef: key => element => {
            if (element) controls.current.set(key, element);
            else controls.current.delete(key);
        },
        emptyStateRef,
        watch: key => {
            request.current = { key, index: rowKeys.indexOf(key) };
        },
    };
}
