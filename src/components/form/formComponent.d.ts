import type { MouseEvent, ReactNode } from 'react'

import type { WithConfig } from '../../contexts/config'
import type { WithI18n } from '../../contexts/i18n'

import type { AppError } from '../../helpers/errors'

import type { FieldCreator } from './fieldCreator'

export interface PasswordPolicy {
    minLength: number
    minStrength: number
}

export interface FormOptions<P = {}> {
    allowWebAuthnLogin?: boolean
    prefix?: string
    fields?: FieldCreator[] | ((props: WithConfig<WithI18n<P>>) => FieldCreator[])
    resetAfterSuccess?: boolean
    resetAfterError?: boolean
    submitLabel?: string
    supportMultipleSubmits?: boolean
    webAuthnButtons?: (disabled: boolean, clickHandler: (event: MouseEvent) => void) => ReactNode
}

export type WithFormProps<T, P = {}> = P & FormOptions<P> & {
    beforeSubmit?: (data: T) => T
    fieldValidationDebounce?: number
    handler?: (data: T) => Promise<unknown | void>
    initialModel?: T
    onError?: (error: Error | AppError) => void
    onFieldChange?: (data: Record<string, { value?: string }>) => void
    onSuccess?: (result) => void
    redirect?: (data: T) => void
    supportMultipleSubmits?: boolean
    showLabels?: boolean
    sharedProps?: Record<string, unknown>
    skipError?: boolean | ((error: Error) => boolean) | ((error: AppError) => boolean)
}

export function createForm<T = {}, P = {}>(options: FormOptions<P>): React.ComponentType<WithFormProps<T, P>>
