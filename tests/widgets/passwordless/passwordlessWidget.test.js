/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import passwordlessWidget from '../../../src/widgets/passwordless/passwordlessWidget';

const defaultConfig = { domain: 'local.reach5.net' };

describe('Snapshot', () => {
    const generateSnapshot = (options = {}, config = defaultConfig) => async () => {
        const result = await passwordlessWidget(options, { config, apiClient: {} });
        const tree = renderer.create(result).toJSON();
        expect(tree).toMatchSnapshot();
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
        return render(result);
    };

    describe('passwordless', () => {
        test('default', async () => {
            expect.assertions(4);
            await generateComponent({});

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
            const phoneNumberInput = screen.queryByTestId('phone_number');
            console.log(phoneNumberInput);
            expect(phoneNumberInput).toBeInTheDocument();

            // Form button
            expect(screen.queryByTestId('submit').textContent).toBe('send');
        });
    });
});
