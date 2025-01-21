import React, { useState } from 'react';

import styled from 'styled-components';

import { createField, type FieldComponentProps, type FieldDefinition } from '../fieldCreator'
import { FormGroup, Input } from '../formControlsComponent';

import { ReactComponent as EyeIcon } from '../../../icons/eye.svg';
import { ReactComponent as EyeSlashIcon } from '../../../icons/eye-slash.svg';
import { isRichFormValue } from '../../../helpers/utils';

const eyeStyle = `
  position: absolute;
  top: 13px;
  right: 10px;
  cursor: pointer;
  opacity: 0.6;
  fill: #495057;
  width: 14px;
  height: 14px;
`

export const ShowPasswordIcon = styled(EyeIcon)`${eyeStyle}`;

export const HidePasswordIcon = styled(EyeSlashIcon)`${eyeStyle}`;

type SimplePasswordFieldOptions = {
    canShowPassword?: boolean
    placeholder?: React.InputHTMLAttributes<HTMLInputElement>['placeholder']
}

export interface SimplePasswordFieldProps extends FieldComponentProps<string, SimplePasswordFieldOptions> {}

function SimplePasswordField({
    autoComplete,
    canShowPassword,
    path,
    validation = {},
    onChange,
    inputId,
    label,
    placeholder,
    required,
    showLabel,
    value
}: SimplePasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value

    const toggleShowPassword = () => setShowPassword(showPassword => !showPassword)

    const error = typeof validation === 'object' && 'error' in validation ? validation.error : undefined

    return <FormGroup
        inputId={inputId}
        labelText={label}
        {...{ error }}
        showLabel={showLabel}
        required={required}
    >
        <div style={{ position: 'relative' }}>
            <Input
                id={inputId}
                name={path}
                type={showPassword ? 'text' : 'password'}
                value={currentValue ?? ''}
                placeholder={placeholder ?? label}
                autoComplete={autoComplete}
                title={label}
                required={required}
                hasError={!!error}
                onChange={event => onChange({ value: event.target.value })}
                onBlur={() => onChange({ isDirty: true })}
                data-testid={path}
            />
            {canShowPassword && (
                showPassword
                    ? <HidePasswordIcon data-testid="hide-password-btn" onClick={toggleShowPassword} />
                    : <ShowPasswordIcon data-testid="show-password-btn" onClick={toggleShowPassword} />
            )}
        </div>
    </FormGroup>;
}

export const simplePasswordField = ({
    canShowPassword = false,
    placeholder,
    ...props
}: FieldDefinition<string> & SimplePasswordFieldOptions) => {
    return createField<string, string, SimplePasswordFieldProps>({
        ...props,
        component: SimplePasswordField,
        extendedParams: {
            placeholder,
            canShowPassword
        }
    })
}

export default simplePasswordField;
