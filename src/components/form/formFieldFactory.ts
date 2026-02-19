import { ConsentVersions, CustomField, CustomFieldType } from '@reachfive/identity-core';

import { AddressPathMapping } from '../../core/mapping';
import { Validator, checked, email, float, integer } from '../../core/validation';
import { UserError } from '../../helpers/errors';
import { camelCasePath } from '../../helpers/transformObjectProperties';
import { FormValue, camelCase, isRichFormValue } from '../../helpers/utils';
import { Config, Prettify } from '../../types';
import birthdateField from './fields/birthdayField';
import checkboxField from './fields/checkboxField';
import consentField from './fields/consentField';
import dateField from './fields/dateField';
import passwordField from './fields/passwordField';
import phoneNumberField from './fields/phoneNumberField';
import selectField from './fields/selectField';
import simpleField from './fields/simpleField';
import simplePasswordField from './fields/simplePasswordField';
import { FormContext } from './formComponent';

type FieldBuilder =
    | typeof simpleField
    | typeof checkboxField
    | typeof selectField
    | typeof dateField
    | typeof birthdateField
    | typeof phoneNumberField
    | typeof passwordField
    | typeof simplePasswordField
    | typeof consentField;

type FieldConfig<T extends FieldBuilder> = Parameters<T>[0];

type PredefinedFieldConfig<T extends FieldBuilder> = Prettify<Omit<FieldConfig<T>, 'label'>>;

type PredefinedFieldKey = keyof typeof predefinedFields;

type PredefinedFieldOptions = {
    [K in keyof typeof predefinedFields]: Prettify<
        { key: K } & Parameters<(typeof predefinedFields)[K]>[0]
    >;
}[keyof typeof predefinedFields];

type CustomFieldOptions = Prettify<{ key: string } & FieldOptions>;

type ConsentFieldOptions = { key: string; errorArchivedConsents?: boolean };

type DataType<T extends CustomFieldType> = { dataType: T };

type FieldOptions =
    | Prettify<DataType<'number'> & FieldConfig<typeof simpleField>>
    | Prettify<DataType<'integer'> & FieldConfig<typeof simpleField>>
    | Prettify<DataType<'decimal'> & FieldConfig<typeof simpleField>>
    | Prettify<DataType<'string'> & FieldConfig<typeof simpleField>>
    | Prettify<DataType<'date'> & FieldConfig<typeof dateField>>
    | Prettify<DataType<'checkbox'> & FieldConfig<typeof checkboxField>>
    | Prettify<DataType<'select'> & FieldConfig<typeof selectField>>
    // | DataType<'tags'>
    // | DataType<'object'>
    | Prettify<DataType<'phone'> & FieldConfig<typeof phoneNumberField>>
    | Prettify<DataType<'email'> & FieldConfig<typeof simpleField>>;

// type FieldOptionsByDataType<T extends CustomFieldType> = Prettify<Omit<Extract<FieldOptions, DataType<T>>, 'dataType'>>

type PredefinedFieldBuilder<T extends FieldBuilder> = (
    props: PredefinedFieldConfig<T>,
    config: Config
) => ReturnType<T>;

function createPredefinedFieldBuilder<T extends FieldBuilder>(builder: PredefinedFieldBuilder<T>) {
    return builder;
}

function predefinedFieldComponent<T extends FieldBuilder>(
    builder: PredefinedFieldBuilder<T>,
    props: PredefinedFieldConfig<T>,
    config: Config
) {
    return builder(props, config);
}

const predefinedFields = {
    customIdentifier: createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'customIdentifier',
            ...props,
        })
    ),
    givenName: createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'givenName',
            ...props,
        })
    ),
    familyName: createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'familyName',
            ...props,
        })
    ),
    email: createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'email',
            type: 'email',
            ...props,
            validator: email,
        })
    ),
    phoneNumber: createPredefinedFieldBuilder<typeof phoneNumberField>((props, config) =>
        phoneNumberField(props, config)
    ),
    password: createPredefinedFieldBuilder<typeof passwordField>((props, config) =>
        passwordField(props, config)
    ),
    passwordConfirmation: createPredefinedFieldBuilder<typeof simplePasswordField>(
        (props, _config) =>
            simplePasswordField({
                label: 'passwordConfirmation',
                ...props,
                canShowPassword: false,
                validator: new Validator<string, unknown>({
                    rule: (value, ctx) =>
                        value === (ctx as FormContext<{ password: string }>).fields.password,
                    hint: 'passwordMatch',
                }),
                // mapping: {
                //     bind: () => undefined,
                //     unbind: x => x
                // }
            })
    ),
    gender: createPredefinedFieldBuilder<typeof selectField>((props, _config) =>
        selectField({
            label: 'gender',
            ...props,
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
        })
    ),
    birthdate: createPredefinedFieldBuilder<typeof birthdateField>((props, config) =>
        birthdateField(props, config)
    ),
    'address.title': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.title',
            path: 'addresses.title',
            mapping: new AddressPathMapping('title'),
            ...props,
        })
    ),
    'address.addressType': createPredefinedFieldBuilder<typeof selectField>((props, _config) =>
        selectField({
            label: 'address.addressType',
            path: 'addresses.addressType',
            mapping: new AddressPathMapping('addressType'),
            ...props,
            values: [
                { value: 'billing', label: 'address.addressType.billing' },
                { value: 'delivery', label: 'address.addressType.delivery' },
            ],
        })
    ),
    'address.streetAddress': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.streetAddress',
            path: 'addresses.streetAddress',
            mapping: new AddressPathMapping('streetAddress'),
            ...props,
        })
    ),
    'address.addressComplement': createPredefinedFieldBuilder<typeof simpleField>(
        (props, _config) =>
            simpleField({
                label: 'address.addressComplement',
                path: 'addresses.addressComplement',
                mapping: new AddressPathMapping('addressComplement'),
                ...props,
            })
    ),
    'address.locality': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.locality',
            path: 'addresses.locality',
            mapping: new AddressPathMapping('locality'),
            ...props,
        })
    ),
    'address.region': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.region',
            path: 'addresses.region',
            mapping: new AddressPathMapping('region'),
            ...props,
        })
    ),
    'address.postalCode': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.postalCode',
            path: 'addresses.postalCode',
            mapping: new AddressPathMapping('postalCode'),
            ...props,
        })
    ),
    'address.country': createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'address.country',
            path: 'addresses.country',
            mapping: new AddressPathMapping('country'),
            ...props,
        })
    ),
    friendlyName: createPredefinedFieldBuilder<typeof simpleField>((props, _config) =>
        simpleField({
            label: 'webauthn.friendly.name',
            required: false,
            ...props,
        })
    ),
};

