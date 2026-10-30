import React, { useRef } from 'react';

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useViewNavigation, viewAnimation } from '../../../src/components/widget/useViewNavigation';

type View = 'list' | 'detail' | 'edit';

describe('useViewNavigation', () => {
    test('starts on the initial view, with no direction', () => {
        const { result } = renderHook(() => useViewNavigation<View>('list'));

        expect(result.current.view).toBe('list');
        expect(result.current.direction).toBeNull();
        expect(result.current.canGoBack).toBe(false);
    });

    test('goTo moves forward and back returns to the previous view', () => {
        const { result } = renderHook(() => useViewNavigation<View>('list'));

        act(() => result.current.goTo('detail'));
        expect(result.current.view).toBe('detail');
        expect(result.current.direction).toBe('forward');
        expect(result.current.canGoBack).toBe(true);

        act(() => result.current.goTo('edit'));
        act(() => result.current.back());
        expect(result.current.view).toBe('detail');
        expect(result.current.direction).toBe('back');

        act(() => result.current.back());
        expect(result.current.view).toBe('list');
        expect(result.current.canGoBack).toBe(false);
    });

    test('back on the initial view does nothing', () => {
        const { result } = renderHook(() => useViewNavigation<View>('list'));

        act(() => result.current.back());

        expect(result.current.view).toBe('list');
        expect(result.current.direction).toBeNull();
    });

    function Views({ removeOpener = false }: { removeOpener?: boolean }) {
        const { view, goTo, back } = useViewNavigation<View>('list');
        const openerRef = useRef<HTMLButtonElement>(null);

        // Keyed by view, like a widget's views: nothing is reused from one view to the next.
        return view === 'list' ? (
            <div key="list">
                <button type="button">First</button>
                {!removeOpener && (
                    <button
                        ref={openerRef}
                        type="button"
                        onClick={() => goTo('detail', { returnFocus: openerRef })}
                    >
                        Open
                    </button>
                )}
            </div>
        ) : (
            <div key="detail">
                <button type="button" onClick={back}>
                    Back
                </button>
            </div>
        );
    }

    test('back gives focus to the element given as returnFocus, once rendered again', async () => {
        const user = userEvent.setup();
        render(<Views />);

        await user.click(screen.getByRole('button', { name: 'Open' }));
        await user.click(screen.getByRole('button', { name: 'Back' }));

        expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
    });

    test('back leaves the focus alone when that element is gone', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<Views />);

        await user.click(screen.getByRole('button', { name: 'Open' }));
        rerender(<Views removeOpener />);
        await user.click(screen.getByRole('button', { name: 'Back' }));

        expect(screen.getByRole('button', { name: 'First' })).not.toHaveFocus();
    });
});

describe('viewAnimation', () => {
    test('the entering view slides in from the side the user is heading to', () => {
        expect(viewAnimation('forward')).toContain('animate-view-forward');
        expect(viewAnimation('back')).toContain('animate-view-back');
    });

    test('the first view shows without animation', () => {
        expect(viewAnimation(null)).toBeUndefined();
    });
});
