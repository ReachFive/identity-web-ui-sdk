/**
 * @jest-environment jsdom
 */

import { describe, expect, jest, test } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'
import MfaCredentialsWidget from "../../../src/widgets/mfa/MfaCredentialsWidget";

const defaultConfig = { domain: 'local.reach5.net', mfaEmailEnabled: true, mfaSmsEnabled: true };

describe('Snapshot', () => {
    const generateSnapshot = ({options = {showIntro: true}, config = defaultConfig, credentials }) => async () => {
        const apiClient = {
            listMfaCredentials: jest.fn().mockReturnValueOnce(Promise.resolve({ credentials }))
        }
        
        const widget = await MfaCredentialsWidget(options, {config, apiClient} )

        await waitFor(async () => {
            const { container, rerender } = await render(widget);

            await waitFor(() => expect(apiClient.listMfaCredentials).toHaveBeenCalled())
    
            await rerender(widget)

            expect(container).toMatchSnapshot();
        })
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
        return await waitFor(async () => {
            return render(result);
        })
    };

    describe('mfaCredentials', () => {
        test('no credentials', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, []);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();
            
            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('requireMfaRegistration', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true, requireMfaRegistration: true}, defaultConfig, []);
            // Email intro
            expect(screen.queryByText('mfa.email.explain.required')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('only email credential', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'email', email: 'alice@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' },
            ]);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).not.toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).not.toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).not.toBeInTheDocument();
        });

        test('only sms credential', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
            ]);
            // Email intro
            expect(screen.queryByText('mfa.email.explain')).toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).toBeInTheDocument();
            
            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).not.toBeInTheDocument();

            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).not.toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).not.toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).toBeInTheDocument();
        });

        test('all credentials', async () => {
            await generateComponent({showIntro: true, showRemoveMfaCredentials: true}, defaultConfig, [
                { type: 'sms', phoneNumber: '33612345678', friendlyName: 'identifier', createdAt: '2022-09-21' },
                { type: 'email', email: 'root@reach5.co', friendlyName: 'identifier', createdAt: '2022-09-21' }
            ]);
            // Intro
            expect(screen.queryByText('mfa.email.explain')).not.toBeInTheDocument();

            // Form button email
            expect(screen.queryByText('mfa.register.email')).not.toBeInTheDocument();

            // Sms intro
            expect(screen.queryByText('mfa.phoneNumber.explain')).not.toBeInTheDocument();
            
            // Form button sms
            expect(screen.queryByText('mfa.register.phoneNumber')).not.toBeInTheDocument();

            // Form button remove email
            expect(screen.queryByText('mfa.remove.email')).toBeInTheDocument();

            // Form button remove phone number
            expect(screen.queryByText('mfa.remove.phoneNumber')).toBeInTheDocument();
        });
    });
});