type CustomFieldBuilder<T extends FieldBuilder> = (
    customField: CustomField,
    { label, ...props }: FieldConfig<T>,
    config: Config
) => ReturnType<T>;

function createFieldBuilder<T extends FieldBuilder>(builder: CustomFieldBuilder<T>) {
    return builder;
}

function customFieldComponent<T extends FieldBuilder>(
    customField: CustomField,
    builder: CustomFieldBuilder<T>,
    props: FieldConfig<T>,
    config: Config
) {
    return builder(customField, props, config);
}

const customFields = {
    number: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
            type: 'number',
        })
    ),
    integer: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
            type: 'number',
            format: {
                bind: (value?: string | number) =>
                    typeof value === 'number' ? value.toString() : '',
                unbind: (value?: FormValue<string>) => {
                    const string = isRichFormValue(value) ? value.raw : value;
                    return string ? parseInt(string, 10) : 0;
                },
            },
            validator: integer,
        })
    ),
    decimal: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
            type: 'number',
            format: {
                bind: (value?: string | number) =>
                    typeof value === 'number' ? value.toString() : '',
                unbind: (value?: FormValue<string>) => {
                    const string = isRichFormValue(value) ? value.raw : value;
                    return string ? parseFloat(string) : 0;
                },
            },
            validator: float,
        })
    ),
    string: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
        })
    ),
    date: createFieldBuilder<typeof dateField>((customField, { label, ...props }, config) =>
        dateField(
            {
                label: label ?? customField.name,
                ...props,
                key: `custom_fields.${customField.path}`,
            },
            config
        )
    ),
    checkbox: createFieldBuilder<typeof checkboxField>(
        (customField, { label, ...props }, _config) =>
            checkboxField({
                label: label ?? customField.name,
                ...props,
                key: `custom_fields.${customField.path}`,
                ...(props.required ? { validator: checked } : {}),
            })
    ),
    select: createFieldBuilder<typeof selectField>((customField, { label, ...props }, _config) =>
        selectField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
            values: customField.selectableValues ?? [],
        })
    ),
    phone: createFieldBuilder<typeof phoneNumberField>((customField, { label, ...props }, config) =>
        phoneNumberField(
            {
                label: label ?? customField.name,
                ...props,
                key: `custom_fields.${customField.path}`,
            },
            config
        )
    ),
    email: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
            type: 'email',
            validator: email,
        })
    ),
    tags: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
        })
    ),
    object: createFieldBuilder<typeof simpleField>((customField, { label, ...props }, _config) =>
        simpleField({
            label: label ?? customField.name,
            ...props,
            key: `custom_fields.${customField.path}`,
        })
    ),
};

function consentFieldComponent(
    consent: ConsentVersions,
    fieldConfig: ConsentFieldOptions,
    versionIdPath: string | number
) {
    if (fieldConfig.errorArchivedConsents && consent.status === 'archived') {
        throw new UserError(`The '${consent.key}' consent is archived and cannot be displayed.`);
    }

    // If the version ID is not defined in the path, get the latest version ID
    const versionId =
        Number(versionIdPath) ||
        Math.max(...Object.values(consent.versions.map(v => Number(v.versionId))));

    const version = consent.versions.find(version => version.versionId === versionId);
    if (!version) {
        throw new UserError(`Unknown version ID n°${versionId} of consent '${consent.key}'.`);
    }

    const baseConfig: FieldConfig<typeof consentField> = {
        ...fieldConfig,
        key: `consents.${consent.key}.${versionId}`,
        path: `consents.${consent.key}`, // Will target the same profile consent value for different versions of the consent
        label: version.title,
        type: consent.consentType,
        version: { versionId, language: version.language },
        description: version.description ?? version.title,
        consentCannotBeGranted: !fieldConfig.errorArchivedConsents && consent.status === 'archived',
    };

    return consentField(baseConfig);
}

