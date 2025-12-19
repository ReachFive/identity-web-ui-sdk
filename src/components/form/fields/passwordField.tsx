import React, { useEffect, useState } from 'react';

import { isDigit, isLower, isUpper } from 'char-info';
import { TFunction } from 'i18next';
import styled, { DefaultTheme } from 'styled-components';

import type { PasswordPolicy, PasswordStrengthScore } from '@reachfive/identity-core';

import { useI18n } from '../../../contexts/i18n';
import { Validator, isValidatorError } from '../../../core/validation';
import { isRichFormValue } from '../../../helpers/utils';
import { createField } from '../fieldCreator';
import { FormContext } from '../formComponent';
import { FormError, FormGroupContainer, Input, Label } from '../formControlsComponent';
import { PasswordPolicyRules, type PasswordRule } from './passwordPolicyRules';
import { HidePasswordIcon, ShowPasswordIcon } from './simplePasswordField';

import type { Config, Optional } from '../../../types';
import type { FieldComponentProps, FieldCreator, FieldDefinition } from '../fieldCreator';

const SPECIAL_CHARACTERS = ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
const MAX_PASSWORD_LENGTH = 255;

const PasswordStrengthContainer = styled.div`
    margin-top: ${props => props.theme.spacing / 2}px;
`;

const PasswordStrengthGaugeContainer = styled.div`
    position: relative;
    height: 8px;
    border-radius: ${props => props.theme.borderRadius}px;
    background-color: ${props => props.theme.lightBackgroundColor};
`;

interface PasswordStrengthColorProps {
    theme: DefaultTheme;
    score: PasswordStrengthScore;
}

const getPasswordStrengthColor = ({ theme, score }: PasswordStrengthColorProps) =>
    theme.passwordStrengthValidator[`color${score}`];

const PasswordStrengthLabel = styled.div<{ score: PasswordStrengthScore }>`
    text-align: right;
    color: ${getPasswordStrengthColor};
    font-weight: bold;
`;

const PasswordStrengthGauge = styled.div<{ score: PasswordStrengthScore }>`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background-color: ${getPasswordStrengthColor};
    width: ${props => props.score * 25}%;
    border-radius: ${props => props.theme.borderRadius}px;
    transition:
        width 300ms ease-out,
        background-color 300ms linear;
`;

interface PasswordStrength {
    score: PasswordStrengthScore;
}

const PasswordStrength = ({ score }: PasswordStrength) => {
    const i18n = useI18n();
    return (
        <PasswordStrengthContainer data-testid="password-strength">
            <PasswordStrengthGaugeContainer>
                <PasswordStrengthGauge score={score} />
            </PasswordStrengthGaugeContainer>
            <PasswordStrengthLabel score={score}>
                {i18n(`passwordStrength.score${score}`)}
            </PasswordStrengthLabel>
        </PasswordStrengthContainer>
    );
};

type ExtraValues = {
    strength?: PasswordStrengthScore;
};

type ExtraParams = {
    blacklist?: string[];
    canShowPassword?: boolean;
    enabledRules: Record<RuleKeys, PasswordRule>;
    minStrength: PasswordStrengthScore;
};

export interface PasswordFieldProps extends FieldComponentProps<string, ExtraParams, ExtraValues> {}

