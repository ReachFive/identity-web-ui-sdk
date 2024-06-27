import { ComponentType } from 'react';

import { WithI18n } from '../../contexts/i18n';
import { I18nResolver } from '../../core/i18n';
import { Validator } from '../../core/validation';
import { PathMapping } from '../../core/mapping';
import { VaildatorResult } from '../../core/validation';
import { FormValue } from '../../helpers/utils';

interface FieldCreateProps {
    showLabel: boolean
}

export interface FieldCreator<T, P extends FieldComponentProps<T> = FieldComponentProps<T>, S = {}> {
    path: string,
    create: (options: WithI18n<FieldCreateProps>) => Field<T, P, S>
}

export interface Field<T, P extends FieldComponentProps<T>, S = {}> {
    key: string
    render: (props: P & { state: S }) => React.ReactNode
    initialize: (model: Record<string, unknown>) => FieldValue<T>
    unbind: <M extends Record<string, unknown>>(model: M, state: P) => M
    validate: (data: P, ctx: { isSubmitted: boolean }) => VaildatorResult
}

export type FieldValue<T> = {
    value: T | null,
    isDirty: boolean
}

export type FieldComponentProps<T, P = {}> = P & {
    inputId: string
    key: string
    path: string
    label: string
    required?: boolean
    readOnly?: boolean
    i18n: I18nResolver
    showLabel?: boolean
    value?: FormValue<T>
    validation?: VaildatorResult
}


export interface Formatter<T, F> {
    bind: (value: T) => FormValue<F>
    unbind: (value?: FormValue<F>) => T | null
}

export interface FieldProps<T, F, P extends FieldComponentProps<F, ExtraParams>, ExtraParams extends Record<string, unknown> = {}> {
    key: string
    path?: string
    type?: string
    label: string
    defaultValue?: F
    required: boolean
    readOnly: boolean
    autoComplete?: AutoFill
    validator?: Validator
    mapping?: PathMapping
    format?: Formatter<T, F>
    rawProperty?: string
    component: ComponentType<P>
    extendedParams?: ExtraParams | ((i18n: I18nResolver) => ExtraParams)
}

export function createField<T, F, P extends FieldComponentProps<F, E>, E extends Record<string, unknown> = {}>(props: FieldProps<T, F, P, E>): FieldCreator<F, P>
