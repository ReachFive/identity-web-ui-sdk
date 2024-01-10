import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options extends BaseOptions<string> {} 

export default function dateField(options: Options): FieldCreator