function PasswordField({
    autoComplete,
    blacklist: _ = [],
    canShowPassword,
    enabledRules,
    inputId,
    label,
    minStrength,
    onChange,
    placeholder,
    required,
    showLabel,
    validation,
    value = '',
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [isTouched, setIsTouched] = useState(false);
    const [strength, setStrength] = useState<PasswordStrengthScore>(validation?.strength ?? 0);

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value;

    useEffect(() => {
        // only update strength if defined in validation to avoid strength to be reset on field change event
        if (validation?.strength) {
            setStrength(validation.strength);
        }
    }, [validation]);

    const toggleShowPassword = () => {
        setShowPassword(showPassword => !showPassword);
    };

    return (
        <FormGroupContainer required={required}>
            <Label visible={showLabel} htmlFor={inputId}>
                {label}
            </Label>
            <div style={{ position: 'relative' }}>
                <Input
                    id={inputId}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={currentValue}
                    placeholder={placeholder ?? label}
                    autoComplete={autoComplete}
                    title={label}
                    required={required}
                    hasError={typeof validation === 'object' && 'error' in validation}
                    onChange={event => {
                        onChange({
                            value: event.target.value,
                        });
                    }}
                    onFocus={() => setIsTouched(true)}
                    onBlur={event => {
                        if (event?.target.value !== currentValue) {
                            onChange({
                                value: event?.target.value,
                                validation,
                                isDirty: true,
                            });
                        }
                    }}
                    data-testid="password"
                />
                {canShowPassword &&
                    (showPassword ? (
                        <HidePasswordIcon
                            data-testid="hide-password-btn"
                            onClick={toggleShowPassword}
                        />
                    ) : (
                        <ShowPasswordIcon
                            data-testid="show-password-btn"
                            onClick={toggleShowPassword}
                        />
                    ))}
            </div>
            {isTouched && <PasswordStrength score={strength} />}
            {validation && isValidatorError(validation) && (
                <FormError data-testid="error">{validation.error}</FormError>
            )}
            {isTouched && (
                <PasswordPolicyRules
                    value={currentValue}
                    strength={strength}
                    minStrength={minStrength}
                    rules={enabledRules}
                />
            )}
        </FormGroupContainer>
    );
}

type RuleKeys = Exclude<keyof PasswordPolicy, 'minStrength' | 'allowUpdateWithAccessTokenOnly'>;

export function listEnabledRules(
    i18n: TFunction,
    passwordPolicy: Config['passwordPolicy']
): Record<RuleKeys, PasswordRule> {
    if (!passwordPolicy) return {} as Record<RuleKeys, PasswordRule>;

    const rules: Record<RuleKeys, PasswordRule> = {
        minLength: {
            label: i18n('validation.password.minLength', { min: passwordPolicy.minLength }),
            verify: (password: string) => password.length >= passwordPolicy.minLength,
        },
        specialCharacters: {
            label: i18n('validation.password.specials.characters'),
            verify: (password: string) =>
                Array.from(password).some(c => SPECIAL_CHARACTERS.includes(c)),
        },
        lowercaseCharacters: {
            label: i18n('validation.password.specials.lowercase'),
            verify: (password: string) => Array.from(password).some(c => isLower(c)),
        },
        uppercaseCharacters: {
            label: i18n('validation.password.specials.uppercase'),
            verify: (password: string) => Array.from(password).some(c => isUpper(c)),
        },
        digitCharacters: {
            label: i18n('validation.password.specials.digit'),
            verify: (password: string) => Array.from(password).some(c => isDigit(c)),
        },
    };

    return Object.keys(rules).reduce<Record<RuleKeys, PasswordRule>>(
        (enabledRules, key) => {
            if (key in passwordPolicy && passwordPolicy[key as RuleKeys])
                enabledRules[key as RuleKeys] = rules[key as RuleKeys];
            return enabledRules;
        },
        {} as Record<RuleKeys, PasswordRule>
    );
}

export function passwordStrengthValidator(passwordPolicy?: PasswordPolicy) {
    return new Validator<string, unknown>({
        rule: async (value, ctx) => {
            if (value.length === 0) return false;
            const strength = await (ctx as FormContext<unknown>).client.getPasswordStrength(value);
            if (passwordPolicy && strength.score < passwordPolicy.minStrength) {
                return { valid: false, strength: strength.score };
            }
            return { valid: true, strength: strength.score };
        },
        hint: 'password.minStrength',
    });
}

export const passwordLengthValidator = new Validator<string, unknown>({
    rule: value => {
        if (value.length > MAX_PASSWORD_LENGTH) return false;
        return true;
    },
    hint: 'password.maxLength',
    parameters: { max: MAX_PASSWORD_LENGTH },
});

function passwordValidatorChain(passwordPolicy?: PasswordPolicy) {
    return passwordLengthValidator.and(passwordStrengthValidator(passwordPolicy));
}

export const passwordField = (
    {
        key = 'password',
        label = 'password',
        blacklist = [],
        canShowPassword = false,
        enabledRules,
        minStrength,
        required = true,
        validator,
        ...props
    }: Optional<FieldDefinition<string, string>, 'key' | 'label'> & Partial<ExtraParams>,
    { passwordPolicy }: Config
): FieldCreator<string, PasswordFieldProps, ExtraParams> =>
    createField<string, string, PasswordFieldProps, ExtraParams>({
        key,
        label,
        required,
        ...props,
        component: PasswordField,
        extendedParams: i18n => ({
            blacklist,
            canShowPassword,
            enabledRules: enabledRules ?? listEnabledRules(i18n, passwordPolicy),
            minStrength: minStrength ?? passwordPolicy.minStrength,
        }),
        validator: validator
            ? validator.and(passwordValidatorChain(passwordPolicy))
            : passwordValidatorChain(passwordPolicy),
    });

export default passwordField;
