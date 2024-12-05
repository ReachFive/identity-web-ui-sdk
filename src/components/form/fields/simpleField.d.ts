import { Validator } from '../../../core/validation'
import type { FieldCreator, Formatter } from '../fieldCreator'
import { FormContext } from '../formComponent'

interface Mapping<T> {
    bind: () => undefined,
    unbind: (value: string) => T
}

export interface BaseOptions<T> {
    key?: string
    label?: string
    defaultValue?: T
    required?: boolean
    autoComplete?: HTMLInputElement['autocomplete']
    placeholder?: string
    readOnly?: boolean
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    validator?: Validator<T, FormContext<any>>
    format?: Formatter<T>
    mapping?: Mapping
}

export interface Options<T> extends BaseOptions<T> {
    type: HTMLInputElement['type']
}

export function simpleField<T>(options: Options<T>): FieldCreator
