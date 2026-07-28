import type { FieldValues, UseFormWatch } from 'react-hook-form';

import { describe, expect, it } from '@jest/globals';
import type { TFunction } from 'i18next';

import type { Client } from '@reachfive/identity-core';

import { getFieldDefinition, type FieldDefinition } from '@/lib/form';

import type { Config, Optional } from '@/types';

type IdentifierDefinition = Partial<FieldDefinition<'identifier'>>;
type LoginTypeAllowed = Partial<Config['loginTypeAllowed']>;

function buildConfig({
    loginTypeAllowed,
    ...overrides
}: Omit<Partial<Config>, 'loginTypeAllowed'> & {
    loginTypeAllowed?: LoginTypeAllowed;
} = {}): Config {
    return {
        loginTypeAllowed: {
            email: true,
            phoneNumber: true,
            customIdentifier: false,
            ...loginTypeAllowed,
        },
        ...overrides,
    } as Config;
}

/** The `identifier` field as the login widgets declare it: `withPhoneNumber`, no explicit country. */
function identifierField(definition: IdentifierDefinition = {}, config: Config = buildConfig()) {
    const field = { key: 'identifier', withPhoneNumber: true, ...definition };
    return getFieldDefinition(field as Optional<FieldDefinition, 'type'>, config, {});
}

/** The validation messages the field raises for `value`, empty when it is accepted. */
async function validate(
    value: string,
    definition: IdentifierDefinition = {},
    config: Config = buildConfig()
) {
    const field = identifierField(definition, config);
    if (!field?.validation) throw new Error('expected a validation function on the identifier');

    const schema = field.validation({
        client: {} as Client,
        config,
        definition: field,
        i18n: ((key: string) => key) as unknown as TFunction,
        watch: (() => undefined) as unknown as UseFormWatch<FieldValues>,
    });
    const result = await schema.safeParseAsync(value);
    return result.success ? [] : result.error.issues.map(issue => issue.message);
}

describe('getFieldDefinition("identifier")', () => {
    it.each<[string, LoginTypeAllowed, IdentifierDefinition, string]>([
        ['falls back to email when only email is allowed', { phoneNumber: false }, {}, 'email'],
        ['falls back to phone when only phoneNumber is allowed', { email: false }, {}, 'phone'],
        ['stays an identifier when both are allowed', {}, {}, 'identifier'],
        [
            'stays an identifier for a WebAuthn login, whatever is allowed',
            { phoneNumber: false },
            { isWebAuthnLogin: true },
            'identifier',
        ],
    ])('%s', (_label, loginTypeAllowed, definition, expected) => {
        expect(identifierField(definition, buildConfig({ loginTypeAllowed }))?.type).toBe(expected);
    });

    describe('phone number validation', () => {
        it.each([
            '+33612345678', // international
            '0612345678', // national, in the resolved default country
            'user@example.com',
            'john.doe+2024@example.com', // its digits must not be read as the number '+2024'
            'jdoe', // a custom identifier is neither an email nor a phone number
            'jdoe2024', // nor is one that contains digits ('+332024')
        ])('accepts %p', async value => {
            await expect(validate(value)).resolves.toEqual([]);
        });

        it.each(['06 12', '12345'])('rejects %p', async value => {
            await expect(validate(value)).resolves.toContain('validation.phone');
        });

        it('does not check anything when withPhoneNumber is false', async () => {
            await expect(validate('12345', { withPhoneNumber: false })).resolves.toEqual([]);
        });
    });

    // no widget passes an explicit `defaultCountry`, so the resolved one is what national numbers
    // are validated against -- and what `IdentifierField` formats the input with
    describe('default country', () => {
        it.each<[string, Partial<Config>, IdentifierDefinition, string]>([
            ['comes from the config locale', { locale: 'US' }, {}, 'US'],
            ['falls back to FR for an unsupported locale', { locale: 'xx' }, {}, 'FR'],
            ['can be overridden by the field', { locale: 'US' }, { defaultCountry: 'BE' }, 'BE'],
        ])('%s', (_label, overrides, definition, expected) => {
            expect(identifierField(definition, buildConfig(overrides))).toHaveProperty(
                'defaultCountry',
                expected
            );
        });

        it('validates a national number against the resolved country', async () => {
            const config = buildConfig({ locale: 'US' });

            await expect(validate('(213) 373-4253', {}, config)).resolves.toEqual([]);
        });
    });
});
