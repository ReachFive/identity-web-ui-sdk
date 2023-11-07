import type { Config } from '../../../types'
import { BaseOptions } from './simpleField'

export interface Options extends BaseOptions {} 

export default function phoneNumberField(options: Options, config: Config): FieldCreator
