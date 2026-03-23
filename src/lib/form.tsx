import React from 'react';
import { FieldValues, UseFormWatch } from 'react-hook-form';

import { TFunction } from 'i18next';
import { CountryCode } from 'libphonenumber-js';
import z from 'zod';

import { Client, UserConsent } from '@reachfive/identity-core';

import { MarkdownContent } from '@/components/miscComponent';
import { camelCasePath, snakeCasePath } from '@/helpers/transformObjectProperties';
import { Optional, type Config } from '@/types';

type FieldType =
    | 'checkbox'
    | 'date'
    | 'decimal'
    | 'email'
    | 'hidden'
    | 'identifier'
    | 'integer'
    | 'number'
    | 'object'
    | 'password'
    | 'phone'
    | 'radio-group'
    | 'select'
    | 'string'
    | 'tags';

type Transformer = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: (value?: any) => Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output: (...event: any[]) => unknown;
};

// Bivariance hack: using a method signature instead of a function property makes TypeScript
// treat the parameter types bivariantly, so Validation<'password'> is assignable to Validation<FieldType>.
type Validation<TFieldType extends FieldType, TFieldValues extends FieldValues = FieldValues> = {
    bivarianceHack(args: {
        client: Client;
        config: Config;
        definition: FieldDefinition<TFieldType>;
        i18n: TFunction;
        watch: UseFormWatch<TFieldValues>;
    }): z.ZodType;
}['bivarianceHack'];

type BaseFieldDefinition<
    TFieldType extends FieldType,
    TFieldValues extends FieldValues = FieldValues,
> = {
    type: TFieldType;
    key: string;
    parent?: string | (string | number)[];
    autoComplete?: AutoFill;
    defaultValue?: string;
    description?: React.ReactNode;
    label?: string;
    placeholder?: string;
    required?: boolean;
    transform?: Transformer;
    validation?: Validation<TFieldType, TFieldValues>;
};

export type FieldDefinition<
    TFieldType extends FieldType = FieldType,
    TFieldValues extends FieldValues = FieldValues,
> = BaseFieldDefinition<TFieldType, TFieldValues> &
    (
        | {
              type: 'radio-group' | 'select';
              values: {
                  value: string;
                  label: string;
              }[];
          }
        | {
              type: 'checkbox';
              defaultChecked?: boolean;
          }
        | {
              type: 'password';
              canShowPassword?: boolean; /** TODO: implement this option in PasswordField */
              withPolicyRules?: boolean;
          }
        | {
              type: 'phone';
              allowInternational?: boolean;
              defaultCountry?: CountryCode;
              /** @deprecated Use `allowInternational` instead. */
              phoneNumberOptions?: PhoneNumberOptions;
          }
        | {
              type: 'date';
              max?: number;
              min?: number;
              yearRange?: number;
          }
        | {
              type: 'identifier';
              isWebAuthnLogin?: boolean;
              withPhoneNumber?: boolean;
          }
        | {
              type: 'hidden';
          }
        | {
              type: Exclude<
                  FieldType,
                  | 'checkbox'
                  | 'date'
                  | 'hidden'
                  | 'identifier'
                  | 'password'
                  | 'phone'
                  | 'radio-group'
                  | 'select'
              >;
          }
    );

const predefinedFields: Record<
    string,
    (args: {
        config: Config;
        definition: Omit<FieldDefinition<FieldType, FieldValues>, 'key' | 'type'>;
    }) => FieldDefinition<FieldType, FieldValues>
