import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NavigationRow } from '../../../src/components/list/navigationRow';

const onOpen = jest.fn();

const renderRow = (props: Partial<React.ComponentProps<typeof NavigationRow>> = {}) =>
    render(
        <div role="list">
            <NavigationRow
                data-slot="widget-test-row"
                icon={<svg data-testid="icon" />}
                title="Passkey"
                onOpen={onOpen}
                {...props}
            />
        </div>
    );

beforeEach(() => {
    jest.resetAllMocks();
});

describe('NavigationRow', () => {
    test('opens on click anywhere on the row', async () => {
        const user = userEvent.setup();
        renderRow();

        await user.click(screen.getByRole('button', { name: 'Passkey' }));

        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    test('is described by its description', () => {
        renderRow({ description: '2 passkeys · also used to log in' });

        expect(screen.getByRole('button', { name: 'Passkey' })).toHaveAccessibleDescription(
            '2 passkeys · also used to log in'
        );
    });

    test('shows the badge inside the accessible name', () => {
        renderRow({ badge: <span>Recommended</span> });

        expect(screen.getByRole('button', { name: 'Passkey Recommended' })).toBeInTheDocument();
    });

    test('is busy and inert while pending', async () => {
        const user = userEvent.setup();
        renderRow({ pending: true });

        const button = screen.getByRole('button', { name: 'Passkey' });
        expect(button).toHaveAttribute('aria-busy', 'true');

        await user.click(button);

        expect(onOpen).not.toHaveBeenCalled();
    });

    test('muted tone uses bg-muted', () => {
        renderRow({ iconTone: 'muted' });

        // The icon tile is aria-hidden and has no role: its class can only be read from the icon's parent.
        // eslint-disable-next-line testing-library/no-node-access
        expect(screen.getByTestId('icon').parentElement).toHaveClass('bg-muted');
    });
});
