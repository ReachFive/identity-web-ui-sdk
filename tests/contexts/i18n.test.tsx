/**
 * @jest-environment jsdom
 */
import React from 'react';

import { describe, expect, it } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { render, screen } from '@testing-library/react';

import { I18nProvider, useI18n } from '../../src/contexts/i18n';

import type { I18nMessages } from '../../src/contexts/i18n';

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

describe('I18nProvider', () => {
    const defaultMessages: I18nMessages = {
        'test.message': 'Hello {name}',
        'test.simple': 'Simple message',
        'test.nested': 'Nested message',
    };

    const customMessages: I18nMessages = {
        'test.message': 'Bonjour {name}',
        'test.new': 'Nouveau message',
    };

    it('should provide i18n context with default messages only', () => {
        render(
            <I18nProvider defaultMessages={defaultMessages} locale="en">
                <TestComponent messageKey="test.message" params={{ name: 'World' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Hello World');
    });

    it('should provide i18n context with custom messages overriding defaults', () => {
        render(
            <I18nProvider defaultMessages={defaultMessages} messages={customMessages} locale="fr">
                <TestComponent messageKey="test.message" params={{ name: 'Monde' }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Bonjour Monde');
    });

    it('should provide i18n context with custom messages only', () => {
        render(
            <I18nProvider messages={customMessages} locale="fr">
                <TestComponent messageKey="test.new" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Nouveau message');
    });

    it('should provide i18n context with no messages', () => {
        render(
            <I18nProvider locale="en">
                <TestComponent messageKey="unknown.key" />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('unknown.key');
    });

    it('should handle nested messages correctly', () => {
        const nestedMessages: I18nMessages = {
            validation: {
                minLength: 'La longueur minimale est de {min}',
                maxLength: 'La longueur maximale est de {max}',
            },
        };

        render(
            <I18nProvider messages={nestedMessages} locale="en">
                <TestComponent messageKey="validation.minLength" params={{ min: 5 }} />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent(
            'La longueur minimale est de 5'
        );
    });

    it('should handle complex nested messages', () => {
        const complexMessages: I18nMessages = {
            auth: {
                'login.success': 'Connexion réussie',
                'login.error': 'Erreur de connexion: {error}',
                logout: 'Déconnexion réussie',
            },
        };

        render(
            <I18nProvider messages={complexMessages} locale="en">
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
        const localizedMessages: I18nMessages = {
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
    it('should return i18n function when used inside I18nProvider', () => {
        const defaultMessages: I18nMessages = {
            'test.message': 'Hello {name}',
        };

        render(
            <I18nProvider defaultMessages={defaultMessages} locale="en">
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
                    {i18n('test.unknown', { defaultValue: 'Fallback message' })}
                </div>
            );
        }

        render(
            <I18nProvider defaultMessages={defaultMessages} locale="en">
                <TestComponentWithFallback />
            </I18nProvider>
        );

        expect(screen.getByTestId('test-component')).toHaveTextContent('Fallback message');
    });
});
