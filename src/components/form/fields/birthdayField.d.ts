import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options extends BaseOptions<string> {} 

export default function birthdateField(options: Options): FieldCreator
