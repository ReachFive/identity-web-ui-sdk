import compact from 'lodash-es/compact';
import isString from 'lodash-es/isString';
import camelCase from 'lodash-es/camelCase';
import find from 'lodash-es/find';

import { Validator, email, integer, float, checked } from '../../core/validation';
import { UserError } from '../../helpers/errors';
import { camelCasePath } from '../../helpers/transformObjectProperties';

import { simpleField } from './fields/simpleField';
import selectField from './fields/selectField';
import checkboxField from './fields/checkboxField';
import dateField from './fields/dateField';
import birthdateField from './fields/birthdayField';
import phoneNumberField from './fields/phoneNumberField';
import { passwordField } from './fields/passwordField';
import { simplePasswordField } from './fields/simplePasswordField';
import consentField from './fields/consentField';

const predefinedFields = {
    givenName: cfg => simpleField({
        key: 'given_name',
        label: 'givenName',
        ...cfg
    }),
    familyName: cfg => simpleField({
        key: 'family_name',
        label: 'familyName',
        ...cfg
    }),
    email: cfg => simpleField({
        key: 'email',
        label: 'email',
        type: 'email',
        ...cfg,
        validator: email
    }),
    phoneNumber: phoneNumberField,
    password: passwordField,
    passwordConfirmation: cfg => simplePasswordField({
        key: 'password_confirmation',
        label: 'passwordConfirmation',
        ...cfg,
        canShowPassword: false,
        validator: new Validator({
            rule: (value, ctx) => value === ctx.fields.password.value,
            hint: 'passwordMatch'
        }),
        mapping: {
            bind: () => undefined,
            unbind: x => x
        }
    }),
    gender: cfg => selectField({
        key: 'gender',
        label: 'gender',
        ...cfg,
        values: [
            {
                value: 'male',
                label: 'genders.male'
            },
            {
                value: 'female',
                label: 'genders.female'
            },
            {
                value: 'other',
                label: 'genders.other'
            }
        ]
    }),
    birthdate: birthdateField,
    'address.streetAddress': cfg => simpleField({
        key: 'address.streetAddress',
        label: 'address.streetAddress',
        ...cfg
    }),
    'address.locality': cfg => simpleField({
        key: 'address.locality',
        label: 'address.locality',
        ...cfg
    }),
    'address.region': cfg => simpleField({
        key: 'address.region',
        label: 'address.region',
        ...cfg
    }),
    'address.postalCode': cfg => simpleField({
        key: 'address.postalCode',
        label: 'address.postalCode',
        ...cfg
    }),
    'address.country': cfg => simpleField({
        key: 'address.country',
        label: 'address.country',
        ...cfg
    }),
    friendlyName: cfg => simpleField({
        key: 'friendly_name',
        label: 'webauthn.friendly.name',
        required: false,
        ...cfg
    })
};

function customFieldComponent(customField, cfg) {
    const baseConfig = {
        label: customField.name,
        ...cfg,
        key: `custom_fields.${customField.path}`
    };

    if (customField.dataType === 'checkbox') {
        const checkboxConfig = cfg.required ? { ...baseConfig, validator: checked } : { ...baseConfig }
        return checkboxField(checkboxConfig);
    } else if (customField.dataType === 'date') {
        return dateField(baseConfig);
    } else if (customField.dataType === 'integer') {
        return simpleField({
            ...baseConfig,
            type: 'number',
            format: {
                bind: x => (typeof x === 'number') ? x.toString() : '',
                unbind: x => parseInt(x)
            },
            validator: integer
        });
    } else if (customField.dataType === 'decimal') {
        return simpleField({
            ...baseConfig,
            type: 'number',
            format: {
                bind: x => (typeof x === 'number') ? x.toString() : '',
                unbind: x => parseFloat(x)
            },
            validator: float
        });
    } else if (customField.dataType === 'select') {
        return selectField({
            ...baseConfig,
            values: customField.selectableValues
        })
    } else if (customField.dataType === 'email') {
        return simpleField({
            ...baseConfig,
            type: 'email',
            validator: email
        });
    } else if (customField.dataType === 'phone') {
        return simpleField(baseConfig)
    } else if (customField.dataType === 'string') {
        return simpleField(baseConfig)
    } else {
        throw new UserError(
            `Custom field '${customField.id}' cannot be displayed. Type '${customField.dataType}' is not supported in forms.`
        );
    }
}

function consentFieldComponent(consent, versionIdPath, cfg, language) {
    // If the version ID is not defined in the path, get the latest version ID
    const versionId = parseInt(versionIdPath || Math.max(...Object.values(consent.versions.map(v => v.version_id))));

    const version = consent.versions.find(version => version.version_id === versionId);
    if (!version) {
        throw new Error(`Unknown version ID n°${versionID} of consent '${consent.key}'.`);
    }

    const baseConfig = {
        label: version.title,
        extendedParams: {
            description: version.description,
            version: { versionId, language }
        },
        type: consent.consentType,
        ...cfg,
        key: `consents.${consent.key}`
    };

    return consentField(baseConfig);
}

const findCustomField = (config, camelPath) => (
    find(config.customFields, f => {
        const fieldCamelPath = camelCase(f.path);
        return camelPath === fieldCamelPath || camelPath === `customFields.${fieldCamelPath}`;
    })
)

const findConsentField = (config, camelPath) => {
    return find(config.consentsVersions, f => {
        const fieldCamelPath = camelCase(f.key);
        return camelPath === fieldCamelPath || camelPath === `consents.${fieldCamelPath}`;
    })
}

const resolveField = (fieldConfig, config) => {
    const camelPath = camelCasePath(fieldConfig.key);

    if (predefinedFields[camelPath]) {
        return predefinedFields[camelPath](fieldConfig, config);
    }

    const customField = findCustomField(config, camelPath);
    if (customField) {
        return customFieldComponent(customField, fieldConfig);
    }

    const camelPathSplit = camelPath.split('.v');
    const consentField = findConsentField(config, camelPathSplit[0]);
    if (consentField) {
        return consentFieldComponent(consentField, camelPathSplit[1], fieldConfig, config.language);
    }

    throw new Error(`Unknown field: ${fieldConfig.key}`);
};

export const buildFormFields = (fields = [], { canShowPassword, ...config }) => compact(fields).map(field => (
    resolveField(isString(field) ? { key: field, canShowPassword } : { canShowPassword, ...field }, config)
));

export const computeFieldList = fields => fields.map(f => f.path).join(',');