function isPredefinedField(key: string): key is PredefinedFieldKey {
    return key in predefinedFields;
}

function findCustomField(
    customFields: CustomField[],
    camelPath: string,
    prefix = 'customFields'
): CustomField | undefined {
    return customFields?.find(customField => {
        const fieldCamelPath = camelCase(customField.path);
        return camelPath === fieldCamelPath || camelPath === `${prefix}.${fieldCamelPath}`;
    });
}

function buildCustomField<FieldConfig extends FieldConf<string>>(
    customField: CustomField,
    fieldConfig: FieldConfig,
    config: Config
) {
    const builder = customFields[customField.dataType];
    type Field = typeof builder extends CustomFieldBuilder<infer T> ? T : never;
    return customFieldComponent<Field>(customField, builder, fieldConfig, config);
}

function isConsentField(
    config: Config,
    camelPath: string,
    _options: object
): _options is ConsentFieldOptions {
    return Object.values(config.consentsVersions).some(versions => {
        const fieldCamelPath = camelCase(versions.key);
        return camelPath === fieldCamelPath || camelPath === `consents.${fieldCamelPath}`;
    });
}

const findConsentField = (config: Config, camelPath: string): ConsentVersions | undefined => {
    return Object.values(config.consentsVersions).find(versions => {
        const fieldCamelPath = camelCase(versions.key);
        return camelPath === fieldCamelPath || camelPath === `consents.${fieldCamelPath}`;
    });
};

type FieldConf<K extends string> = K extends PredefinedFieldKey
    ? { key: PredefinedFieldKey } & PredefinedFieldConfig<FieldBuilder>
    : K extends `custom.${string}`
      ? CustomFieldOptions
      : K extends `consents.${string}`
        ? ConsentFieldOptions
        : CustomFieldOptions | ConsentFieldOptions;

export const resolveField = <K extends string>(
    fieldConfig: FieldConf<K> & ExtraOptions,
    config: Config
) => {
    // Predefined fields
    if (isPredefinedField(fieldConfig.key)) {
        const builder = predefinedFields[fieldConfig.key];
        type Field = typeof builder extends PredefinedFieldBuilder<infer T> ? T : never;
        return predefinedFieldComponent<Field>(
            builder,
            fieldConfig as PredefinedFieldConfig<Field>,
            config
        );
    }

    // Custom fields
    const customField = findCustomField(config.customFields ?? [], fieldConfig.key);
    if (customField) {
        return buildCustomField(customField, fieldConfig, config);
    }

    // Custom address fields
    const addressField = findCustomField(
        config.addressFields ?? [],
        fieldConfig.key,
        'address.customFields'
    );
    // custom address field property should be `customField.{string}`
    if (addressField) {
        const addressProperty =
            new RegExp('^address(?:es)?\\.(.+)').exec(fieldConfig.key)?.at(1) ?? fieldConfig.key;
        const addressFieldConfig = {
            ...fieldConfig,
            path: `addresses.${addressProperty}`,
            mapping: new AddressPathMapping(addressProperty),
        };
        return buildCustomField(addressField, addressFieldConfig, config);
    }

    // Consent fields
    const camelPathSplit =
        fieldConfig.key.split('.v'); /** @todo What if consent start with a `v`? */
    if (isConsentField(config, camelPathSplit[0], fieldConfig)) {
        const consentField = findConsentField(config, camelPathSplit[0]);
        // Find most recent consent version if not given
        if (consentField) {
            const highestConsentVersion = consentField.versions[0].versionId;
            return consentFieldComponent(
                consentField,
                fieldConfig,
                camelPathSplit[1] || highestConsentVersion
            );
        }
    }

    throw new UserError(`Unknown field: ${fieldConfig.key}`);
};

export type ExtraOptions = {
    canShowPassword?: boolean;
    errorArchivedConsents?: boolean;
};

/**
 * @example { key: "email" }
 * @example { key: "family_name", defaultValue: "Moreau", required": true }
 * @example { key: "given_name", defaultValue: "Kylian", type: "hidden" }
 * @example { key: "customFields.date", path: "date", dataType: "date" }
 * @example { key: "consents.foo" }
 */
export type Field = PredefinedFieldOptions | CustomFieldOptions | ConsentFieldOptions;

export function buildFormFields(
    fields: (string | Field)[] = [],
    { canShowPassword, errorArchivedConsents, ...config }: Config & ExtraOptions
) {
    return fields
        .filter(x => !!x)
        .map(field =>
            resolveField(
                typeof field === 'string'
                    ? { key: camelCasePath(field), canShowPassword, errorArchivedConsents }
                    : {
                          ...field,
                          key: camelCasePath(field.key),
                          canShowPassword,
                          errorArchivedConsents,
                      },
                config
            )
        );
}
