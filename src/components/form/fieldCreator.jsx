import React from 'react';

import { PathMapping } from '../../core/mapping';
import { required as requiredRule, empty as emptyRule } from '../../core/validation';
import { isEmpty, isValued } from '../../helpers/utils';
import generateId from '../../helpers/inputIdGenerator';
import { camelCasePath } from '../../helpers/transformObjectProperties';

export const createField = ({
    key,
    path = key,
    label,
    defaultValue,
    required = true,
    readOnly = false,
    autoComplete,
    validator = emptyRule,
    mapping = new PathMapping(camelCasePath(path)),
    format = {
        bind: x => isValued(x) ? x : '',
        unbind: x => !isEmpty(x) ? x : null
    },
    rawProperty = 'raw',
    component,
    extendedParams = {}
}) => ({
    path: path,
    create: ({ i18n, showLabel }) => {
        const extParams = typeof extendedParams === 'function' ? extendedParams(i18n) : extendedParams;
        const staticProps = {
            inputId: generateId(key),
            key,
            path: key,
            label: i18n(label),
            required,
            readOnly,
            autoComplete,
            i18n,
            showLabel,
            ...extParams
        };

        const fullValidator = (required ? requiredRule.and(validator) : validator).create(i18n);
        const Component = component;

        return {
            key,
            render: ({ state, ...rest }) => {
                const { key, ...props } = { ...staticProps, ...rest}
                return <Component key={key} {...state} {...props} />
            },
            initialize: model => {
                const modelValue = mapping.bind(model);
                const initValue = isValued(modelValue, rawProperty) ? modelValue : defaultValue;
                return {
                    value: format.bind(initValue),
                    isDirty: false
                };
            },
            unbind: (model, { value }) => mapping.unbind(model, format.unbind(value)),
            validate: ({ value }, ctx) => (
                (required || isValued(value)) ? fullValidator(value, ctx) : {}
            )
        };
    }
});
