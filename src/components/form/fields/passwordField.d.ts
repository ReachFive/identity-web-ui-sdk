import type { Config } from '../../../types'
import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options extends BaseOptions<string> {
    canShowPassword?: boolean
}

export default function passwordField(options: Options, config?: Config): FieldCreator
