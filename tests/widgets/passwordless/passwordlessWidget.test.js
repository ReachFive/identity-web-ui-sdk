/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'
import 'jest-styled-components';

import passwordlessWidget from '../../../src/widgets/passwordless/passwordlessWidget'

const defaultConfig = { domain: 'local.reach5.net' };

describe('Snapshot', () => {
    const generateSnapshot = (options = {}, config = defaultConfig) => async () => {
        const widget = await passwordlessWidget(options, { config, apiClient: {} })

        await waitFor(async () => {
            const { container } = await render(widget);
            expect(container).toMatchSnapshot();
        })
    };

    describe('passwordless', () => {
        test('default', generateSnapshot());

        test('no intro', generateSnapshot({ showIntro: false }));

        test('sms', generateSnapshot({ authType: "sms" }));
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options = {}, config = defaultConfig) => {
        const result = await passwordlessWidget(options, { config, apiClient: {} });

        return waitFor(async () => render(result))
    };

    describe('passwordless', () => {
        test('default', async () => {
            expect.assertions(4);
            await generateComponent({})

            // Intro
            expect(screen.queryByText('passwordless.intro')).toBeInTheDocument();

            // Label
            expect(screen.queryByLabelText('email')).toBeInTheDocument();

            // Input email
            expect(screen.queryByTestId('email')).toBeInTheDocument();

            // Form button
            expect(screen.queryByTestId('submit').textContent).toBe('send');
        });

        test('no intro', async () => {
            expect.assertions(2);
            await generateComponent({ showIntro: false });

            // Intro
            expect(screen.queryByText('passwordless.intro')).not.toBeInTheDocument();
            expect(screen.queryByText('passwordless.sms.intro')).not.toBeInTheDocument();
        });

        test('by phone number', async () => {
            expect.assertions(4);
            await generateComponent({ authType: "sms" });

            // Intro
            expect(screen.queryByText('passwordless.sms.intro')).toBeInTheDocument();

            // Label
            expect(screen.queryByLabelText('phoneNumber')).toBeInTheDocument();

            // Input phone number
            expect(screen.queryByTestId('phone_number')).toBeInTheDocument();

            // Form button
            expect(screen.queryByTestId('submit').textContent).toBe('send');
        });
    });
});
