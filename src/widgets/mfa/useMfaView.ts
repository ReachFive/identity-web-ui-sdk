import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The views of the MFA list widget. Each maps one-to-one to a future route; two views without
 * parameters do not justify a router.
 */
export type MfaView = 'list' | 'passkeys';

export interface MfaViewState {
    view: MfaView;
    openPasskeys: () => void;
    backToList: () => void;
    /** Attach to the Passkeys row: it gets focus back when the user returns to the list. */
    passkeysRowRef: RefObject<HTMLButtonElement>;
}

/**
 * Local view state of the MFA list widget: the list of factors, or the Passkeys view. Coming
 * back to the list moves focus to the Passkeys row, or nowhere when that row is gone (last
 * passkey removed).
 */
export function useMfaView(): MfaViewState {
    const [view, setView] = useState<MfaView>('list');
    const passkeysRowRef = useRef<HTMLButtonElement>(null);
    const returningToList = useRef(false);

    useEffect(() => {
        if (view !== 'list' || !returningToList.current) return;
        returningToList.current = false;
        passkeysRowRef.current?.focus();
    }, [view]);

    return {
        view,
        openPasskeys: () => setView('passkeys'),
        backToList: () => {
            returningToList.current = true;
            setView('list');
        },
        passkeysRowRef,
    };
}
