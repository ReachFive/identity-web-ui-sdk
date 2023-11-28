import React, { PropsWithChildren, ReactNode } from 'react';

import styled, { css, keyframes } from 'styled-components';

const errorFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`

export const FormError = styled.div`
    padding-top: 3px;
    animation: ${errorFadeIn} 0.3s both;
    color: ${props => props.theme.dangerColor};
`;

export const Label = styled.label<{ visible?: boolean }>`
    color: ${props => props.theme.textColor};
    margin-bottom: ${props => props.theme.spacing / 2}px;
    display: ${props => props.visible ? 'inline-block' : 'none'};
`;

export const FormGroupContainer = styled.div`
    margin-bottom: ${props => props.theme.spacing}px;
`;

interface FormGroupProps {
    inputId: string
    labelText: string
    showLabel?: boolean
    error?: string
}

export const FormGroup = ({
    inputId,
    labelText,
    showLabel,
    error,
    children
}: PropsWithChildren<FormGroupProps>) => <FormGroupContainer>
        <Label visible={showLabel} htmlFor={inputId}>{labelText}</Label>
        {children}
        {error && <FormError>{error}</FormError>}
    </FormGroupContainer>;

const inputMixin = css<{ hasError?: boolean }>`
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-size: ${props => props.theme.input.fontSize}px;
    line-height: ${props => props.theme.input.lineHeight};
    color: ${props => props.hasError ? props.theme.dangerColor : props.theme.input.color};
    border-radius: ${props => props.theme.input.borderRadius}px;
    border-width: ${props => props.theme.input.borderWidth}px;
    border-style: solid;
    border-color: ${props => props.hasError ? props.theme.dangerColor : props.theme.input.borderColor};
    background-color: ${props => props.theme.input.background};
    background-image: none;
    padding: ${props => props.theme.input.paddingY}px ${props => props.theme.input.paddingX}px;
    transition:
          border-color ease-in-out .15s,
          box-shadow ease-in-out .15s;
    box-shadow: ${props => props.theme.input.boxShadow};
    -webkit-appearance: none;

    &:focus {
        border-color: ${props => props.hasError ? props.theme.dangerColor : props.theme.input.focusBorderColor};
        box-shadow: ${props => props.theme.input.focusBoxShadow(props.hasError ? props.theme.dangerColor : props.theme.input.focusBorderColor)};
        outline: 0;
    }

    &:disabled, &[readonly] {
        background-color: ${props => props.theme.input.disabledBackground};
    }

    &::placeholder {
        color: ${props => props.theme.input.placeholderColor};
    }
`;

export const Input = styled.input`${inputMixin}`;

interface Option {
    label: string
    value: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    hasError?: boolean
    options: Option[]
}

export const Select = styled(({ options, placeholder = '', ...props }: SelectProps) => (
    <select {...props}>
        <option value="" disabled>{placeholder}</option>
        {options.map(({ label: optionLabel, value: optionValue }) => (
            <option value={optionValue} key={optionValue}>
                {optionLabel}
            </option>
        ))}
    </select>
))`
    ${inputMixin}
    appearance: none;
    background-image:
        linear-gradient(45deg, transparent 50%, gray 50%),
        linear-gradient(135deg, gray 50%, transparent 50%);
    background-position:
        calc(100% - 17px) ${props => props.theme.input.height / 2 - 3}px,
        calc(100% - 12px) ${props => props.theme.input.height / 2 - 3}px;
    background-size:
        5px 5px,
        5px 5px;
    background-repeat: no-repeat;
    text-transform: none;
    &:required:invalid {
        color: ${props => props.theme.mutedTextColor};
    }
`;

const checkboxWidth = 20;

interface CheckProps extends React.InputHTMLAttributes<HTMLInputElement> {
    inline?: boolean
    label?: ReactNode
    radio?: boolean
    dataTestId?: string
}

export const Check = styled(({ checked, onSelect, label, radio, name, className, required, value, dataTestId }: CheckProps) => (
    <label className={className}>
        <input type={radio ? 'radio' : 'checkbox'}
            checked={checked}
            name={name}
            onChange={onSelect}
            style={radio ? {appearance: 'radio'} : undefined}
            required={required}
            value={value}
            data-testid={dataTestId}
        />
        {label}
    </label>
))`
    padding-left: ${checkboxWidth}px;
    margin-bottom: 0;
    cursor: pointer;
    font-weight: normal;

    ${props => props.inline && `
        position: relative;
        vertical-align: middle;
        display: inline-block;

        & + & {
            margin-left: ${props.theme.spacing}px;
        }
    `}

    & > input {
        position: absolute;
        margin-left: -${checkboxWidth}px;
        margin-top: 2px;
        line-height: normal;
    }
`;

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: ReactNode
    label?: ReactNode
    onToggle?: () => void
    radio?: boolean
    dataTestId?: string
}

export const Checkbox = styled(({ value, onToggle, label, name, className, error, required, dataTestId }: CheckboxProps) => (
    <div className={className}>
        <Check checked={!!value} onSelect={onToggle} label={label} name={name} required={required} dataTestId={dataTestId} />
        {error && <FormError>{error}</FormError>}
    </div>
))`
    margin-bottom: ${props => props.theme.spacing}px;
`;

export interface RadioGroupProps extends FormGroupProps {
    options: (CheckProps & { key: string } )[]
    onChange: (event: { value: HTMLInputElement['value'] }) => void
    value?: HTMLInputElement['value']
    dataTestId?: string
}

export const RadioGroup = ({ options, onChange, value, inputId, ...props }: RadioGroupProps) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({value: event.target.value})
    };
    return (
        <FormGroup inputId={inputId} {...props}>
            {options.map(({label: optionLabel, value: optionValue, key: optionKey}) => (
                <Check
                    key={optionKey}
                    checked={value === optionValue}
                    onSelect={handleChange}
                    label={optionLabel}
                    name={optionKey}
                    inline={true}
                    value={optionValue}
                    radio/>
            ))}
        </FormGroup>
    );
}
export const UserAggreementStyle = styled.div`
    font-size: ${props => props.theme.fontSize * 0.8}px;
    color: ${props => props.theme.mutedTextColor};
    text-align: center;
    margin-bottom: ${props => props.theme.spacing}px;

    p {
        margin: 0;
    }

    a {
        color: ${props => props.theme.mutedTextColor};
        text-decoration: underline;
    }

    a:hover {
        color: ${props => props.theme.mutedTextColor};
    }
`;
