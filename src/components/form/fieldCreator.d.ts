import { ComponentType } from 'react';

import { WithI18n } from '../../contexts/i18n'
import { Validator } from '../../core/validation';
import { PathMapping } from '../../core/mapping';
import { VaildatorResult } from '../../core/validation'
import { FormValue } from '../../helpers/utils';

interface FieldCreateProps {
    showLabel: boolean
}

export interface FieldCreator<T, P = {}, E = {}> {
    path: string,
    create: (options: WithI18n<FieldCreateProps>) => Field<T, P, E>
}

export interface Field<T, P = {}, E = {}> {
    key: string
    render: (props: Partial<P> & Partial<FieldComponentProps<T, P, E>> & { state: FieldValue<T, E> }) => React.ReactNode
    initialize: <M>(model: M) => FieldValue<T, E>
    unbind: <M>(model: M, state: FieldValue<T, E>) => M
    validate: <S extends { isSubmitted: boolean }>(data: FieldValue<T, E>, ctx: S) => VaildatorResult
}

export type FieldValue<T, E = {}> = E & {
    value?: T
    isDirty?: boolean
    validation?: VaildatorResult
}

export type FieldComponentProps<T, P = {}, E = {}, K extends string = 'raw'> = P & {
    inputId: string
    key: string
    path: string
    label: string
    onChange: (value: FieldValue<T, E>) => void
    placeholder?: string
    autoComplete?: AutoFill
    rawProperty?: K
    required?: boolean
    readOnly?: boolean
    i18n: I18nResolver
    showLabel?: boolean
    value?: FormValue<T, K>
    validation?: VaildatorResult
}


export interface Formatter<T, F, K extends string> {
    bind: (value?: T) => FormValue<F, K> | undefined
    unbind: (value?: FormValue<F, K>) => T | null
}

export interface FieldProps<T, F, P extends FieldComponentProps<F, ExtraParams, {}, K>, ExtraParams extends Record<string, unknown> = {}, K extends string = 'raw'> {
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
    format?: Formatter<T, F, K>
    rawProperty?: K
    component: ComponentType<P>
    extendedParams?: ExtraParams | ((i18n: I18nResolver) => ExtraParams)
}

export function createField<T, F, P extends FieldComponentProps<F, ExtraParams, {}, K>, ExtraParams extends Record<string, unknown> = {}, K extends string = 'raw'>(props: FieldProps<T, F, P, ExtraParams, K>): FieldCreator<F, P, ValueExtends>
