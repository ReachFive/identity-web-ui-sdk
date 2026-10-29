/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';

import { ErrorText } from '../../src/components/miscComponent';

describe('ErrorText', () => {
    test('is written in the danger color, readable on the widget background', () => {
        // `text-destructive-foreground` is the color of text laid *on* a danger background: on the
        // widget's own background it renders white on white.
        render(<ErrorText>Something went wrong</ErrorText>);
        const classes = screen.getByText('Something went wrong').className.split(/\s+/);

        expect(classes).toContain('text-destructive');
        expect(classes).not.toContain('text-destructive-foreground');
    });
});
