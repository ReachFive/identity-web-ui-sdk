import React from 'react';
import { FieldValues, UseFormWatch } from 'react-hook-form';

import { TFunction } from 'i18next';
import { CountryCode, isSupportedCountry, parsePhoneNumberFromString } from 'libphonenumber-js/min';
import z from 'zod';

import { Client, UserConsent } from '@reachfive/identity-core';

import { MarkdownContent } from '@/components/miscComponent';
import { logError } from '@/helpers/logger';
import { camelCasePath, snakeCasePath } from '@/helpers/transformObjectProperties';
import { passwordValidation } from '@/lib/validation';
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
export type Validation<
    TFieldType extends FieldType,
    TFieldValues extends FieldValues = FieldValues,
> = {
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
    /**
     * The API payload field names this form field stands for, when the value it holds is submitted
     * under another key: the generic `identifier` field is sent as `email` / `phone_number` /
     * `custom_identifier` (see `specializeIdentifier`), so an API validation error naming one of
     * them belongs to it. Declared in the API's own casing.
     * @see resolveErrorFieldPath
     */
    errorFields?: string[];
    label?: string;
    placeholder?: string;
    readOnly?: boolean;
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
              /**
               * Whether a value matching neither an email nor a phone number is accepted as a custom
               * identifier. Defaults to `loginTypeAllowed.customIdentifier`, as the email and phone
               * number shapes default to their own login types. Set it to `false` in a widget which
               * has no flow to serve one (WebAuthn login, passwordless), so that the field refuses
               * that shape instead of submitting a value the handler then rejects. A tenant which
               * forbids the login type may not be opted back in.
               */
              allowCustomIdentifier?: boolean;
              defaultCountry?: CountryCode;
              /**
               * @deprecated Ignored. `loginTypeAllowed` is tenant configuration and is
               * authoritative: no field option may opt out of it.
               */
              isWebAuthnLogin?: boolean;
              /**
               * Whether the input is formatted as a phone number while the user types. Defaults to
               * `loginTypeAllowed.phoneNumber`. It does not affect which shapes are accepted — that
               * is decided by `loginTypeAllowed` alone.
               */
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

/**
 * The country a national phone number is interpreted against, resolved the same way
 * `PhoneNumberInput` does it, so that every phone-aware field agrees on the default.
 */
function resolveCountry(defaultCountry: CountryCode | undefined, config: Config): CountryCode {
    const country = defaultCountry ?? config.locale ?? config.countryCode ?? config.language;
    return isSupportedCountry(country) ? country : 'FR';
}

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
        const {
            allowCustomIdentifier = true,
            defaultCountry,
            // no widget passes this: defaulting it here keeps the validation below and the
            // `IdentifierField` formatting in agreement, and makes omitting it impossible to get wrong
            withPhoneNumber = loginTypeAllowed.phoneNumber,
        } = definition as FieldDefinition<'identifier', FieldValues>;

        // `loginTypeAllowed` is tenant configuration and is authoritative: when a single shape is an
        // allowed login type the field narrows to it, and nothing on the definition may opt out.
        // fallback to email if phoneNumber is not allowed
        if (loginTypeAllowed.email && !loginTypeAllowed.phoneNumber) {
            return predefinedFields.email({ config, definition });
        }
        // fallback to phoneNumber if email is not allowed
        else if (loginTypeAllowed.phoneNumber && !loginTypeAllowed.email) {
            return predefinedFields.phoneNumber({ config, definition });
        }

        // the country must be resolved here rather than left to the validation only: it is also
        // handed over to the `IdentifierField` component, which formats the input as the user
        // types. Both must agree on the country, otherwise a national number the component happily
        // formats could be rejected by the validation (or the other way around).
        const country = resolveCountry(defaultCountry, config);

        // as for the email and phone number shapes, `loginTypeAllowed` decides whether a custom
        // identifier is a valid one: the field option may only narrow what the tenant allows, never
        // opt back into a login type it forbids
        const acceptsCustomIdentifier = allowCustomIdentifier && loginTypeAllowed.customIdentifier;

        return {
            key: 'identifier',
            label: 'identifier',
            type: 'identifier',
            autoComplete: 'username webauthn',
            // the field is submitted as the shape it resolves to, so an API validation error names
            // that shape rather than the field
            errorFields: ['email', 'phone_number', 'custom_identifier'],
            defaultCountry: country,
            // carried on the definition so `IdentifierField` formats the input the same way the
            // validation below reads it
            withPhoneNumber,
            validation: ({ i18n }) => {
                const email = z.email();
                // an identifier is an email, a phone number or a custom identifier (see
                // `specializeIdentifier`): each shape is only held to its own rules, and a value
                // matching none of them is a custom identifier, which has no format to check.
                // A shape the tenant does not allow as a login type is refused outright — the field
                // is only reached generically when neither email nor phone is allowed on its own,
                // and `specializeIdentifier` would otherwise still submit it as that shape.
                return z.string(i18n('validation.identifier')).superRefine((value, ctx) => {
                    // no phone number nor custom identifier contains an `@`, so such a value is
                    // meant to be an email and is reported as a malformed one when it isn't
                    if (value.includes('@')) {
                        if (!loginTypeAllowed.email) {
                            ctx.addIssue({
                                code: 'custom',
                                message: i18n('validation.identifier'),
                            });
                            return;
                        }
                        if (!email.safeParse(value).success) {
                            ctx.addIssue({
                                code: 'custom',
                                message: i18n('validation.email'),
                            });
                        }
                        return;
                    }

                    // `extract: false` parses the whole input as a phone number instead of looking
                    // for one inside it. Without it the digits of a custom identifier are read as
                    // an impossible phone number (`jdoe2024` → `+332024`) and wrongly rejected.
                    const phoneNumber = parsePhoneNumberFromString(value, {
                        defaultCountry: country,
                        extract: false,
                    });
                    // neither an email nor a phone number: a custom identifier, which has no format
                    // to check — unless that shape is no valid identifier here at all
                    if (!phoneNumber) {
                        if (!acceptsCustomIdentifier) {
                            ctx.addIssue({
                                code: 'custom',
                                message: i18n('validation.identifier'),
                            });
                        }
                        return;
                    }

                    if (!loginTypeAllowed.phoneNumber) {
                        ctx.addIssue({
                            code: 'custom',
                            message: i18n('validation.identifier'),
                        });
                        return;
                    }

                    if (false === phoneNumber.isPossible()) {
                        ctx.addIssue({
                            code: 'custom',
                            message: i18n('validation.phone'),
                        });
                    }
                });
            },
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

/**
 * Apply the widget level phone number options to the phone number field, leaving any other field untouched.
 * Options explicitly set on the field definition take precedence.
 */
export function withPhoneNumberOptions(
    field: string | Field,
    phoneNumberOptions?: PhoneNumberOptions
): string | Field {
    if (phoneNumberOptions === undefined) return field;
    if (typeof field === 'object' && 'staticContent' in field) return field;

    const key = typeof field === 'string' ? field : field.key;
    if (key !== 'phoneNumber' && key !== 'phone_number') return field;

    const resolvedOptions = {
        allowInternational: phoneNumberOptions.allowInternational ?? false,
        defaultCountry: phoneNumberOptions.defaultCountry,
        phoneNumberOptions,
    };

    return typeof field === 'string'
        ? { key: field, type: 'phone' as const, ...resolvedOptions }
        : { ...resolvedOptions, ...field };
}

/** The react-hook-form path of a field definition, prefixed by its `parent` when it is a nested field. */
export function getFieldPath(field: Pick<FieldDefinition, 'key' | 'parent'>): string {
    const parent = Array.isArray(field.parent) ? field.parent.join('.') : field.parent;
    return parent ? `${parent}.${field.key}` : field.key;
}

/**
 * Resolve the `field` of an API validation error (`error_details[].field`) to the matching form field path.
 *
 * API errors reference the request payload path, which differs from the form field paths in two ways:
 * - the payload nests the profile under a wrapper (`profile.phone_number` for the WebAuthn signup
 *   endpoint, `data.email` for the signup one) whereas field paths are relative to that wrapper;
 * - the payload is snake_case whereas field keys are camelCase (`custom_fields.*` and `consents.*`
 *   keys being the exceptions, they stay snake_case).
 *
 * Leading segments are therefore dropped one by one until a known field path matches.
 *
 * A field may also stand for payload keys of its own (see `errorFields`), which is how an error on
 * `email` or `phone_number` reaches the generic `identifier` field. Such a match is reported as
 * `aliased` so that the caller keeps naming the error after the payload key rather than after the
 * form field, whose own message describes something else.
 *
 * @returns the matching form field path, or `undefined` when the error refers to no displayed field.
 */
export function resolveErrorFieldPath(
    field: string,
    fieldDefinitions: (FieldDefinition | StaticContent)[]
): { path: string; aliased: boolean } | undefined {
    const definitions = withoutStaticContent(fieldDefinitions);
    const fieldPaths = new Set(definitions.map(getFieldPath));
    const aliases = new Map(
        definitions.flatMap(definition =>
            (definition.errorFields ?? []).map(
                errorField => [errorField, getFieldPath(definition)] as const
            )
        )
    );
    const segments = field.split('.');
    for (let i = 0; i < segments.length; i++) {
        const candidate = segments.slice(i).join('.');
        // the raw candidate is tested first so that `custom_fields.*` / `consents.*` keys match as-is
        const variants = [candidate, camelCasePath(candidate), snakeCasePath(candidate)];
        // a displayed field always wins over a field which merely stands for the payload key
        for (const variant of variants) {
            if (fieldPaths.has(variant)) return { path: variant, aliased: false };
        }
        for (const variant of variants) {
            const path = aliases.get(variant);
            if (path) return { path, aliased: true };
        }
    }
    return undefined;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split('.');
    let current = obj;
    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        if (typeof current[segment] !== 'object' || current[segment] === null) {
            current[segment] = {};
        }
        current = current[segment] as Record<string, unknown>;
    }
    current[segments[segments.length - 1]] = value;
}

export function getDefaultFieldValues(
    fieldDefinitions: (FieldDefinition | StaticContent)[]
): Record<string, unknown> {
    const defaults: Record<string, unknown> = {};
    for (const fd of fieldDefinitions) {
        if ('staticContent' in fd) continue;
        const path = getFieldPath(fd);
        if (fd.type === 'checkbox' && 'defaultChecked' in fd) {
            const defaultVal = fd.defaultChecked === true;
            setNestedValue(defaults, path, fd.transform?.output(defaultVal) ?? defaultVal);
        } else if (fd.defaultValue !== undefined) {
            setNestedValue(
                defaults,
                path,
                fd.transform?.output(fd.defaultValue) ?? fd.defaultValue
            );
        }
    }
    return defaults;
}

export function getFieldDefinitions(
    fields: Field[],
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions }
): (FieldDefinition | StaticContent)[] {
    return fields
        .map(field => {
            if (typeof field === 'object' && 'staticContent' in field) {
                return field;
            }

            return getFieldDefinition(field, config, options);
        })
        .filter((field): field is FieldDefinition | StaticContent => field !== undefined);
}

