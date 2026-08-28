/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, test } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';

import { Button } from '../../../src/components/ui/button';

const classesOf = (name: string) => screen.getByRole('button', { name }).className.split(/\s+/);

describe('Button variants', () => {
    test('the filled button carries the seed tokens', () => {
        render(<Button>filled</Button>);
        const classes = classesOf('filled');

        expect(classes).toContain('bg-[var(--r5-button-bg)]');
        expect(classes).toContain('text-[var(--r5-button-text)]');
        expect(classes).toContain('border-[var(--r5-button-border-color)]');
    });

    describe('outline', () => {
        test('takes its label from the fill color, not the border color', () => {
            // Regression guard. Using the border color as the text color only looks right while
            // `button.borderColor` defaults to `primaryColor`; a tenant setting a hairline gray
            // border — the usual reason to touch that option — would get a gray label on white.
            render(<Button variant="outline">outlined</Button>);
            const classes = classesOf('outlined');

            expect(classes).toContain('text-[var(--r5-button-bg)]');
            expect(classes).not.toContain('text-[var(--r5-button-border-color)]');
        });

        test('hovers onto the tint rather than the disabled-field gray', () => {
            // `--muted` is `input.disabledBackground`, so `hover:bg-muted` made outline buttons
            // hover into "disabled field gray" instead of a neutral interactive surface.
            render(<Button variant="outline">outlined</Button>);
            const classes = classesOf('outlined');

            expect(classes).toContain('hover:bg-[var(--r5-button-subtle-bg)]');
            expect(classes).not.toContain('hover:bg-muted');
        });
    });

    describe('ghost', () => {
        test('draws no border', () => {
            // The border width used to sit on the base, so `ghost` inherited a width with no
            // matching color — which resolves to `currentColor` and paints a hairline.
            render(<Button variant="ghost">ghosted</Button>);
            const classes = classesOf('ghosted');

            expect(classes).not.toContain('border-[length:var(--r5-button-border-width)]');
            expect(classes).toContain('bg-transparent');
        });

        test('hovers onto the same surface as outline', () => {
            render(<Button variant="ghost">ghosted</Button>);
            expect(classesOf('ghosted')).toContain('hover:bg-[var(--r5-button-subtle-bg)]');
        });
    });

    test('destructive stays on the palette, independent of the button seed', () => {
        render(<Button variant="destructive">danger</Button>);
        const classes = classesOf('danger');

        expect(classes).toContain('bg-destructive');
        expect(classes).toContain('text-destructive-foreground');
        expect(classes).not.toContain('bg-[var(--r5-button-bg)]');
        expect(classes).not.toContain('border-[length:var(--r5-button-border-width)]');
    });

    test('link is driven by the link theme, not by the primary color', () => {
        render(<Button variant="link">linked</Button>);
        const classes = classesOf('linked');

        expect(classes).toContain('text-[var(--r5-link-text)]');
        expect(classes).toContain('hover:text-[var(--r5-link-hover-text)]');
        expect(classes).not.toContain('text-primary');
    });
});
