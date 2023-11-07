import { BaseOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

export interface Options<T> extends BaseOptions<T> {} 

export default function consentField<T>(options: Options<T>): FieldCreator
