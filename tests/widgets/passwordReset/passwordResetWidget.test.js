/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import 'jest-styled-components';

import passwordResetWidget from '../../../src/widgets/passwordReset/passwordResetWidget';

const defaultConfig = {
    clientId: 'local',
    domain: 'local.reach5.net',
    sso: false,
    sms: false,
    webAuthn: false,
    language: 'fr',
    pkceEnforced: false,
    isPublic: true,
    socialProviders: ['facebook', 'google'],
    customFields: [],
    resourceBaseUrl: 'http://localhost',
    mfaSmsEnabled: false,
    mfaEmailEnabled: false,
    rbaEnabled: false,
    consentsVersions: {},
    passwordPolicy: {
        minLength: 8,
        minStrength: 2,
        allowUpdateWithAccessTokenOnly: true,
    }
};

describe('Snapshot', () => {
    const generateSnapshot = (options = {}) => () => {
        const tree = passwordResetWidget(options, { config: defaultConfig, apiClient: {} })
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('password-reset', () => {
        test('default', generateSnapshot());
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options = {}) => {
        const result = await passwordResetWidget(options, { config: defaultConfig, apiClient: {} });

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
