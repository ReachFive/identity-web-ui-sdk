/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import 'jest-styled-components';

import passwordResetWidget from '../../../src/widgets/passwordReset/passwordResetWidget';

describe('Snapshot', () => {
    const getPasswordStrength = jest.fn().mockImplementation((password) => {
        let score = 0
        if (password.match(/[a-z]+/)) score++
        if (password.match(/[0-9]+/)) score++
        if (password.match(/[^a-z0-9]+/)) score++
        if (password.length > 8) score++
        return Promise.resolve({ score })
    })
    
    // @ts-expect-error partial Client
    const apiClient = {
        getPasswordStrength,
    }

    beforeEach(() => {
        getPasswordStrength.mockClear()
    })

    const generateSnapshot = (options = {}) => () => {
        const tree = passwordResetWidget(options, { config: {}, apiClient })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('password-reset', () => {
        test('default', generateSnapshot());
    });
});

describe('DOM testing', () => {

    const getPasswordStrength = jest.fn().mockImplementation((password) => {
        let score = 0
        if (password.match(/[a-z]+/)) score++
        if (password.match(/[0-9]+/)) score++
        if (password.match(/[^a-z0-9]+/)) score++
        if (password.length > 8) score++
        return Promise.resolve({ score })
    })
    
    // @ts-expect-error partial Client
    const apiClient = {
        getPasswordStrength,
    }

    beforeEach(() => {
        getPasswordStrength.mockClear()
    })
    
    const generateComponent = async (options = {}) => {
        const result = await passwordResetWidget(options, { config: {}, apiClient });

        return render(result);
    };

    describe('password-reset', () => {
        test('basic', async () => {
            expect.assertions(3);

            // When
            await generateComponent();

            // Then
            expect(screen.queryByTestId('password')).toBeInTheDocument();
            expect(screen.queryByTestId('password_confirmation')).toBeInTheDocument();
            expect(screen.queryByTestId('submit').textContent).toBe('send');
        });
    });
});
