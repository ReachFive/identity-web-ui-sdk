/**
 * @jest-environment jest-fixed-jsdom
 */
import React from 'react';

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@testing-library/jest-dom/jest-globals';
import { render, screen, waitFor } from '@testing-library/react';
import 'jest-styled-components';
import nock from 'nock';

import {
    Client,
    ErrorResponse,
    type AuthOptions,
    type SessionInfo,
} from '@reachfive/identity-core';

import { ReachfiveProvider } from '@/contexts/reachfive';
import { SessionProvider, useSession, withSsoCheck } from '@/contexts/session';

import { defaultConfig } from '../widgets/renderer';

// Test component that uses useSession hook
function TestConsumer() {
    const session = useSession();

    return (
        <div>
            {session === undefined && <p>Session undefined</p>}
            {session === null && <p>Session null</p>}
            {session && session.isAuthenticated && <p>Session authenticated</p>}
            {session && !session.isAuthenticated && <p>Session not authenticated</p>}
        </div>
    );
}

describe('SessionProvider', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        // Mock window.location.href
        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost' },
            writable: true,
            configurable: true,
        });

        // Mock HTTP requests
        nock(`https://${defaultConfig.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .reply(200, defaultConfig.consentsVersions);

        nock(defaultConfig.resourceBaseUrl)
            .persist()
            .get(/\/[a-z]+\.json$/)
            .reply(200, {});

        // Suppress console.error for expected errors in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        queryClient.clear();
        nock.cleanAll();
        jest.restoreAllMocks();
    });

    test('should return null when sso is disabled and no auth options', async () => {
        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>();
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(checkUrlFragment).not.toHaveBeenCalled();
        expect(getSessionInfo).not.toHaveBeenCalled();
    });

    test('should return null when sso is enabled but auth fragment is present', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(true);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>();
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(checkUrlFragment).toHaveBeenCalledWith('http://localhost');
        expect(getSessionInfo).not.toHaveBeenCalled();
    });

    test('should call loginFromSession when session is authenticated and no re-authentication', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const mockSession: SessionInfo = {
            isAuthenticated: true,
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(mockSession);
        const loginFromSession = jest.fn<Client['loginFromSession']>().mockResolvedValue();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
        expect(loginFromSession).toHaveBeenCalledWith(undefined);
    });

    test('should return null when getSessionInfo returns null (not authenticated)', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(null as never);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
        expect(loginFromSession).not.toHaveBeenCalled();
    });

    test('should return session when auth.prompt is "login" even if authenticated', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const mockSession: SessionInfo = {
            isAuthenticated: true,
        };

        const auth: AuthOptions = {
            prompt: 'login',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(mockSession);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider auth={auth}>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session authenticated')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
        expect(loginFromSession).not.toHaveBeenCalled();
    });

    test('should trigger SSO check when auth.idTokenHint is provided', async () => {
        const auth: AuthOptions = {
            idTokenHint: 'test-token',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(null as never);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider auth={auth}>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
    });

    test('should trigger SSO check when auth.loginHint is provided', async () => {
        const auth: AuthOptions = {
            loginHint: 'user@example.com',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(null as never);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider auth={auth}>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
    });

    test('should call loginFromSession with auth options when provided', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const mockSession: SessionInfo = {
            isAuthenticated: true,
        };

        const auth: AuthOptions = {
            scope: 'openid profile email',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(mockSession);
        const loginFromSession = jest.fn<Client['loginFromSession']>().mockResolvedValue();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider auth={auth}>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(loginFromSession).toHaveBeenCalledWith(auth);
    });

    test('should handle ErrorResponse errors and log message', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const errorResponse: ErrorResponse = {
            error: 'invalid_request',
            errorDescription: 'Invalid session',
            errorUserMsg: 'Session expired',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue(errorResponse);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const consoleSpy = jest.spyOn(console, 'error');

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalledWith('Session expired');
    });

    test('should handle non-ErrorResponse errors and log message', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const error = new Error('Network error');

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockRejectedValue(error);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const consoleSpy = jest.spyOn(console, 'error');

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalledWith(error);
    });
});

describe('useSession', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost' },
            writable: true,
            configurable: true,
        });

        // Mock HTTP requests
        nock(`https://${defaultConfig.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .reply(200, defaultConfig.consentsVersions);

        nock(defaultConfig.resourceBaseUrl)
            .persist()
            .get(/\/[a-z]+\.json$/)
            .reply(200, {});

        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        queryClient.clear();
        nock.cleanAll();
        jest.restoreAllMocks();
    });

    test('should return session value from context', async () => {
        const configWithSso = {
            ...defaultConfig,
            sso: true,
        };

        const mockSession: SessionInfo = {
            isAuthenticated: true,
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(mockSession);
        const loginFromSession = jest.fn<Client['loginFromSession']>().mockResolvedValue();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(configWithSso);
            },
        };

        const config = configWithSso;

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <SessionProvider>
                        <TestConsumer />
                    </SessionProvider>
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Session null')).toBeInTheDocument();
        });
    });
});