export function getFieldDefinition(
    field: string | Optional<FieldDefinition, 'type'>,
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions }
): FieldDefinition | undefined {
    const { key, type, ...userDefinition } =
        typeof field === 'string'
            ? ({ key: camelCasePath(field) } as Partial<Omit<FieldDefinition, 'key'>> &
                  Pick<FieldDefinition, 'key'>)
            : { ...field, key: camelCasePath(field.key) };

    const predefinedField =
        predefinedFields[key]?.({ config, definition: userDefinition }) ??
        resolveCustomFieldDefinition(key, config) ??
        resolveAddressFieldDefinition(key, config) ??
        resolveConsentFieldDefinition(key, config, options, userDefinition.required);

    if (predefinedField) {
        return {
            required: true,
            ...predefinedField,
            ...userDefinition,
            ...(type !== undefined ? { type } : {}),
        } as FieldDefinition;
    }

    if (typeof field === 'string') {
        logError(`Unknown field: ${field}`);
        return undefined;
    }

    return { key, required: true, ...userDefinition, type: type ?? 'string' } as FieldDefinition<
        typeof type extends undefined ? string : NonNullable<typeof type>
    >;
}

function resolveCustomFieldDefinition(field: string, config: Config): FieldDefinition | undefined {
    const matches = /^(?:customFields|custom_fields)\.(.+?)$/.exec(field);
    const customFieldKey = matches ? matches[1] : field;

    const customField = config.customFields?.find(c => camelCasePath(c.path) === customFieldKey);
    if (!customField) return undefined;

    if (customField?.dataType === 'select') {
        return {
            key: `custom_fields.${customField.path}`,
            type: 'select',
            values: (customField.selectableValues ?? [])
                .filter(({ value }) => value !== '')
                .map(({ value, label, translations }) => ({
                    label: translations.find(l => l.langCode === config.language)?.label ?? label,
                    value,
                })),
            label:
                customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
                customField.name,
        } satisfies FieldDefinition;
    }

    return {
        key: `custom_fields.${customField.path}`,
        type: customField?.dataType ?? 'string',
        label:
            customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
            customField.name,
    } satisfies FieldDefinition;
}

