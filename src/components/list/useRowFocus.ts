import { useEffect, useRef, type RefCallback, type RefObject } from 'react';

interface FocusRequest {
    key: string;
    index: number;
}

export interface RowFocus {
    /** Attach to the control of each row, under the row key. */
    controlRef: (key: string) => RefCallback<HTMLElement>;
    /** Attach to the empty state. It takes the focus when the last row is removed. */
    emptyStateRef: RefObject<HTMLDivElement>;
    /**
     * Call when a row opens its removal confirmation. When it closes, focus goes to the row's
     * control if the row is still there, else the next row, else the previous one, else the empty
     * state. Skipped if the user has focused something else.
     */
    watch: (key: string) => void;
}

/**
 * Keeps the focus in the list, never on `<body>`, when a row opens or closes its confirmation or
 * is removed. `rowKeys` lists the rows in display order. A row whose control is not attached with
 * `controlRef` passes it in `fixedControls`.
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

    // Runs after every commit: a row's control is rendered again only once its confirmation closes.
    useEffect(() => {
        if (!request.current) return;
        const { key, index } = request.current;
        const target = rowKeys.includes(key)
            ? controlOf(key)
            : controlOf(rowKeys[Math.min(index, rowKeys.length - 1)]);
        // The browser ignores `focus()` inside an inert subtree. The rows stay inert until the
        // confirmation closes, which can be after the list refetch.
        if (!target || target.closest('[inert]')) return;
        request.current = null;
        // The closed confirmation dropped the focus to <body>. If the focus is elsewhere, the
        // user moved it: leave it there.
        const { activeElement } = target.ownerDocument;
        if (activeElement && activeElement !== target.ownerDocument.body) return;
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