describe('withSsoCheck', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost' },
            writable: true,
            configurable: true,
        });

        // Mock HTTP requests
        nock(`https://${defaultConfig.domain}`)
            .persist()
            .get(/\/identity\/v1\/config\/consents/)
            .reply(200, defaultConfig.consentsVersions);

        nock(defaultConfig.resourceBaseUrl)
            .persist()
            .get(/\/[a-z]+\.json$/)
            .reply(200, {});

        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        queryClient.clear();
        nock.cleanAll();
        jest.restoreAllMocks();
    });

    test('should wrap component with SessionProvider', async () => {
        const TestComponent = () => {
            const session = useSession();
            return <div>{session === null ? 'Wrapped' : 'Not wrapped'}</div>;
        };

        TestComponent.displayName = 'TestComponent';

        const WrappedComponent = withSsoCheck(TestComponent);

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>();
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <WrappedComponent />
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Wrapped')).toBeInTheDocument();
        });
    });

    test('should pass auth prop to SessionProvider', async () => {
        const TestComponent = () => {
            const session = useSession();
            return <div>{session === null ? 'Auth passed' : 'Auth not passed'}</div>;
        };

        const WrappedComponent = withSsoCheck(TestComponent);

        const auth: AuthOptions = {
            loginHint: 'user@example.com',
        };

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>().mockResolvedValue(null as never);
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <WrappedComponent auth={auth} />
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Auth passed')).toBeInTheDocument();
        });

        expect(getSessionInfo).toHaveBeenCalled();
    });

    test('should preserve component displayName', () => {
        const TestComponent = () => <div>Test</div>;
        TestComponent.displayName = 'TestComponent';

        const WrappedComponent = withSsoCheck(TestComponent);

        expect(WrappedComponent.displayName).toBe('withSsoCheck(TestComponent)');
    });

    test('should use component name if displayName is not available', () => {
        function TestComponent() {
            return <div>Test</div>;
        }

        const WrappedComponent = withSsoCheck(TestComponent);

        expect(WrappedComponent.displayName).toBe('withSsoCheck(TestComponent)');
    });

    test('should pass through other props to wrapped component', async () => {
        interface TestProps {
            auth?: AuthOptions;
            testProp: string;
        }

        const TestComponent = ({ testProp }: TestProps) => {
            return <div>{testProp}</div>;
        };

        const WrappedComponent = withSsoCheck(TestComponent);

        const checkUrlFragment = jest.fn<Client['checkUrlFragment']>().mockReturnValue(false);
        const getSessionInfo = jest.fn<Client['getSessionInfo']>();
        const loginFromSession = jest.fn<Client['loginFromSession']>();

        const client: Partial<Client> = {
            checkUrlFragment,
            getSessionInfo,
            loginFromSession,
            get remoteSettings() {
                return Promise.resolve(defaultConfig);
            },
        };

        const config = {
            ...defaultConfig,
            sso: false,
        };

        render(
            <QueryClientProvider client={queryClient}>
                <ReachfiveProvider client={client as Client} config={config}>
                    <WrappedComponent testProp="Test Value" />
                </ReachfiveProvider>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.getByText('Test Value')).toBeInTheDocument();
        });
    });
});
