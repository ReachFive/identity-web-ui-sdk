import React, { type ComponentType } from 'react';

import { TFunction } from 'i18next';
import type { WithI18n } from '../../contexts/i18n';
import { DefaultPathMapping, type PathMapping } from '../../core/mapping';
import {
    empty as emptyRule,
    isValidatorSuccess,
    required as requiredRule,
    type CompoundValidator,
    type Validator,
    type ValidatorResult,
    type ValidatorSuccess,
} from '../../core/validation';
import generateId from '../../helpers/inputIdGenerator';
import { camelCasePath } from '../../helpers/transformObjectProperties';
import { isRichFormValue, isValued, type FormValue } from '../../helpers/utils';
import type { FormContext } from './formComponent';

interface FieldCreateProps {
    showLabel: boolean;
}

export interface FieldCreator<
    T,
    P = {},
    E extends Record<string, unknown> = {},
    K extends string = 'raw',
> {
    key: string;
    path: string;
    create: (options: WithI18n<FieldCreateProps>) => Field<T, P, E, K>;
}

export interface Field<
    T,
    P = {},
    E extends Record<string, unknown> = {},
    K extends string = 'raw',
> {
    key: string;
    render: (
        props: Partial<P> &
            Partial<FieldComponentProps<T, {}, E, K>> & { state: FieldValue<T, K, E> }
    ) => React.ReactNode;
    initialize: <M extends Record<PropertyKey, unknown>>(model: Partial<M>) => FieldValue<T, K>;
    unbind: <M extends Record<PropertyKey, unknown>>(model: M, state: FieldValue<T, K, E>) => M;
    validate: (data: FieldValue<T, K, E>, ctx: FormContext<any>) => Promise<ValidatorResult>;
}

export type FieldValue<T, K extends string = 'raw', E extends Record<string, unknown> = {}> = E & {
    value?: FormValue<T, K>;
    isDirty?: boolean;
    validation?: ValidatorResult;
};

export type FieldComponentProps<
    T,
    P = {},
    E extends Record<string, unknown> = {},
    K extends string = 'raw',
> = P & {
    inputId: string;
    key: string;
    path: string;
    label: string;
    onChange: (value: FieldValue<T, K, E>) => void;
    placeholder?: string;
    autoComplete?: AutoFill;
    rawProperty?: K;
    required?: boolean;
    readOnly?: boolean;
    i18n: TFunction;
    showLabel?: boolean;
    value?: FormValue<T, K>;
    validation?: ValidatorResult<E>;
};

export interface Formatter<T, F, K extends string> {
    bind: (value?: T) => FormValue<F, K> | undefined;
    unbind: (value?: FormValue<F, K>) => T | null | undefined;
}

export type FieldDefinition<T, F = T, K extends string = 'raw'> = {
    key: string;
    path?: string;
    label: string;
    required?: boolean;
    readOnly?: boolean;
    autoComplete?: AutoFill;
    defaultValue?: T;
    format?: Formatter<T, F, K>;
    validator?: Validator<F, any> | CompoundValidator<F, any>;
    mapping?: PathMapping;
};

export interface FieldProps<
    T,
    F,
    P extends FieldComponentProps<F, ExtraParams, E, K>,
    ExtraParams extends Record<string, unknown> = {},
    K extends string = 'raw',
    E extends Record<string, unknown> = {},
> extends FieldDefinition<T, F, K> {
    label: string;
    mapping?: PathMapping;
    format?: Formatter<T, F, K>;
    rawProperty?: K;
    component: ComponentType<P>;
    extendedParams?: ExtraParams | ((i18n: TFunction) => ExtraParams);
}

export function createField<
    T,
    F,
    P extends FieldComponentProps<F, ExtraParams, E, K>,
    ExtraParams extends Record<string, unknown> = {},
    K extends string = 'raw',
    E extends Record<string, unknown> = {},
>({
    key,
    path = key,
    label,
    defaultValue,
    required = true,
    readOnly = false,
    autoComplete,
    validator = emptyRule,
    mapping = new DefaultPathMapping(camelCasePath(path)),
    format = {
        bind: x => (isValued(x) ? (x as F) : undefined),
        unbind: x =>
            isValued(x) && isRichFormValue(x, rawProperty) ? (x[rawProperty] as T) : (x as T),
    },
    rawProperty = 'raw' as K,
    component: Component,
    extendedParams = {} as ExtraParams,
}: FieldProps<T, F, P, ExtraParams, K, E>): FieldCreator<F, P, E, K> {
    return {
        key,
        path: path,
        create: ({ i18n, showLabel }: WithI18n<FieldCreateProps>): Field<F, P, E, K> => {
            const extParams =
                typeof extendedParams === 'function' ? extendedParams(i18n) : extendedParams;
            const staticProps: Partial<FieldComponentProps<F, {}, E, K>> = {
                inputId: generateId(key),
                key,
                path: key,
                label: i18n(label),
                required,
                readOnly,
                autoComplete,
                i18n,
                showLabel,
                ...extParams,
            };

            return {
                key,
                render: ({
                    state: { value, validation },
                    ...props
                }: Partial<P> & { state: FieldValue<F, K, E> }) => (
                    <Component
                        value={value}
                        validation={validation}
                        {...({ ...(staticProps as P), ...props } as P)}
                    />
                ),
                initialize: <M extends Record<PropertyKey, unknown>>(
                    model: M
                ): FieldValue<F, K> => {
                    const modelValue = mapping.bind<M>(model) as T;
                    const initValue = isValued(modelValue, rawProperty) ? modelValue : defaultValue;
                    return {
                        value: format.bind(initValue),
                        isDirty: false,
                    };
                },
                unbind: <M extends Record<PropertyKey, unknown>>(
                    model: M,
                    { value }: FieldValue<F, K, E>
                ): M => mapping.unbind(model, format.unbind(value)) as M,
                validate: async (
                    { value: formValue }: FieldValue<F, K, E>,
                    ctx: FormContext<any>
                ): Promise<ValidatorResult<E>> => {
                    const value = isRichFormValue(formValue, rawProperty)
                        ? formValue[rawProperty]
                        : formValue;
                    const requireValidation = required
                        ? await requiredRule.create(i18n)(value, ctx)
                        : ({ valid: true } as ValidatorSuccess<E>);
                    return isValidatorSuccess(requireValidation) && isValued(value)
                        ? await validator.create(i18n)(value, ctx)
                        : requireValidation;
                },
            };
        },
    };
}