function resolveAddressFieldDefinition(field: string, config: Config): FieldDefinition | undefined {
    const matches = /^address\.(?:customFields|custom_fields)\.(.+?)$/.exec(field);
    if (!matches) return undefined;
    const customFieldKey = matches[1];

    const customField = config.addressFields?.find(c => camelCasePath(c.path) === customFieldKey);
    if (!customField) return undefined;

    const parent = ['addresses', 0];

    if (customField.dataType === 'select') {
        return {
            key: `custom_fields.${customField.path}`,
            parent,
            type: 'select',
            values: (customField.selectableValues ?? [])
                .filter(({ value }) => value !== '')
                .map(({ value, label, translations }) => ({
                    label: translations.find(l => l.langCode === config.language)?.label ?? label,
                    value,
                })),
            label:
                customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
                customField.name,
        } satisfies FieldDefinition;
    }

    return {
        key: `custom_fields.${customField.path}`,
        parent,
        type: customField.dataType ?? 'string',
        label:
            customField.nameTranslations?.find(l => l.langCode === config.language)?.label ??
            customField.name,
    } satisfies FieldDefinition;
}

function resolveConsentFieldDefinition(
    field: string,
    config: Config,
    options: { errorArchivedConsents?: boolean; phoneNumberOptions?: PhoneNumberOptions },
    requiredOverride?: boolean
): FieldDefinition | undefined {
    // the `consents.` prefix is optional: a bare key is accepted as long as it matches an existing consent below
    const matches = /^(?:consents\.)?(.+?)(?:\.v(\d+))?$/.exec(field);
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
    const isRequired = requiredOverride === true;

    return {
        type: 'checkbox',
        key: `consents.${consent.key}`, // Consent key should be snake_case
        label: consent.title,
        required: isRequired,
        // the checkbox's initial state is driven solely by the field's own `defaultChecked`
        // override (merged in by getFieldDefinition after this); consentType/required must
        // not influence it — an opt-out consent isn't pre-checked unless explicitly asked to be
        defaultChecked: false,
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
        // a consent declared required must be actively checked, whatever its type — an opt-out
        // consent isn't pre-checked either (see `defaultChecked` above), so leaving it out of the
        // validation would let it be submitted ungranted with no feedback at all. An archived
        // consent is excluded because it is forced to `granted: false` and could never be granted.
        // The check has to be spelled out here: transform.output always produces a non-null object
        // so required:true alone can't catch the unchecked state (granted:false is truthy as an object)
        validation:
            isRequired && !consentCannotBeGranted
                ? ({ i18n }) =>
                      z
                          .any()
                          .refine(
                              v =>
                                  typeof v === 'object' &&
                                  v !== null &&
                                  (v as UserConsent).granted === true,
                              { error: i18n('validation.required') }
                          )
                : undefined,
    };
}
