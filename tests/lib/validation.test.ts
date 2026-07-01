import type { FieldValues, UseFormWatch } from 'react-hook-form';

import { describe, expect, jest, test } from '@jest/globals';
import type { TFunction } from 'i18next';

import type { Client, PasswordStrengthScore } from '@reachfive/identity-core';

import { passwordValidation } from '@/lib/validation';

import type { FieldDefinition } from '@/lib/form';
import type { Config } from '@/types';

type PasswordPolicyOverrides = Partial<Config['passwordPolicy']>;

function buildArgs(
    options: {
        passwordPolicy?: PasswordPolicyOverrides;
        withPolicyRules?: boolean;
        strengthScore?: PasswordStrengthScore;
    } = {}
) {
    const {
        passwordPolicy = {},
        withPolicyRules = true,
        strengthScore = 4 as PasswordStrengthScore,
    } = options;

    const getPasswordStrength = jest
        .fn<Client['getPasswordStrength']>()
        .mockResolvedValue({ score: strengthScore });

    // @ts-expect-error partial Client
    const client: Client = { getPasswordStrength };

    // @ts-expect-error partial Config
    const config: Config = {
        passwordPolicy: {
            minLength: 8,
            minStrength: 0,
            allowUpdateWithAccessTokenOnly: true,
            ...passwordPolicy,
        },
    };

    // @ts-expect-error partial FieldDefinition
    const definition: FieldDefinition<'password'> = { withPolicyRules };

    const i18n = jest.fn((key: string) => key) as unknown as TFunction;

    const watch = jest.fn() as unknown as UseFormWatch<FieldValues>;

    return { client, config, definition, i18n, watch, getPasswordStrength };
}

async function issuesFor(value: string, args: ReturnType<typeof buildArgs>) {
    const schema = passwordValidation(args);
    const result = await schema.safeParseAsync(value);
    return result.success ? [] : result.error.issues.map(issue => issue.message);
}

describe('passwordValidation', () => {
    test('rejects a password shorter than minLength', async () => {
        const args = buildArgs({ passwordPolicy: { minLength: 8 } });

        const issues = await issuesFor('short', args);

        expect(issues).toContain('validation.password.minLength');
    });

    test('rejects a password longer than 255 characters', async () => {
        const args = buildArgs();

        const issues = await issuesFor('a'.repeat(256), args);

        expect(issues).toContain('validation.password.maxLength');
    });

    test('accepts a password satisfying minLength without extra issues', async () => {
        const args = buildArgs({ passwordPolicy: { minLength: 8, minStrength: 0 } });

        const issues = await issuesFor('anything1', args);

        expect(issues).toEqual([]);
    });

    describe('lowercase character requirement', () => {
        test('flags a password with no lowercase character when the policy requires one', async () => {
            const args = buildArgs({ passwordPolicy: { lowercaseCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('PASSWORD123!', args);

            expect(issues).toContain('validation.password.specials.lowercase');
        });

        test('does not flag a password that contains a lowercase character', async () => {
            const args = buildArgs({ passwordPolicy: { lowercaseCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password123!', args);

            expect(issues).not.toContain('validation.password.specials.lowercase');
        });
    });

    describe('uppercase character requirement', () => {
        test('flags a password with no uppercase character when the policy requires one', async () => {
            const args = buildArgs({ passwordPolicy: { uppercaseCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('password123!', args);

            expect(issues).toContain('validation.password.specials.uppercase');
        });

        test('does not flag a password that contains an uppercase character', async () => {
            const args = buildArgs({ passwordPolicy: { uppercaseCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password123!', args);

            expect(issues).not.toContain('validation.password.specials.uppercase');
        });
    });

    describe('digit character requirement', () => {
        test('flags a password with no digit when the policy requires one', async () => {
            const args = buildArgs({ passwordPolicy: { digitCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password!!!', args);

            expect(issues).toContain('validation.password.specials.digit');
        });

        test('does not flag a password that contains a digit', async () => {
            const args = buildArgs({ passwordPolicy: { digitCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password123!', args);

            expect(issues).not.toContain('validation.password.specials.digit');
        });
    });

    describe('special character requirement', () => {
        test('flags a password with no special character when the policy requires one', async () => {
            const args = buildArgs({ passwordPolicy: { specialCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password123', args);

            expect(issues).toContain('validation.password.specials.characters');
        });

        test('does not flag a password that contains a special character', async () => {
            const args = buildArgs({ passwordPolicy: { specialCharacters: 1, minStrength: 0 } });

            const issues = await issuesFor('Password123!', args);

            expect(issues).not.toContain('validation.password.specials.characters');
        });
    });

    test('accepts a password satisfying every enabled character policy at once', async () => {
        const args = buildArgs({
            passwordPolicy: {
                lowercaseCharacters: 1,
                uppercaseCharacters: 1,
                digitCharacters: 1,
                specialCharacters: 1,
                minStrength: 0,
            },
        });

        const issues = await issuesFor('Wond3rFu11_Pa55w0rD*$', args);

        expect(issues).toEqual([]);
    });

    describe('strength requirement', () => {
        test('flags a password whose strength score is below minStrength', async () => {
            const args = buildArgs({
                passwordPolicy: { minStrength: 3 },
                strengthScore: 1 as PasswordStrengthScore,
            });

            const issues = await issuesFor('somepassword', args);

            expect(issues).toContain('validation.password.minStrength');
        });

        test('does not flag a password whose strength score meets minStrength', async () => {
            const args = buildArgs({
                passwordPolicy: { minStrength: 3 },
                strengthScore: 4 as PasswordStrengthScore,
            });

            const issues = await issuesFor('somepassword', args);

            expect(issues).not.toContain('validation.password.minStrength');
        });

        test('bypasses the strength check when client.getPasswordStrength rejects', async () => {
            const args = buildArgs({ passwordPolicy: { minStrength: 4 } });
            args.getPasswordStrength.mockRejectedValueOnce(new Error('API error'));

            const issues = await issuesFor('somepassword', args);

            expect(issues).toEqual([]);
        });
    });

    test('skips character-policy and strength checks entirely when withPolicyRules is false', async () => {
        const args = buildArgs({
            withPolicyRules: false,
            passwordPolicy: {
                lowercaseCharacters: 1,
                uppercaseCharacters: 1,
                digitCharacters: 1,
                specialCharacters: 1,
                minStrength: 4,
            },
            strengthScore: 0 as PasswordStrengthScore,
        });

        const issues = await issuesFor('nopolicyrules', args);

        expect(issues).toEqual([]);
        expect(args.getPasswordStrength).not.toHaveBeenCalled();
    });

    test('skips policy checks on an empty value, leaving only the minLength issue', async () => {
        const args = buildArgs({
            passwordPolicy: { minLength: 8, lowercaseCharacters: 1, minStrength: 4 },
        });

        const issues = await issuesFor('', args);

        expect(issues).toEqual(['validation.password.minLength']);
        expect(args.getPasswordStrength).not.toHaveBeenCalled();
    });
});
