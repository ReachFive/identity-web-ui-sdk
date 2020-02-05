import React from 'react';

import { isLower, isUpper, isDigit } from 'char-info';
import zxcvbn from '@reachfive/zxcvbn';

import styled from 'styled-components';

import { Input, Label, FormGroupContainer, FormError, ValidationRules } from '../formControlsComponent';
import { withI18n, withTheme } from '../../widget/widgetContext';

import { ShowPasswordIcon, HidePasswordIcon } from './simplePasswordField';

const PasswordStrengthGaugeContainer = withTheme(styled.div`
    position: relative;
    height: 8px;
    border-radius: ${props => props.theme.get('borderRadius')}px;
    background-color: ${props => props.theme.get('lightBackgroundColor')};
`);

const getPasswordStrengthColor = ({ theme, score }) => theme.get('passwordStrengthValidator.color' + score);

const PasswordStrengthLabel = withTheme(styled.div`
    text-align: right;
    color: ${getPasswordStrengthColor};
    font-weight: bold;
`);

const PasswordStrengthGauge = withTheme(styled.div`
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    background-color: ${getPasswordStrengthColor};
    width: ${props => props.score * 25}%;
    border-radius: ${props => props.theme.get('borderRadius')}px;
    transition: width 300ms ease-out, background-color 300ms linear;
`);

const MAX_PASSWORD_LENGTH = 255;

const PasswordStrength = withI18n(withTheme(({ score, theme, i18n }) => (
    <div style={{ marginTop: `${theme.get('spacing') / 2}px` }}>
        <PasswordStrengthGaugeContainer>
            <PasswordStrengthGauge score={score} />
        </PasswordStrengthGaugeContainer>
        <PasswordStrengthLabel score={score}>
            {i18n('passwordStrength.score' + score)}
        </PasswordStrengthLabel>
    </div>
)));

class PasswordField extends React.Component {
    state = {
        showPassword: false
    };

    componentDidMount() {
        const { value, onChange } = this.props;

        this.setState({ ...this.state });
        onChange({ strength: zxcvbn(value).score });
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
            validation = {},
            onChange,
            inputId,
            label,
        } = this.props;

        const { showPassword } = this.state;

        return <FormGroupContainer>
            <div style={{ position: 'relative' }}>
                <Label visible={this.props.showLabel} htmlFor={inputId}>
                    {label}
                </Label>
                <div style={{ position: 'relative' }}>
                    <Input
                        id={inputId}
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={this.props.value || ''}
                        placeholder={this.props.placeholder || label}
                        autoComplete={this.props.autoComplete}
                        title={label}
                        required={this.props.required}
                        hasError={Boolean(validation.error)}
                        onChange={event => onChange({
                            value: event.target.value,
                            strength: zxcvbn(event.target.value).score
                        })}
                        onFocus={() => onChange({ isTouched: true })}
                        onBlur={() => onChange({ isDirty: true })}
                        data-testid="password" />
                    {this.props.canShowPassword && (showPassword
                        ? <HidePasswordIcon onClick={this.toggleShowPassword} />
                        : <ShowPasswordIcon onClick={this.toggleShowPassword} />)}
                </div>
                {this.props.isTouched && <PasswordStrength score={this.props.strength || 0} />}
                {validation.error && <FormError>{validation.errors}</FormError>}
                {validation.rules && <ValidationRules rules={validation.rules}></ValidationRules>}
            </div>
        </FormGroupContainer>;
    }
}

function checkSpecialsCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.specialCharacters) {
        const SPECIAL_CHARACTERS = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
        const passwordChars = Array.from(password)
        return !passwordChars.find(c => SPECIAL_CHARACTERS.includes(c))
    } else {
        return false
    }
}

function checkLowercaseCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.lowercaseCharacters) {
        return !Array.from(password).find(c => isLower(c))
    } else {
        return false
    }
}

function checkUppercaseCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.uppercaseCharacters) {
        return !Array.from(password).find(c => isUpper(c))
    } else {
        return false
    }
}

function checkDigitCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.digitCharacters) {
        return !Array.from(password).find(c => isDigit(c))
    } else {
        return false
    }
}

export const passwordField = ({ label = 'password', canShowPassword = false, ...staticProps }, { passwordPolicy }) => ({
    path: 'password',
    create: ({ i18n, showLabel }) => {
        const actualLabel = i18n(label);

        return {
            key: 'password',
            render: ({ state, ...props }) => (
                <PasswordField {...state} {...props} {...staticProps}
                    key="password"
                    showLabel={showLabel}
                    canShowPassword={canShowPassword}
                    label={actualLabel} />
            ),
            initialize: () => ({
                value: '',
                strength: 0,
                isTouched: false,
                isDirty: false
            }),
            unbind: (model, { value }) => ({ ...model, password: value }),
            validate: ({ value, strength, isDirty }, ctx) => {
                if (!isDirty && !ctx.isSubmitted) return {};

                if (!value) {
                    return { error: i18n('validation.required') };
                }

                const rules = {
                    specialsCharacters: {
                        label: i18n('validation.password.specials.characters'),
                        verified: true
                    },
                    specialsLowercase: {
                        label: i18n('validation.password.specials.lowercase'),
                        verified: true
                    },
                    specialsUppercase: {
                        label: i18n('validation.password.specials.uppercase'),
                        verified: true
                    },
                    specialsDigit: {
                        label: i18n('validation.password.specials.digit'),
                        verified: true
                    }
                };

                // if (value.length < passwordPolicy.minLength) {
                //     errors.push(i18n('validation.password.minLength', { min: passwordPolicy.minLength }));
                // }
                // if (value.length > MAX_PASSWORD_LENGTH) {
                //     errors.push(i18n('validation.password.maxLength', { max: MAX_PASSWORD_LENGTH }));
                // }
                // if (strength < passwordPolicy.minStrength) {
                //     errors.push(i18n('validation.password.minStrength'));
                // }
                if (checkSpecialsCharacters(value, passwordPolicy)) {
                    rules.specialsCharacters.verified = false;
                }
                if (checkLowercaseCharacters(value, passwordPolicy)) {
                    rules.specialsLowercase.verified = false;
                }
                if (checkUppercaseCharacters(value, passwordPolicy)) {
                    rules.specialsUppercase.verified = false;
                }
                if (checkDigitCharacters(value, passwordPolicy)) {
                    rules.specialsDigit.verified = false;
                }
                return { rules };
            }
        }
    }
});
