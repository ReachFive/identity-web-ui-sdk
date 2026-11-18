import { useEffect, useRef, useState, useTransition, type RefObject } from 'react';

/** `null` until the user first navigates. */
export type ViewDirection = 'forward' | 'back' | null;

export interface GoToOptions {
    /**
     * Focused when the user comes back from the opened view. A ref, because the view is rendered
     * again on return.
     */
    returnFocus?: RefObject<HTMLElement>;
    /** Focused on return when `returnFocus` is no longer rendered. */
    fallbackFocus?: RefObject<HTMLElement>;
}

export interface RestartOptions {
    /** Focused once the initial view is rendered again. */
    focus?: RefObject<HTMLElement>;
}

type FocusTargets = RefObject<HTMLElement>[];

interface Entry<V extends string> {
    view: V;
    returnFocus: FocusTargets;
}

interface NavigationState<V extends string> {
    history: Entry<V>[];
    direction: ViewDirection;
}

export interface ViewNavigation<V extends string> {
    view: V;
    direction: ViewDirection;
    /** True while the view being opened loads its data. The current view stays on screen. */
    pending: boolean;
    canGoBack: boolean;
    goTo: (view: V, options?: GoToOptions) => void;
    back: () => void;
    /** Goes back to the initial view and clears the history. */
    restart: (options?: RestartOptions) => void;
}

/**
 * Navigation between the views of a widget: a history, the direction of the last move, and focus
 * given back to the opener on return.
 *
 * `goTo` runs in a transition: a view that suspends on its data replaces the current one only
 * once loaded.
 */
export function useViewNavigation<V extends string>(initialView: V): ViewNavigation<V> {
    const [{ history, direction }, setState] = useState<NavigationState<V>>({
        history: [{ view: initialView, returnFocus: [] }],
        direction: null,
    });
    const [pending, startTransition] = useTransition();
    const firstView = useRef(initialView);
    // focused after the next commit: the first target still rendered
    const focusOnReturn = useRef<FocusTargets>([]);
    const current = history[history.length - 1];

    useEffect(() => {
        const targets = focusOnReturn.current;
        focusOnReturn.current = [];
        targets.find(target => target.current)?.current?.focus();
    }, [current]);

    return {
        view: current.view,
        direction,
        pending,
        canGoBack: history.length > 1,
        goTo: (view, { returnFocus, fallbackFocus } = {}) => {
            const targets = [returnFocus, fallbackFocus].filter(
                (target): target is RefObject<HTMLElement> => target !== undefined
            );
            startTransition(() =>
                setState({
                    history: [...history, { view, returnFocus: targets }],
                    direction: 'forward',
                })
            );
        },
        back: () => {
            if (history.length < 2) return;
            focusOnReturn.current = current.returnFocus;
            setState({ history: history.slice(0, -1), direction: 'back' });
        },
        restart: ({ focus } = {}) => {
            focusOnReturn.current = focus ? [focus] : [];
            setState({
                history: [{ view: firstView.current, returnFocus: [] }],
                direction: 'back',
            });
        },
    };
}

/**
 * Only the entering view animates, so the leaving one can unmount at once. Put the class on an
 * element keyed by the view.
 */
const VIEW_ANIMATIONS: Record<NonNullable<ViewDirection>, string> = {
    forward: 'animate-view-forward motion-reduce:animate-none',
    back: 'animate-view-back motion-reduce:animate-none',
};

export const viewAnimation = (direction: ViewDirection): string | undefined =>
    direction === null ? undefined : VIEW_ANIMATIONS[direction];
