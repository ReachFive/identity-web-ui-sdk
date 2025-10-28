/**
 * @jest-environment jsdom
 */

import { describe, expect, it, jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { I18nProvider, useI18n, withI18n, type WithI18n } from '../../src/contexts/i18n';
import type { I18nMessages, I18nNestedMessages } from '../../src/core/i18n';

// Test component that uses useI18n hook
function TestComponent({
    messageKey,
    params,
}: {
    messageKey: string;
    params?: Record<string, unknown>;
}) {
    const i18n = useI18n();
    return <div data-testid="test-component">{i18n(messageKey, params)}</div>;
}

// Test component for withI18n HOC
function TestComponentWithI18n({
    i18n,
    messageKey,
    params,
}: WithI18n<{ messageKey: string; params?: Record<string, unknown> }>) {
    return <div data-testid="test-component-hoc">{i18n(messageKey, params)}</div>;
}

const WrappedTestComponent = withI18n(TestComponentWithI18n);

describe('I18nProvider', () => {
    const defaultMessages: I18nMessages = {
        'test.message': 'Hello {name}',
        'test.simple': 'Simple message',
        'test.nested': 'Nested message',
    };

    const customMessages: I18nNestedMessages = {
        'test.message': 'Bonjour {name}',
        'test.new': 'New message',
    };

    it('should provide i18n context with default messages only', () => {
        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <TestComponent messageKey="test.message" params={{ name: 'World' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Hello World');
    });

    it('should provide i18n context with custom messages overriding defaults', () => {
        render(
            <I18nProvider defaultMessages={defaultMessages} messages={customMessages}>
                <TestComponent messageKey="test.message" params={{ name: 'Monde' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Bonjour Monde');
    });

    it('should provide i18n context with custom messages only', () => {
        render(
            <I18nProvider messages={customMessages}>
                <TestComponent messageKey="test.new" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('New message');
    });

    it('should provide i18n context with no messages', () => {
        render(
            <I18nProvider>
                <TestComponent messageKey="unknown.key" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('unknown.key');
    });

    it('should handle nested messages correctly', () => {
        const nestedMessages: I18nNestedMessages = {
            validation: {
                minLength: 'La longueur minimale est de {min}',
                maxLength: 'La longueur maximale est de {max}',
            },
        };

        render(
            <I18nProvider messages={nestedMessages}>
                <TestComponent messageKey="validation.minLength" params={{ min: 5 }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent(
            'La longueur minimale est de 5'
        );
    });

    it('should handle complex nested messages', () => {
        const complexMessages: I18nNestedMessages = {
            auth: {
                'login.success': 'Connexion réussie',
                'login.error': 'Erreur de connexion: {error}',
                logout: 'Déconnexion réussie',
            },
        };

        render(
            <I18nProvider messages={complexMessages}>
                <TestComponent
                    messageKey="auth.login.error"
                    params={{ error: 'Invalid credentials' }}
                />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent(
            'Erreur de connexion: Invalid credentials'
        );
    });

    it('should handle localized messages', () => {
        const localizedMessages: I18nNestedMessages = {
            fr: {
                'test.message': 'Bonjour {name}',
            },
            en: {
                'test.message': 'Hello {name}',
            },
        };

        render(
            <I18nProvider messages={localizedMessages} locale="fr">
                <TestComponent messageKey="test.message" params={{ name: 'World' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Bonjour World');
    });
});

describe('useI18n', () => {
    it('should throw error when used outside of I18nProvider', () => {
        // Suppress console.error for this test since we expect an error
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => {
            render(<TestComponent messageKey="test.message" />);
        }).toThrow('No I18nContext provided');

        consoleSpy.mockRestore();
    });

    it('should return i18n resolver when used inside I18nProvider', () => {
        const defaultMessages: I18nMessages = {
            'test.message': 'Hello {name}',
        };

        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <TestComponent messageKey="test.message" params={{ name: 'World' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Hello World');
    });

    it('should handle fallback function', () => {
        const defaultMessages: I18nMessages = {
            'test.known': 'Known message',
        };

        function TestComponentWithFallback() {
            const i18n = useI18n();
            return (
                <div data-testid="test-component">
                    {i18n('test.unknown', undefined, () => 'Fallback message')}
                </div>
            );
        }

        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <TestComponentWithFallback />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Fallback message');
    });
});

describe('withI18n HOC', () => {
    const defaultMessages: I18nMessages = {
        'test.message': 'Hello {name}',
        'test.simple': 'Simple message',
    };

    it('should inject i18n prop into wrapped component', () => {
        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <WrappedTestComponent messageKey="test.message" params={{ name: 'World' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component-hoc')).toHaveTextContent('Hello World');
    });

    it('should pass through all props except i18n', () => {
        function TestComponentWithProps({
            i18n,
            messageKey,
            customProp,
        }: WithI18n<{ messageKey: string; customProp: string }>) {
            return (
                <div data-testid="test-component-props">
                    {i18n(messageKey)} - {customProp}
                </div>
            );
        }

        const WrappedWithProps = withI18n(TestComponentWithProps);

        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <WrappedWithProps messageKey="test.simple" customProp="custom value" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component-props')).toHaveTextContent(
            'Simple message - custom value'
        );
    });

    it('should work with multiple wrapped components', () => {
        function AnotherTestComponent({ i18n, messageKey }: WithI18n<{ messageKey: string }>) {
            return <div data-testid="another-component">{i18n(messageKey)}</div>;
        }

        const WrappedAnother = withI18n(AnotherTestComponent);

        render(
            <I18nProvider defaultMessages={defaultMessages}>
                <WrappedTestComponent messageKey="test.simple" />
                <WrappedAnother messageKey="test.message" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component-hoc')).toHaveTextContent('Simple message');
        expect(screen.getByTestId('another-component')).toHaveTextContent('Hello {name}');
    });
});
