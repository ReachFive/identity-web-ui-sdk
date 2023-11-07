import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

interface SelectOption<T> {
    value: T
    label?: string
}

export interface Options<T> extends BaseOptions<T> {
    values: SelectOption[]
}

export function selectField<T>(options: Options<T>): FieldCreator
