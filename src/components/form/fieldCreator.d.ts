import { ComponentType } from 'react';

import { WithI18n } from '../../contexts/i18n'
import { Validator } from '../../core/validation';
import { PathMapping } from '../../core/mapping';
import { VaildatorResult } from '../../core/validation'
import { FormValue } from '../../helpers/utils';
import { Prettify } from '../../types';

interface FieldCreateProps {
    showLabel: boolean
}

export interface FieldCreator<T, P = {}, E = {}> {
    path: string,
    create: (options: WithI18n<FieldCreateProps>) => Field<T, P, E>
}

export interface Field<T, P = {}, E = {}> {
    key: string
    render: (props: Partial<P> & Partial<FieldComponentProps<T>> & { state: FieldValue<T, E> }) => React.ReactNode
    initialize: <M>(model: M) => FieldValue<T, E>
    unbind: <M>(model: M, state: FieldValue<T, E>) => M
    validate: <S extends { isSubmitted: boolean }>(data: FieldValue<T, E>, ctx: S) => VaildatorResult
}

export type FieldValue<T, E = {}> = E & {
    value?: T
    isDirty?: boolean
    validation?: VaildatorResult
}

export type FieldComponentProps<T, P = {}, E = {}> = P & {
    inputId: string
    key: string
    path: string
    label: string
    onChange: (value: FieldValue<T, E>) => void
    placeholder?: string
    autoComplete?: AutoFill
    required?: boolean
    readOnly?: boolean
    i18n: I18nResolver
    showLabel?: boolean
    value?: FormValue<T>
    validation?: VaildatorResult
}


export interface Formatter<T, F> {
    bind: (value?: T) => FormValue<F> | undefined
    unbind: (value?: FormValue<F>) => T | null
}

export interface FieldProps<T, F, P extends FieldComponentProps<F, ExtraParams>, ExtraParams extends Record<string, unknown> = {}> {
    key: string
    path?: string
    type?: string
    label: string
    defaultValue?: T
    required?: boolean
    readOnly?: boolean
    autoComplete?: AutoFill
    validator?: Validator
    mapping?: PathMapping
    format?: Formatter<T, F>
    rawProperty?: string
    component: ComponentType<P>
    extendedParams?: Prettify<Omit<P, keyof FieldComponentProps<F, ExtraParams>>> | ((i18n: I18nResolver) => Prettify<Omit<P, keyof FieldComponentProps<F, ExtraParams>>>)
}

export function createField<T, F, P extends FieldComponentProps<F, ExtraParams>, ExtraParams extends Record<string, unknown> = {}>(props: FieldProps<T, F, P, ExtraParams>): FieldCreator<F, P, ValueExtends>
