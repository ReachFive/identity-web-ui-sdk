import React, { useState } from 'react';

import { isLower, isUpper, isDigit } from 'char-info';
import type { PasswordPolicy } from '@reachfive/identity-core'
import zxcvbn from '@reachfive/zxcvbn';
import styled, { DefaultTheme } from 'styled-components';

import type { Config } from '../../../types'

import { Input, Label, FormGroupContainer, FormError } from '../formControlsComponent';
import type { FieldCreator, FieldComponentProps, FieldProps } from '../fieldCreator'
import { PasswordPolicyRules, type PasswordRule, type PasswordStrengthScore } from './passwordPolicyRules';

import { ShowPasswordIcon, HidePasswordIcon } from './simplePasswordField';
import { useI18n } from '../../../contexts/i18n';
import { VaildatorResult, Validator } from '../../../core/validation';
import { I18nResolver } from '../../../core/i18n';

import { createField } from '../fieldCreator';
import { isRichFormValue } from '../../../helpers/utils';

const SPECIAL_CHARACTERS = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
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

interface getPasswordStrengthColor {
    theme: DefaultTheme
    score: PasswordStrengthScore
}

const getPasswordStrengthColor = ({ theme, score }: getPasswordStrengthColor) => theme.passwordStrengthValidator[`color${score}`];

const PasswordStrengthLabel = styled.div`
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
    transition: width 300ms ease-out, background-color 300ms linear;
`;

interface PasswordStrength {
    score: PasswordStrengthScore
}

const PasswordStrength = ({ score }: PasswordStrength) => {
    const i18n = useI18n()
    return (
        <PasswordStrengthContainer data-testid="password-strength">
            <PasswordStrengthGaugeContainer>
                <PasswordStrengthGauge score={score} />
            </PasswordStrengthGaugeContainer>
            <PasswordStrengthLabel score={score}>
                {i18n('passwordStrength.score' + score)}
            </PasswordStrengthLabel>
        </PasswordStrengthContainer>
    )
}

type ExtraValues = {
    strength?: PasswordStrengthScore,
}

type ExtraParams = {
    blacklist: string[]
    canShowPassword?: boolean
    enabledRules: Record<RuleKeys, PasswordRule>
    minStrength: PasswordStrengthScore
}

interface PasswordFieldProps extends FieldComponentProps<string, ExtraParams, ExtraValues> {}

function PasswordField({
    autoComplete,
    blacklist = [],
    canShowPassword,
    enabledRules,
    inputId,
    label,
    minStrength,
    onChange,
    placeholder,
    required,
    showLabel,
    validation = {} as VaildatorResult,
    value = '',
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false)

    const [isTouched, setIsTouched] = useState(false)

    const currentValue = isRichFormValue(value, 'raw') ? value.raw : value
    
    const strength = getPasswordStrength(blacklist, currentValue)

    const toggleShowPassword = () => {
        setShowPassword(showPassword => !showPassword)
    }

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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        onChange({
                            value: event.target.value,
                            strength: getPasswordStrength(blacklist, event.target.value)
                        })
                    }}
                    onFocus={() => setIsTouched(true)}
                    onBlur={(event) => onChange({
                        value: event.target.value,
                        isDirty: true
                    })}
                    data-testid="password"
                />
                {canShowPassword && (
                    showPassword
                        ? <HidePasswordIcon data-testid="hide-password-btn" onClick={toggleShowPassword} />
                        : <ShowPasswordIcon data-testid="show-password-btn" onClick={toggleShowPassword} />
                )}
            </div>
            {isTouched && <PasswordStrength score={strength || 0} />}
            {typeof validation === 'object' && 'error' in validation && <FormError data-testid="error">{validation.error}</FormError>}
            {isTouched && (
                <PasswordPolicyRules
                    value={currentValue}
                    strength={strength}
                    minStrength={minStrength}
                    rules={enabledRules}
                />
            )}
        </FormGroupContainer>
    )
}

type RuleKeys = Exclude<keyof PasswordPolicy, 'minStrength' | 'allowUpdateWithAccessTokenOnly'>

function listEnabledRules(i18n: I18nResolver, passwordPolicy: Config['passwordPolicy']): Record<RuleKeys, PasswordRule> {
    if (!passwordPolicy) return {} as Record<RuleKeys, PasswordRule>;

    const rules: Record<RuleKeys, PasswordRule> = {
        minLength: {
            label: i18n('validation.password.minLength', { min: passwordPolicy.minLength }),
            verify: (password: string) => password.length >= passwordPolicy.minLength
        },
        specialCharacters: {
            label: i18n('validation.password.specials.characters'),
            verify: (password: string) => Array.from(password).some(c => SPECIAL_CHARACTERS.includes(c))
        },
        lowercaseCharacters: {
            label: i18n('validation.password.specials.lowercase'),
            verify: (password: string) => Array.from(password).some(c => isLower(c))
        },
        uppercaseCharacters: {
            label: i18n('validation.password.specials.uppercase'),
            verify: (password: string) => Array.from(password).some(c => isUpper(c))
        },
        digitCharacters: {
            label: i18n('validation.password.specials.digit'),
            verify: (password: string) => Array.from(password).some(c => isDigit(c))
        }
    };

    return Object.keys(rules).reduce<Record<RuleKeys, PasswordRule>>((enabledRules, key) => {
        if (key in passwordPolicy && passwordPolicy[key as RuleKeys]) enabledRules[key as RuleKeys] = rules[key as RuleKeys];
        return enabledRules;
    }, {} as Record<RuleKeys, PasswordRule>);
}

export function getPasswordStrength(blacklist: string[], fieldValue?: string) {
    const sanitized = `${fieldValue ?? ""}`.toLowerCase().trim();
    return zxcvbn(sanitized, blacklist).score;
}

export function passwordStrengthValidator(passwordPolicy?: PasswordPolicy, blacklist: string[] = []) {
    return new Validator<string>({
        rule: (value) => {
            const strength = getPasswordStrength(blacklist, value)
            if (passwordPolicy && strength < passwordPolicy.minStrength) return false
            return true
        },
        hint: 'password.minStrength'
    })
}

export const passwordLengthValidator = new Validator<string>({
    rule: (value) => {
        if (value.length > MAX_PASSWORD_LENGTH) return false
        return true
    },
    hint: 'password.maxLength',
    parameters: { max: MAX_PASSWORD_LENGTH }
})

function passwordValidatorChain(passwordPolicy?: PasswordPolicy) {
    return passwordLengthValidator.and(passwordStrengthValidator(passwordPolicy))
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
    }: Partial<Omit<FieldProps<string, string, PasswordFieldProps, ExtraParams>, 'extendedParams'> & ExtraParams>,
    { passwordPolicy }: Config
): FieldCreator<string, PasswordFieldProps, ExtraParams> =>
    createField<string, string, PasswordFieldProps, ExtraParams>({
        key,
        label,
        required,
        ...props,
        component: PasswordField,
        extendedParams: (i18n) => ({
            blacklist,
            canShowPassword,
            enabledRules: enabledRules ?? listEnabledRules(i18n, passwordPolicy),
            /** 
             * @toto `passwordPolicy` should always be define. Remove default value when correction PR is merged.
             * @see https://github.com/ReachFive/identity-web-core-sdk/pull/239
             * */
            minStrength: minStrength ?? passwordPolicy?.minStrength ?? 2,
        }),
        validator: validator ? validator.and(passwordValidatorChain(passwordPolicy)) : passwordValidatorChain(passwordPolicy)
    })

export default passwordField;
