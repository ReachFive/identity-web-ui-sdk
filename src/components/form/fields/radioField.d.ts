import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options<T> extends BaseOptions<T> {} 

export default function radioField<T>(options: Options<T>): FieldCreator
