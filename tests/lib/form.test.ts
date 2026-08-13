import type { FieldValues, UseFormWatch } from 'react-hook-form';

import { describe, expect, it } from '@jest/globals';
import type { TFunction } from 'i18next';

import type { Client } from '@reachfive/identity-core';

import { getFieldDefinition, resolveErrorFieldPath, type FieldDefinition } from '@/lib/form';

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

/**
 * The `identifier` field as the widgets declare it: no explicit `withPhoneNumber` (it defaults from
 * `loginTypeAllowed.phoneNumber`) and no explicit country.
 */
function identifierField(definition: IdentifierDefinition = {}, config: Config = buildConfig()) {
    const field = { key: 'identifier', ...definition };
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
            'stays an identifier when neither is allowed',
            { email: false, phoneNumber: false, customIdentifier: true },
            {},
            'identifier',
        ],
        // `loginTypeAllowed` is tenant configuration: nothing on the field definition may opt out
        // of it, so the deprecated `isWebAuthnLogin` escape hatch is ignored
        [
            'ignores the deprecated isWebAuthnLogin escape hatch',
            { phoneNumber: false },
            { isWebAuthnLogin: true },
            'email',
        ],
    ])('%s', (_label, loginTypeAllowed, definition, expected) => {
        expect(identifierField(definition, buildConfig({ loginTypeAllowed }))?.type).toBe(expected);
    });

    // when neither email nor phone is an allowed login type the field stays generic (there is no
    // single shape to narrow to), so the validation itself must refuse the forbidden shapes —
    // otherwise `specializeIdentifier` still submits them as `{ email }` / `{ phoneNumber }`
    describe('a shape the tenant forbids is rejected', () => {
        const customOnly: LoginTypeAllowed = {
            email: false,
            phoneNumber: false,
            customIdentifier: true,
        };

        it.each(['user@example.com', '+33612345678', '0612345678'])(
            'rejects %p when only a custom identifier is allowed',
            async value => {
                const config = buildConfig({ loginTypeAllowed: customOnly });

                await expect(validate(value, {}, config)).resolves.toContain(
                    'validation.identifier'
                );
            }
        );

        it('still accepts a custom identifier', async () => {
            const config = buildConfig({ loginTypeAllowed: customOnly });

            await expect(validate('jdoe2024', {}, config)).resolves.toEqual([]);
        });
    });

    it.each([
        '+33612345678', // international phone number
        '0612345678', // national phone number, in the resolved default country
        'user@example.com',
        'john.doe+2024@example.com', // a plus-addressed email is not the number '+2024'
    ])('accepts %p', async value => {
        await expect(validate(value)).resolves.toEqual([]);
    });

    // a value matching neither an email nor a phone number is a custom identifier, and is held to
    // `loginTypeAllowed.customIdentifier` exactly as the other two shapes are held to their own
    // login type — the field must not submit a shape the tenant forbids
    describe('a custom identifier is held to loginTypeAllowed.customIdentifier', () => {
        const customAllowed = buildConfig({ loginTypeAllowed: { customIdentifier: true } });

        it.each([
            'jdoe', // a custom identifier is neither an email nor a phone number
            'jdoe2024', // nor is one that contains digits ('+332024')
        ])('accepts %p when the tenant allows that login type', async value => {
            await expect(validate(value, {}, customAllowed)).resolves.toEqual([]);
        });

        // `buildConfig` forbids the login type by default
        it.each(['jdoe', 'jdoe2024'])(
            'rejects %p when the tenant forbids that login type',
            async value => {
                await expect(validate(value)).resolves.toContain('validation.identifier');
            }
        );
    });

    // a widget which has no flow to serve a custom identifier (passwordless only starts an email or
    // an sms one, WebAuthn enrolls no credential against one) opts out, so the field refuses that
    // shape up front instead of accepting a value its handler then rejects with nothing on the field
    describe('allowCustomIdentifier: false', () => {
        const withoutCustom: IdentifierDefinition = { allowCustomIdentifier: false };
        // the tenant allows the login type: the refusal must come from the option alone
        const customAllowed = buildConfig({ loginTypeAllowed: { customIdentifier: true } });

        it.each(['jdoe', 'jdoe2024'])('rejects the custom identifier %p', async value => {
            await expect(validate(value, withoutCustom, customAllowed)).resolves.toContain(
                'validation.identifier'
            );
        });

        it.each(['user@example.com', '+33612345678', '0612345678'])(
            'still accepts %p',
            async value => {
                await expect(validate(value, withoutCustom, customAllowed)).resolves.toEqual([]);
            }
        );

        // a malformed email or phone number is still reported as such: its own message describes
        // what is wrong with the value, where the generic one would not
        it.each<[string, string]>([
            ['foo@bar', 'validation.email'],
            ['06 12', 'validation.phone'],
        ])('reports %p as %s', async (value, message) => {
            await expect(validate(value, withoutCustom, customAllowed)).resolves.toContain(message);
        });
    });

    // `loginTypeAllowed` is tenant configuration and is authoritative: the option may only narrow
    // what it allows, never opt back into a login type the tenant forbids
    it('allowCustomIdentifier: true does not opt back into a forbidden login type', async () => {
        await expect(validate('jdoe2024', { allowCustomIdentifier: true })).resolves.toContain(
            'validation.identifier'
        );
    });

    describe('phone number validation', () => {
        it.each(['06 12', '12345'])('rejects %p', async value => {
            await expect(validate(value)).resolves.toContain('validation.phone');
        });

        // `withPhoneNumber` only drives the as-you-type formatting; which shapes are accepted comes
        // from `loginTypeAllowed` alone, so switching it off must not bypass the format check
        it('is not bypassed by withPhoneNumber: false', async () => {
            await expect(validate('06 12', { withPhoneNumber: false })).resolves.toContain(
                'validation.phone'
            );
        });

        // no widget passes the flag: it must default from the config, otherwise the input is
        // formatted differently from the way the validation reads it
        describe('withPhoneNumber defaults from loginTypeAllowed.phoneNumber', () => {
            it.each<[LoginTypeAllowed, boolean]>([
                [{ email: true, phoneNumber: true }, true],
                [{ email: false, phoneNumber: false, customIdentifier: true }, false],
            ])('is %p -> %p on the returned definition', (loginTypeAllowed, expected) => {
                expect(identifierField({}, buildConfig({ loginTypeAllowed }))).toHaveProperty(
                    'withPhoneNumber',
                    expected
                );
            });

            it('validates a phone number when phone login is allowed', async () => {
                await expect(validate('06 12')).resolves.toContain('validation.phone');
            });
        });
    });

    describe('email validation', () => {
        // any value holding an `@` is meant to be an email: neither a phone number nor a custom
        // identifier contains one
        it.each(['user@', '@example.com', 'foo@bar', 'user name@example.com'])(
            'rejects %p',
            async value => {
                await expect(validate(value)).resolves.toContain('validation.email');
            }
        );

        it('is not skipped when withPhoneNumber is false', async () => {
            await expect(validate('foo@bar', { withPhoneNumber: false })).resolves.toContain(
                'validation.email'
            );
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

describe('resolveErrorFieldPath', () => {
    const field = (key: string) => ({ key, type: 'string' }) as FieldDefinition;
    const identifier = () => {
        const definition = identifierField();
        if (!definition) throw new Error('expected an identifier definition');
        return definition;
    };

    it('resolves a field to its own path', () => {
        expect(resolveErrorFieldPath('email', [field('email')])).toEqual({
            path: 'email',
            aliased: false,
        });
    });

    it('resolves a payload path to the field it points at', () => {
        expect(resolveErrorFieldPath('profile.phone_number', [field('phoneNumber')])).toEqual({
            path: 'phoneNumber',
            aliased: false,
        });
    });

    // the `identifier` field is submitted as the shape it resolves to, so the API names its errors
    // after that shape
    it.each(['email', 'phone_number', 'custom_identifier'])(
        'resolves the payload key %s to the identifier field which stands for it',
        errorField => {
            expect(resolveErrorFieldPath(errorField, [identifier()])).toEqual({
                path: 'identifier',
                aliased: true,
            });
        }
    );

    it('resolves a wrapped payload key to the field which stands for it', () => {
        expect(resolveErrorFieldPath('data.phone_number', [identifier()])).toEqual({
            path: 'identifier',
            aliased: true,
        });
    });

    // an error naming a displayed field belongs to it, not to a field which merely stands for the key
    it('prefers a displayed field over a field which stands for the payload key', () => {
        expect(resolveErrorFieldPath('email', [identifier(), field('email')])).toEqual({
            path: 'email',
            aliased: false,
        });
    });

    it('resolves nothing when the error refers to no displayed field', () => {
        expect(resolveErrorFieldPath('phone_number', [field('email')])).toBeUndefined();
    });
});
