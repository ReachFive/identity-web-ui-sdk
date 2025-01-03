import React from 'react';

import { isLower, isUpper, isDigit } from 'char-info';
import type { PasswordPolicy } from '@reachfive/identity-core'
import zxcvbn from '@reachfive/zxcvbn';
import styled, { DefaultTheme } from 'styled-components';

import type { Config } from '../../../types'

import { Input, Label, FormGroupContainer, FormError } from '../formControlsComponent';
import type { FieldCreator, FieldComponentProps } from '../fieldCreator'
import { PasswordPolicyRules, type PasswordRule, type PasswordStrengthScore } from './passwordPolicyRules';

import { ShowPasswordIcon, HidePasswordIcon } from './simplePasswordField';
import { useI18n } from '../../../contexts/i18n';
import { VaildatorResult } from '../../../core/validation';
import { I18nResolver } from '../../../core/i18n';

import { isEqual } from '../../../helpers/utils';

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

interface PasswordStrengthColorProps {
    theme: DefaultTheme
    score: PasswordStrengthScore
}

const getPasswordStrengthColor = ({ theme, score }: PasswordStrengthColorProps) => theme.passwordStrengthValidator[`color${score}`];

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
    isTouched?: boolean,
}

interface PasswordFieldProps extends FieldComponentProps<string, {}, ExtraValues> {
    blacklist: string[]
    isDirty?: boolean
    isTouched?: boolean
    // onChange: (event: { value?: string, strength?: PasswordStrengthScore, isTouched?: boolean, isDirty?: boolean }) => void
    canShowPassword?: boolean
    enabledRules: Record<RuleKeys, PasswordRule>
    minStrength: PasswordStrengthScore
    strength: PasswordStrengthScore
    value?: string
}

interface PasswordFieldState {
    showPassword: boolean
}

class PasswordField extends React.Component<PasswordFieldProps, PasswordFieldState> {
    protected unmounted = false

    state = {
        showPassword: false
    };

    componentDidUpdate(prevProps: PasswordFieldProps) {
        const blacklistUpdated = isEqual(prevProps.blacklist, this.props.blacklist);
        if (!blacklistUpdated) {
            const { value, onChange, blacklist } = this.props;
            onChange({
                strength: getPasswordStrength(blacklist, value),
                value,
            });
        }
    }

    componentDidMount() {
        const { value, onChange, blacklist } = this.props;
        this.setState({ ...this.state });
        onChange({
            strength: getPasswordStrength(blacklist, value),
            value,
        });
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    toggleShowPassword = () => {
        const showPassword = !this.state.showPassword;
        this.setState({ ...this.state, showPassword });
    }

    render() {
        const {
            autoComplete,
            blacklist = [],
            canShowPassword,
            enabledRules,
            inputId,
            path,
            isTouched,
            label,
            minStrength,
            onChange,
            placeholder,
            required,
            showLabel,
            strength,
            validation = {} as VaildatorResult,
            value = '',
        } = this.props;

        const { showPassword } = this.state;

        return (
            <FormGroupContainer required={required}>
                <Label visible={showLabel} htmlFor={inputId}>
                    {label}
                </Label>
                <div style={{ position: 'relative' }}>
                    <Input
                        id={inputId}
                        name={path}
                        type={showPassword ? 'text' : 'password'}
                        value={value}
                        placeholder={placeholder ?? label}
                        autoComplete={autoComplete}
                        title={label}
                        required={required}
                        hasError={typeof validation === 'object' && 'error' in validation}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange({
                            value: event.target.value,
                            strength: getPasswordStrength(blacklist, event.target.value)
                        })}
                        onFocus={(event) => onChange({
                            value: event.target.value,
                            isTouched: true
                        })}
                        onBlur={(event) => onChange({
                            value: event.target.value,
                            isDirty: true
                        })}
                        data-testid="password"
                    />
                    {canShowPassword && (
                        showPassword
                            ? <HidePasswordIcon data-testid="hide-password-btn" onClick={this.toggleShowPassword} />
                            : <ShowPasswordIcon data-testid="show-password-btn" onClick={this.toggleShowPassword} />
                    )}
                </div>
                {isTouched && <PasswordStrength score={strength || 0} />}
                {typeof validation === 'object' && 'error' in validation && <FormError>{validation.error}</FormError>}
                {isTouched && (
                    <PasswordPolicyRules
                        value={value}
                        strength={strength}
                        minStrength={minStrength}
                        rules={enabledRules}
                    />
                )}
            </FormGroupContainer>
        )
    }
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
    const sanitized = (fieldValue ?? "").toLowerCase().trim();
    return zxcvbn(sanitized, blacklist).score;
}

export const passwordField = (
    { label = 'password', canShowPassword = false, required = true, ...staticProps }: Partial<PasswordFieldProps>,
    { passwordPolicy }: Config
): FieldCreator<string, PasswordFieldProps, ExtraValues> => ({
    path: 'password',
    create: ({ i18n, showLabel }) => {
        const actualLabel = i18n(label);

        return {
            key: 'password',
            render: ({ state, ...props }) => (
                <PasswordField {...state} {...props} {...staticProps}
                    key="password"
                    path="password"
                    inputId="password"
                    showLabel={showLabel}
                    canShowPassword={canShowPassword}
                    label={actualLabel}
                    required={required}
                />
            ),
            initialize: () => ({
                value: '',
                strength: 0,
                enabledRules: listEnabledRules(i18n, passwordPolicy),
                minStrength: passwordPolicy?.minStrength,
                isTouched: false,
                isDirty: false,
                blacklist: [],
            }),
            unbind: (model, { value }) => ({ ...model, password: value }),
            validate: ({ value, strength, isDirty }, ctx) => {
                if (!isDirty && !ctx.isSubmitted) return {} as VaildatorResult;

                const errors = [];
                if (!value) {
                    errors.push(i18n('validation.required'));
                }
                else {
                    if (passwordPolicy && strength && strength < passwordPolicy.minStrength) {
                        errors.push(i18n('validation.password.minStrength'));
                    }

                    if (value.length > MAX_PASSWORD_LENGTH) {
                        errors.push(i18n('validation.password.maxLength', { max: MAX_PASSWORD_LENGTH }));
                    }
                }

                return errors.length == 0 ? {} as VaildatorResult : { error: errors.join(' ') } as VaildatorResult;
            }
        }
    }
});

export default passwordField;
