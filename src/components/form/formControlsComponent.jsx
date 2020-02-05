import React from 'react';

import styled, { css, keyframes } from 'styled-components';
import omit from 'lodash-es/omit';

import { RoundCheckbox } from './roundCheckBox';
import { withTheme } from '../widget/widgetContext';

const errorFadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`

export const FormError = withTheme(styled.div`
    padding-top: 3px;
    animation: ${errorFadeIn} 0.3s both;
    color: ${props => props.theme.get('dangerColor')};
`);

export const Label = withTheme(styled.label`
    color: ${props => props.theme.get('textColor')};
    margin-bottom: ${props => props.theme.get('spacing') / 2}px;
    display: ${props => props.visible ? 'inline-block' : 'none'};
`);

export const FormGroupContainer = withTheme(styled.div`
    margin-bottom: ${props => props.theme.get('spacing')}px;
`);

export const FormGroup = ({
    inputId,
    labelText,
    showLabel,
    error,
    children
}) => <FormGroupContainer>
        <Label visible={showLabel} htmlFor={inputId}>{labelText}</Label>
        {children}
        {error && <FormError>{error}</FormError>}
    </FormGroupContainer>;

const inputMixin = css`
    display: block;
    width: 100%;
    box-sizing: border-box;
    font-size: ${props => props.theme.get('input.fontSize')}px;
    line-height: ${props => props.theme.get('input.lineHeight')};
    color: ${props => props.hasError ? props.theme.get('dangerColor') : props.theme.get('input.color')};
    border-radius: ${props => props.theme.get('input.borderRadius')}px;
    border-width: ${props => props.theme.get('input.borderWidth')}px;
    border-style: solid;
    border-color: ${props => props.hasError ? props.theme.get('dangerColor') : props.theme.get('input.borderColor')};
    background-color: ${props => props.theme.get('input.background')};
    background-image: none;
    padding: ${props => props.theme.get('input.paddingY')}px ${props => props.theme.get('input.paddingX')}px;
    transition:
          border-color ease-in-out .15s,
          box-shadow ease-in-out .15s;
    box-shadow: ${props => props.theme.get('input.boxShadow')};
    -webkit-appearance: none;

    &:focus {
        border-color: ${props => props.hasError ? props.theme.get('dangerColor') : props.theme.get('input.focusBorderColor')};
        box-shadow: ${props => props.theme.get('input.focusBoxShadow')(props.hasError ? props.theme.get('dangerColor') : props.theme.get('input.focusBorderColor'))};
        outline: 0;
    }

    &:disabled, &[readonly] {
        background-color: ${props => props.theme.get('input.disabledBackground')};
    }

    &::placeholder {
        color: ${props => props.theme.get('input.placeholderColor')};
    }
`;

export const Input = withTheme(styled.input`${inputMixin}`);

export const Select = withTheme(styled(({ options, placeholder = '', ...props }) => (
    <select {...omit(props, ['hasError'])}>
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
        calc(100% - 17px) ${props => props.theme.get('input.height') / 2 - 3}px,
        calc(100% - 12px) ${props => props.theme.get('input.height') / 2 - 3}px;
    background-size:
        5px 5px,
        5px 5px;
    background-repeat: no-repeat;
    text-transform: none;
    &:required:invalid {
        color: ${props => props.theme.get('mutedTextColor')};
    }
`);

const checkboxWidth = 20;

export const Check = withTheme(styled(({ checked, onSelect, label, radio, name, className, required }) => (
    <label className={className}>
        <input type={radio ? 'radio' : 'checkbox'}
            checked={checked}
            name={name}
            onChange={onSelect}
            required={required} />
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
            margin-left: ${props.theme.get('spacing')}px;
        }
    `}

    & > input {
        position: absolute;
        margin-left: -${checkboxWidth}px;
        margin-top: 2px;
        line-height: normal;
    }
`);

export const Checkbox = withTheme(styled(({ value, onToggle, label, name, className, error, required }) => (
    <div className={className}>
        <Check checked={value} onSelect={onToggle} label={label} name={name} required={required} />
        {error && <FormError>{error}</FormError>}
    </div>
))`
    margin-bottom: ${props => props.theme.get('spacing')}px;
`);

export const RadioGroup = ({ options, onChange, value, name, ...props }) => (
    <FormGroup {...props}>
        {options.map(({ label: optionLabel, value: optionValue }) => (
            <Check
                checked={value === optionValue}
                onSelect={onChange(optionValue)}
                label={optionLabel}
                name={name}
                inline={true}
                radio />
        ))}
    </FormGroup>
);

const ValidationRule = withTheme(styled.div`
    display: flex;
    margin-bottom: 2px;
`);

export const ValidationRules = props => <div>
    {Object.keys(props.rules).map((key, _) => {
        const rule = props.rules[key];

        return <ValidationRule key={key}>
            <RoundCheckbox checked={rule.verified} />
            <Label visible>{rule.label}.</Label>
        </ValidationRule>
    })}
</div>;
