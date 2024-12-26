
import { DateTime } from 'luxon';

import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'
import { Config } from '../../../types'

export interface Options extends BaseOptions<string> {
    validator?: Validator<DateTime, FormContext<unknown>>
    yearDebounce?: number
} 

export default function dateField(options: Options, config: Config): FieldCreator
