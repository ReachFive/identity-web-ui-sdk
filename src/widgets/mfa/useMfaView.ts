import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * The views of the MFA list widget. Each maps one-to-one to a future route; two views without
 * parameters do not justify a router.
 */
export type MfaView = 'list' | 'passkeys';

/** How the current view was reached: `null` until the user first navigates. */
export type MfaNavigation = 'forward' | 'back' | null;

export interface MfaViewState {
    view: MfaView;
    navigation: MfaNavigation;
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
    const [{ view, navigation }, setState] = useState<{ view: MfaView; navigation: MfaNavigation }>(
        { view: 'list', navigation: null }
    );
    const passkeysRowRef = useRef<HTMLButtonElement>(null);
    const returningToList = useRef(false);

    useEffect(() => {
        if (view !== 'list' || !returningToList.current) return;
        returningToList.current = false;
        passkeysRowRef.current?.focus();
    }, [view]);

    return {
        view,
        navigation,
        openPasskeys: () => setState({ view: 'passkeys', navigation: 'forward' }),
        backToList: () => {
            returningToList.current = true;
            setState({ view: 'list', navigation: 'back' });
        },
        passkeysRowRef,
    };
}
