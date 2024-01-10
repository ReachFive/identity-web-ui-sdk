import type { StyledComponent } from 'styled-components'

import type { Options as SimpleFieldOptions } from './simpleField'
import type { FieldCreator } from '../fieldCreator'

interface Options<T> extends Omit<SimpleFieldOptions<T>, 'type'> {
    canShowPassword?: boolean
}

export default function simplePasswordField<T>(options: Options<T>): FieldCreator

export const ShowPasswordIcon: StyledComponent
export const HidePasswordIcon: StyledComponent
