/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import renderer from 'react-test-renderer';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
import MfaCredentialsWidget from "../../../src/widgets/mfa/MfaCredentialsWidget";

const defaultConfig = { domain: 'local.reach5.net', mfaEmailEnabled: true, mfaSmsEnabled: true };

describe('Snapshot', () => {
    const generateSnapshot = ({options = {showIntro: true}, config = defaultConfig, credentials }) => () => {
        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        }
        const tree = MfaCredentialsWidget(options, {config, apiClient} )
            .then(result => renderer.create(result).toJSON());

        expect(tree).resolves.toMatchSnapshot();
    };

    describe('mfaCredentials', () => {
        test('default', generateSnapshot({ credentials: []}));

        test('no intro', generateSnapshot({ options: {showIntro: false}, credentials: [
            { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
            { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
        ]}));
    });
});

describe('DOM testing', () => {
    const generateComponent = async (options = {}, config = defaultConfig, credentials) => {

        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        }
        const result = await MfaCredentialsWidget(options, { config, apiClient });

        return render(result);
    };

    describe('mfaCredentials', () => {
        test('default', async () => {
            await generateComponent(
                { showIntro: true, showRemoveMfaCredentials: true },
                defaultConfig,
                [
                    { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
                    { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
                ]
            );
            
            // Intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();

            // // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument();

            // // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).toBeInTheDocument();
        });
    });
});
