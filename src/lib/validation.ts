import z from 'zod';

import type { Validation } from '@/lib/form';

export function passwordValidation({
    client,
    config: { passwordPolicy },
    definition,
    i18n,
}: Parameters<Validation<'password'>>[0]) {
    return z
        .string(i18n('validation.required'))
        .min(passwordPolicy.minLength, {
            error: i18n('validation.password.minLength', { min: passwordPolicy.minLength }),
        })
        .max(255, {
            error: i18n('validation.password.maxLength', { max: 255 }),
        })
        .superRefine(async (value, ctx) => {
            if (String(value).length === 0) return;
            if (!definition.withPolicyRules) return;

            if (passwordPolicy.lowercaseCharacters && /[a-z]/.test(value)) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n('validation.password.specials.lowercase'),
                    path: ['password'],
                });
            }

            if (passwordPolicy.uppercaseCharacters && /[A-Z]/.test(value)) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n('validation.password.specials.digit'),
                    path: ['password'],
                });
            }

            if (passwordPolicy.digitCharacters && /\d/.test(value)) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n('validation.password.specials.uppercase'),
                    path: ['password'],
                });
            }

            if (
                passwordPolicy.specialCharacters &&
                new RegExp('[ !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~]').test(value)
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: i18n('validation.password.specials.characters'),
                    path: ['password'],
                });
            }

            try {
                const strength = await client.getPasswordStrength(value);
                if (strength.score < passwordPolicy.minStrength) {
                    ctx.addIssue({
                        code: 'custom',
                        message: i18n('validation.password.minStrength'),
                        path: ['password'],
                    });
                }
            } catch (_e) {
                // ignore error
            }
        });
}
