import React, { useRef } from 'react';

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useRowFocus } from '../../../src/components/list/useRowFocus';

/**
 * A list whose rows have a remove button, except the `fixed` row, which has a control of its own
 * passed through `fixedControls`. Pressing a remove button only asks to watch the row: the test
 * then renders the list as it is once the removal settled.
 */
function Rows({ keys, fixed }: { keys: string[]; fixed?: string }) {
    const fixedRef = useRef<HTMLButtonElement>(null);
    const focus = useRowFocus(keys, fixed ? { [fixed]: fixedRef } : {});

    if (keys.length === 0) {
        return (
            <div ref={focus.emptyStateRef} tabIndex={-1}>
                Empty
            </div>
        );
    }

    return (
        <ul>
            {keys.map(key => (
                <li key={key}>
                    {key === fixed ? (
                        <button ref={fixedRef} type="button">
                            Open {key}
                        </button>
                    ) : (
                        <button
                            ref={focus.controlRef(key)}
                            type="button"
                            onClick={() => focus.watch(key)}
                        >
                            Remove {key}
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}

/** Presses the remove button of `key`, then moves the focus away, as a confirmation would. */
const watch = async (key: string) => {
    await userEvent.setup().click(screen.getByRole('button', { name: `Remove ${key}` }));
    act(() => (document.activeElement as HTMLElement).blur());
};

describe('useRowFocus', () => {
    test('a row still there after its confirmation gets the focus back', async () => {
        const { rerender } = render(<Rows keys={['a', 'b']} />);

        await watch('a');
        rerender(<Rows keys={['a', 'b']} />);

        expect(screen.getByRole('button', { name: 'Remove a' })).toHaveFocus();
    });

    test('a removed row hands the focus to the row that took its place', async () => {
        const { rerender } = render(<Rows keys={['a', 'b', 'c']} />);

        await watch('a');
        rerender(<Rows keys={['b', 'c']} />);

        expect(screen.getByRole('button', { name: 'Remove b' })).toHaveFocus();
    });

    test('a removed last row hands the focus to the previous one', async () => {
        const { rerender } = render(<Rows keys={['a', 'b', 'c']} />);

        await watch('c');
        rerender(<Rows keys={['a', 'b']} />);

        expect(screen.getByRole('button', { name: 'Remove b' })).toHaveFocus();
    });

    test('the focus can go to a row whose control is passed in fixedControls', async () => {
        const { rerender } = render(<Rows keys={['a', 'passkeys']} fixed="passkeys" />);

        await watch('a');
        rerender(<Rows keys={['passkeys']} fixed="passkeys" />);

        expect(screen.getByRole('button', { name: 'Open passkeys' })).toHaveFocus();
    });

    test('removing the only row hands the focus to the empty state', async () => {
        const { rerender } = render(<Rows keys={['a']} />);

        await watch('a');
        rerender(<Rows keys={[]} />);

        expect(screen.getByText('Empty')).toHaveFocus();
    });

    test('nothing takes the focus while no row is watched', () => {
        const { rerender } = render(<Rows keys={['a', 'b']} />);

        rerender(<Rows keys={['b']} />);

        expect(document.body).toHaveFocus();
    });
});
