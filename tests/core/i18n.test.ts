import { describe, expect, it } from '@jest/globals';

import {
    I18nLocalizedMessages,
    resolveI18n,
    type I18nMessages,
    type I18nNestedMessages,
} from '../../src/core/i18n';

describe('i18n', () => {
    it('should resolve default messages', () => {
        const defaultI18n: I18nMessages = {
            'validation.minLength': 'Min length is {min}',
            'validation.maxLength': 'Max length is {max}',
        };

        const i18n = resolveI18n(defaultI18n);

        expect(i18n('validation.minLength', { min: 1 })).toBe('Min length is 1');
        expect(i18n('validation.maxLength', { max: 10 })).toBe('Max length is 10');
        expect(i18n('validation.unknown')).toBe('validation.unknown');
    });

    it('should resolve overridden messages', () => {
        const defaultI18n: I18nMessages = {
            'validation.minLength': 'Min length is {min}',
            'validation.maxLength': 'Max length is {max}',
        };

        const messages: I18nNestedMessages = {
            'validation.minLength': 'La longueur minimale est de {min}',
        };

        const i18n = resolveI18n(defaultI18n, messages);

        expect(i18n('validation.minLength', { min: 1 })).toBe('La longueur minimale est de 1');
        expect(i18n('validation.maxLength', { max: 10 })).toBe('Max length is 10');
        expect(i18n('validation.unknown')).toBe('validation.unknown');
    });

    it('should resolve nested messages', () => {
        const defaultI18n: I18nMessages = {
            'validation.minLength': 'Min length is {min}',
            'validation.maxLength': 'Max length is {max}',
        };

        const messages: I18nNestedMessages = {
            validation: {
                minLength: 'La longueur minimale est de {min}',
            },
            'validation.maxLength': 'La longueur maximale est de {max}',
        };

        const i18n = resolveI18n(defaultI18n, messages);

        expect(i18n('validation.minLength', { min: 1 })).toBe('La longueur minimale est de 1');
        expect(i18n('validation.maxLength', { max: 10 })).toBe('La longueur maximale est de 10');
    });

    it('should resolve messages with fallback', () => {
        const defaultI18n: I18nMessages = {
            'validation.minLength': 'Min length is {min}',
            'validation.maxLength': 'Max length is {max}',
        };

        const messages: I18nNestedMessages = {
            'validation.minLength': 'La longueur minimale est de {min}',
        };

        const i18n = resolveI18n(defaultI18n, messages);

        // fallback should not be used if the message is defined in the messages
        expect(
            i18n(
                'validation.minLength',
                { min: 1 },
                () => 'Length must be at least {min} characters long'
            )
        ).toBe('La longueur minimale est de 1');

        // fallback should not be used if the message is defined in the default messages
        expect(
            i18n(
                'validation.maxLength',
                { min: 1 },
                () => 'Length must be at least {min} characters long'
            )
        ).toBe('Max length is {max}');

        // fallback should be used if the message is not defined in the messages or the default messages
        expect(
            i18n(
                'validation.unknown',
                { maybeParam: 'maybeParam' },
                () => 'Unknown message with a parameter: {maybeParam}'
            )
        ).toBe('Unknown message with a parameter: maybeParam');
    });

    it('should resolve localized messages', () => {
        const defaultI18n: I18nMessages = {
            'validation.minLength': 'Min length is {min}',
            'validation.maxLength': 'Max length is {max}',
        };

        const messages: I18nLocalizedMessages = {
            fr: {
                'validation.minLength': 'La longueur minimale est de {min}',
                validation: {
                    maxLength: 'La longueur maximale est de {max}',
                },
            },
            en: {
                'validation.minLength': 'The minimum length is {min}',
            },
        };

        const i18n = resolveI18n(defaultI18n, messages, 'fr');

        expect(i18n('validation.minLength', { min: 1 })).toBe('La longueur minimale est de 1');
        expect(i18n('validation.maxLength', { max: 10 })).toBe('La longueur maximale est de 10');
        expect(i18n('validation.unknown')).toBe('validation.unknown');
    });
});