> = {
    customIdentifier: () => ({
        key: 'customIdentifier',
        label: 'customIdentifier',
        type: 'string',
        validation: () => z.string(),
    }),
    givenName: () => ({
        key: 'givenName',
        label: 'givenName',
        type: 'string',
        validation: () => z.string(),
    }),
    familyName: () => ({
        key: 'familyName',
        label: 'familyName',
        type: 'string',
        validation: () => z.string(),
    }),
    email: () => ({
        key: 'email',
        label: 'email',
        type: 'email',
        validation: ({ i18n }) =>
            z.email({
                error: i18n('validation.email'),
            }),
    }),
    identifier: ({ config, definition }) => {
        const { loginTypeAllowed } = config;
        const { isWebAuthnLogin = false } = definition as FieldDefinition<
            'identifier',
            FieldValues
        >;

        // fallback to email if phoneNumber is not allowed
        if (!isWebAuthnLogin && loginTypeAllowed.email && !loginTypeAllowed.phoneNumber) {
            return predefinedFields.email({ config, definition });
        }
        // fallback to phoneNumber if email is not allowed
        else if (!isWebAuthnLogin && loginTypeAllowed.phoneNumber && !loginTypeAllowed.email) {
            return predefinedFields.phoneNumber({ config, definition });
        }

        return {
            key: 'identifier',
            label: 'identifier',
            type: 'identifier',
            autoComplete: 'username webauthn',
            validation: ({ i18n }) => z.string(i18n('validation.identifier')),
        };
    },
    phoneNumber: () => ({
        key: 'phoneNumber',
        label: 'phoneNumber',
        type: 'phone',
        validation: ({ i18n }) =>
            z.e164({
                error: issue =>
                    !issue.input ? i18n('validation.required') : i18n('validation.phone'),
            }),
    }),
    password: () => ({
        key: 'password',
        label: 'password',
        type: 'password',
        validation: passwordValidation,
        withPolicyRules: true,
    }),
    passwordConfirmation: () => ({
        key: 'passwordConfirmation',
        label: 'passwordConfirmation',
        type: 'password',
        validation: ({ i18n, watch }) =>
            z.string().refine(value => value === watch('password'), {
                error: i18n('validation.passwordMatch'),
            }),
    }),
    gender: () => ({
        key: 'gender',
        label: 'gender',
        type: 'select',
        values: [
            {
                value: 'male',
                label: 'genders.male',
            },
            {
                value: 'female',
                label: 'genders.female',
            },
            {
                value: 'other',
                label: 'genders.other',
            },
        ],
        validation: ({ i18n }) => z.enum(['male', 'female', 'other'], i18n('validation.required')),
    }),
    birthdate: () =>
        ({
            key: 'birthdate',
            label: 'birthdate',
            type: 'date',
            validation: ({ definition: { min, max }, i18n }) => {
                let zDateType = z.iso.date({
                    error: issue =>
                        !issue.input ? i18n('validation.required') : i18n('validation.date'),
                });
                if (min) {
                    zDateType = zDateType.min(min, {
                        error: i18n('validation.birthdate.yearLimit', {
                            min,
                            max,
                        }),
                    });
                }
                if (max) {
                    zDateType = zDateType.max(max, {
                        error: i18n('validation.birthdate.yearLimit', {
                            min,
                            max,
                        }),
                    });
                }
                return zDateType;
            },
        }) satisfies FieldDefinition<'date'>,
    'address.title': () => ({
        key: 'title',
        parent: ['addresses', 0],
        label: 'address.title',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.addressType': () => ({
        key: 'addressType',
        parent: ['addresses', 0],
        label: 'address.addressType',
        type: 'select',
        values: [
            {
                value: 'billing',
                label: 'address.addressType.billing',
            },
            {
                value: 'delivery',
                label: 'address.addressType.delivery',
            },
        ],
        validation: () => z.string(),
    }),
    'address.streetAddress': () => ({
        key: 'streetAddress',
        parent: ['addresses', 0],
        label: 'address.streetAddress',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.addressComplement': () => ({
        key: 'addressComplement',
        parent: ['addresses', 0],
        label: 'address.addressComplement',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.locality': () => ({
        key: 'locality',
        parent: ['addresses', 0],
        label: 'address.locality',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.region': () => ({
        key: 'region',
        parent: ['addresses', 0],
        label: 'address.region',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.postalCode': () => ({
        key: 'postalCode',
        parent: ['addresses', 0],
        label: 'address.postalCode',
        type: 'string',
        validation: () => z.string(),
    }),
    'address.country': () => ({
        key: 'country',
        parent: ['addresses', 0],
        label: 'address.country',
        type: 'string',
        validation: () => z.string(),
    }),
    friendlyName: () => ({
        key: 'friendlyName',
        label: 'webauthn.friendly.name',
        required: false,
        type: 'string',
        validation: () => z.string(),
    }),
};

type PredefinedFields = keyof typeof predefinedFields;

export type StaticContent = {
    staticContent: React.ReactNode;
};

export type Field =
    | PredefinedFields
    | Optional<FieldDefinition, 'type'>
    | FieldDefinition
    | StaticContent;

export type PhoneNumberOptions = {
    allowInternational?: boolean;
    defaultCountry?: CountryCode;
    /**
     * If `withCountryCallingCode` property is explicitly set to true then the "country calling code" part (e.g. "+1" when country is "US") is included in the input field (but still isn't editable).
     * @deprecated Use `allowInternational` instead.
     */
    withCountryCallingCode?: boolean;
    /**
     * If `withCountrySelect` property is `true` then the user can select the country for the phone number. Must be a supported {@link https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2#Officially_assigned_code_elements country code}.
     * @deprecated Use `allowInternational` instead.
     */
    withCountrySelect?: boolean;
};

