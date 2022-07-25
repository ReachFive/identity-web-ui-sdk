import React from 'react';

import isFunction from 'lodash-es/isFunction';
import isEmpty from 'lodash-es/isEmpty';

import { PathMapping } from '../../core/mapping';
import { required as requiredRule, empty as emptyRule } from '../../core/validation';
import { isValued } from '../../helpers/utils';
import generateId from '../../helpers/inputIdGenerator';
import { camelCasePath } from '../../helpers/transformObjectProperties';

export const createField = ({
    key,
    path = key,
    label,
    defaultValue,
    required = true,
    readOnly = false,
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
        const extParams = isFunction(extendedParams) ? extendedParams(i18n) : extendedParams;
        const staticProps = {
            inputId: generateId(key),
            key,
            path: key,
            label: i18n(label),
            required,
            readOnly,
            i18n,
            showLabel,
            ...extParams
        };

        const fullValidator = (required ? requiredRule.and(validator) : validator).create(i18n);
        const Component = component;

        return {
            key,
            render: ({ state, ...props }) => (<Component {...state} {...props} {...staticProps} />),
            initialize: model => {
                const modelValue = mapping.bind(model);
                const initValue = isValued(modelValue, rawProperty) ? modelValue : defaultValue;
                return {
                    value: format.bind(initValue),
                    isDirty: false
                };
            },
            unbind: (model, { value }) => mapping.unbind(model, format.unbind(value)),
            validate: ({ value, isDirty }, ctx) => (
                (required || isValued(value)) ? fullValidator(value, ctx) : {}
            )
        };
    }
});
