import type { Config } from '../../types'
import { FieldCreator } from './fieldCreator'

/** The field's representation. */
export type Field = {
   key: string
   label?: string
   required?: boolean
   type?: 'hidden' | 'text' | 'number' | 'email' | 'tel'
}

type LabelTranslation = {
    label: string
    langCode: string
}

type SelectableValue = {
    value: string
    label: string
    translations: LabelTranslation[]
}

export type CustomField = {
    dataType: 'number' | 'decimal' | 'integer' | 'string' | 'date' | 'checkbox' | 'select' | 'tags' | 'object' | 'phone' | 'email'
    id: string
    name: string
    nameTranslations?: LabelTranslation[]
    path: string
    selectableValues?: SelectableValue[]
}

export function buildFormFields(
    fields: (string | Field)[] = [],
    config: Config & { canShowPassword?: boolean, errorArchivedConsents?: boolean }
): FieldCreator[]

export function computeFieldList(fields: FieldCreator[]): string
