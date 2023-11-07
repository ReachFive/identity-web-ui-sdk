import type { Config } from '../../../types'
import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options<T> extends BaseOptions<T> {
    withPhoneNumber?: boolean
}

export default function identifierField<T>(options: Options<T>, config?: Config): FieldCreator
