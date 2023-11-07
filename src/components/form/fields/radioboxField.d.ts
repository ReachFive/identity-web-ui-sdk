import { BaseOptions } from './simpleField'
import { RadioGroupProps } from '../formControlsComponent';
import type { FieldCreator } from '../fieldCreator'

interface Option<T> {
    value: T
    label?: string
}

export interface Options<T> extends BaseOptions<T> {
    options: RadioGroupProps['options']
}

export default function radioboxField<T>(options: Options<T>): FieldCreator
