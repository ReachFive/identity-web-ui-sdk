import React from 'react';

import { describe, expect, jest, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ViewHeader } from '@/components/widget/viewHeader';

describe('ViewHeader', () => {
    test('renders only the heading without onBack', () => {
        render(<ViewHeader title="Confirm it is you" />);

        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Confirm it is you');
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(document.body).toHaveFocus();
    });

    test('keeps the back arrow with onBack', async () => {
        const user = userEvent.setup();
        const onBack = jest.fn();
        render(<ViewHeader title="Passkey" backLabel="Back" onBack={onBack} />);

        const back = screen.getByRole('button', { name: 'Back' });
        expect(back).toHaveFocus();

        await user.click(back);

        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
