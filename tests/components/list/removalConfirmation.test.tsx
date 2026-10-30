import React from 'react';

import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RemovalConfirmation } from '../../../src/components/list/removalConfirmation';

const onCancel = jest.fn();
const onConfirm = jest.fn();

const renderConfirmation = (pending = false) =>
    render(
        <RemovalConfirmation
            data-slot="widget-device-confirm"
            question="Remove Device a?"
            icon={<svg />}
            cancelLabel="Keep"
            removeLabel="Delete"
            pending={pending}
            onCancel={onCancel}
            onConfirm={onConfirm}
        />
    );

beforeEach(() => {
    jest.resetAllMocks();
});

describe('RemovalConfirmation', () => {
    test('is a group named by its question, with the given labels and public slot', () => {
        renderConfirmation();

        const confirmation = screen.getByRole('group', { name: 'Remove Device a?' });
        expect(confirmation).toHaveAttribute('data-slot', 'widget-device-confirm');
        expect(within(confirmation).getByRole('button', { name: 'Keep' })).toBeInTheDocument();
        expect(within(confirmation).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    test('focus moves to the cancel button when it opens', () => {
        renderConfirmation();

        expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus();
    });

    test('the buttons cancel and confirm', async () => {
        const user = userEvent.setup();
        renderConfirmation();

        await user.click(screen.getByRole('button', { name: 'Keep' }));
        await user.click(screen.getByRole('button', { name: 'Delete' }));

        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('Escape cancels', async () => {
        const user = userEvent.setup();
        renderConfirmation();

        await user.keyboard('{Escape}');

        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    test('while pending, both buttons stay focusable but do nothing, and Escape is ignored', async () => {
        const user = userEvent.setup();
        renderConfirmation(true);

        const cancel = screen.getByRole('button', { name: 'Keep' });
        const remove = screen.getByRole('button', { name: 'Delete' });
        expect(cancel).toHaveAttribute('aria-disabled', 'true');
        expect(remove).toHaveAttribute('aria-disabled', 'true');
        expect(remove).toHaveAttribute('aria-busy', 'true');

        await user.click(cancel);
        await user.click(remove);
        await user.keyboard('{Escape}');

        expect(remove).toHaveFocus();
        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
    });
});
