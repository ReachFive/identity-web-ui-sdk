import { useEffect, useRef, useState, useTransition, type RefObject } from 'react';

/** How the current view was reached: `null` until the user first navigates. */
export type ViewDirection = 'forward' | 'back' | null;

export interface GoToOptions {
    /**
     * The element to focus when the user comes back from the opened view, typically the control
     * that opened it. A ref, not an element: the view is rendered anew on return.
     */
    returnFocus?: RefObject<HTMLElement>;
    /**
     * The element to focus on return when `returnFocus` is gone by then, such as a row removed in
     * the opened view. Nothing is focused if both are gone.
     */
    fallbackFocus?: RefObject<HTMLElement>;
}

export interface RestartOptions {
    /**
     * The element to focus once the initial view is rendered again, since the control that
     * restarted is gone. A ref, not an element, for the same reason as `returnFocus`.
     */
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
    /** The view being opened suspends on its data; the current view stays on screen meanwhile. */
    pending: boolean;
    canGoBack: boolean;
    goTo: (view: V, options?: GoToOptions) => void;
    back: () => void;
    /**
     * Back to the initial view from any depth, in one move. No focus is given back to an opener;
     * `focus` names the element to focus instead.
     */
    restart: (options?: RestartOptions) => void;
}

/**
 * Navigation between the views of a widget, kept in local state: a history to go back through,
 * the direction of the last move (to animate the entering view), and focus given back to the
 * control that opened a view on return.
 *
 * `goTo` runs in a transition: a view that suspends on its data only replaces the current one
 * once loaded, and `pending` is true meanwhile.
 */
export function useViewNavigation<V extends string>(initialView: V): ViewNavigation<V> {
    const [{ history, direction }, setState] = useState<NavigationState<V>>({
        history: [{ view: initialView, returnFocus: [] }],
        direction: null,
    });
    const [pending, startTransition] = useTransition();
    const firstView = useRef(initialView);
    // the first target still rendered takes the focus once the view is committed
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
 * The entering view slides in from the side the user is heading to; the first view shows
 * without animation. Only the entering view animates: animating the leaving one would mean
 * keeping both mounted. Put it on an element keyed by the view.
 */
const VIEW_ANIMATIONS: Record<NonNullable<ViewDirection>, string> = {
    forward: 'animate-view-forward motion-reduce:animate-none',
    back: 'animate-view-back motion-reduce:animate-none',
};

export const viewAnimation = (direction: ViewDirection): string | undefined =>
    direction === null ? undefined : VIEW_ANIMATIONS[direction];
