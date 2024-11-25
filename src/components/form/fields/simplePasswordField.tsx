import React from 'react';

import styled from 'styled-components';

import { createField } from '../fieldCreator'
import { FormGroup, Input } from '../formControlsComponent';

import { ReactComponent as EyeIcon } from '../../../icons/eye.svg';
import { ReactComponent as EyeSlashIcon } from '../../../icons/eye-slash.svg';

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

class SimplePasswordField extends React.Component {
    state = { showPassword: false };

    render() {
        const {
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
        } = this.props;

        const { showPassword } = this.state;

        return <FormGroup
            inputId={inputId}
            labelText={label}
            {...(({ error }) => ({ error }))(validation)}
            showLabel={showLabel}
            required={required}
        >
            <div style={{ position: 'relative' }}>
                <Input
                    id={inputId}
                    name={path}
                    type={showPassword ? 'text' : 'password'}
                    value={value || ''}
                    placeholder={placeholder || label}
                    autoComplete={autoComplete}
                    title={label}
                    required={required}
                    hasError={Boolean(validation.error)}
                    onChange={event => onChange({ value: event.target.value })}
                    onBlur={() => onChange({ isDirty: true })}
                    data-testid={path} />
                {canShowPassword && (
                    showPassword
                        ? <HidePasswordIcon onClick={this.toggleShowPassword} />
                        : <ShowPasswordIcon onClick={this.toggleShowPassword} />)}
            </div>
        </FormGroup>;
    }

    toggleShowPassword = () => {
        const showPassword = !this.state.showPassword;
        this.setState({ ...this.state, showPassword });
    }
}

export const simplePasswordField = ({ placeholder, canShowPassword = false, ...config }) => createField({
    ...config,
    component: SimplePasswordField,
    extendedParams: {
        placeholder,
        canShowPassword
    }
});

export default simplePasswordField;