export function withoutStaticContent(fields: Exclude<Field, string>[]) {
    return fields.filter((field): field is FieldDefinition => !('staticContent' in field));
}

export function getFieldDefinitions(
    fields: Field[],
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions }
): (FieldDefinition | StaticContent)[] {
    return fields.map(field => {
        if (typeof field === 'object' && 'staticContent' in field) {
            return field;
        }

        return getFieldDefinition(field, config, options);
    });
}

export function getFieldDefinition(
    field: string | Optional<FieldDefinition, 'type'>,
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions }
): FieldDefinition {
    const { key, type, ...userDefinition } =
        typeof field === 'string'
            ? ({ key: camelCasePath(field) } as Partial<Omit<FieldDefinition, 'key'>> &
                  Pick<FieldDefinition, 'key'>)
            : { ...field, key: camelCasePath(field.key) };

    const predefinedField =
        predefinedFields[key]?.({ config, definition: userDefinition }) ??
        resolveCustomFieldDefinition(key, config) ??
        resolveConsentFieldDefinition(key, config, options);

    if (predefinedField) {
        return {
            required: true,
            ...predefinedField,
            ...userDefinition,
        } as FieldDefinition<(typeof predefinedField)['type']>;
    }

    if (typeof field === 'string') {
        throw new Error(`Unknown field: ${field}`);
    }

    return { key, required: true, ...userDefinition, type: type ?? 'string' } as FieldDefinition<
        typeof type extends undefined ? string : NonNullable<typeof type>
    >;
}

function resolveCustomFieldDefinition(field: string, config: Config): FieldDefinition | undefined {
    const matches = /^(?:customFields|custom_fields)\.(.+?)$/.exec(field);
    if (!matches) return undefined;
    const [, customFieldKey] = matches;

    const customField = config.customFields?.find(c => camelCasePath(c.path) === customFieldKey);
    if (!customField) return undefined;

    if (customField?.dataType === 'select') {
        return {
            key: `custom_fields.${customFieldKey}`,
            type: 'select',
            values: (customField.selectableValues ?? []).map(({ value, label, translations }) => ({
                label: translations.find(l => l.langCode === config.language)?.label ?? label,
                value,
            })),
            label:
                customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
                customField.name,
        } satisfies FieldDefinition;
    }

    return {
        key: `custom_fields.${customFieldKey}`,
        type: customField?.dataType ?? 'string',
        label:
            customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
            customField.name,
    } satisfies FieldDefinition;
}

function resolveConsentFieldDefinition(
    field: string,
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions }
): FieldDefinition | undefined {
    const matches = /^consents\.(.+?)(?:\.v(\d+))?$/.exec(field);
    if (!matches) return undefined;
    const [, consentKey, providedVersionId] = matches;

    // consent key should be snake_case
    const consent = config.consents?.find(c => c.key === snakeCasePath(consentKey));
    if (!consent) return undefined;

    if (options.errorArchivedConsents && consent.status === 'archived') {
        throw new Error(`The '${consent.key}' consent is archived and cannot be displayed.`);
    }

    const consentVersions = Object.values(config.consentsVersions).find(
        versions => versions.key === consent.key
    );
    if (!consentVersions) return undefined;

    const highestConsentVersion = [...consentVersions.versions]
        .sort((a, b) => a.versionId - b.versionId)
        .shift();

    const consentVersion = providedVersionId
        ? consentVersions.versions.find(v => v.versionId === Number(providedVersionId))
        : highestConsentVersion;

    // const versionId = providedVersionId
    //     ? Number(providedVersionId)
    //     : highestConsentVersion
    //       ? Number(highestConsentVersion.versionId)
    //       : 1;

    const consentCannotBeGranted = !options.errorArchivedConsents && consent.status === 'archived';

    return {
        type: 'checkbox',
        key: `consents.${consent.key}`, // Consent key should be snake_case
        label: consent.title,
        defaultChecked: consent.consentType === 'opt-out',
        description: consent.description ? (
            <MarkdownContent
                root={({ children, ...props }) => <span {...props}>{children}</span>}
                source={consent.description}
            />
        ) : undefined,
        transform: {
            input: (value?: UserConsent | boolean) => ({
                checked: typeof value === 'boolean' ? value : value?.granted,
            }),
            output: (checked: boolean | 'indeterminate') =>
                ({
                    consentType: consent.consentType,
                    granted: consentCannotBeGranted ? false : checked === true,
                    consentVersion,
                }) satisfies Omit<UserConsent, 'date'>,
        },
    };
}

function passwordValidation({
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
