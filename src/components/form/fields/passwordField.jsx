import React from 'react';
import { isLower, isUpper, isDigit } from "char-info";

import styled from 'styled-components';

import { Input, Label, FormGroupContainer, FormError } from '../formControlsComponent';
import { withI18n, withTheme } from '../../widget/widgetContext';

import { ShowPasswordIcon, HidePasswordIcon } from './simplePasswordField'

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
        zxcvbn: null,
        showPassword: false
    };

    componentDidMount() {
        import('zxcvbn').then(({ default: zxcvbn }) => {
            if (this.unmounted) return;

            const { value, onChange } = this.props;
            this.setState({ ...this.state, zxcvbn });
            onChange({ strength: zxcvbn(value).score });
        })
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
            value,
            strength = 0,
            isTouched,
            validation = {},
            onChange,
            showLabel,
            inputId,
            required,
            label,
            autoComplete,
            placeholder = label,
            canShowPassword
        } = this.props;

        const { zxcvbn, showPassword } = this.state;

        return <FormGroupContainer>
            <div style={{ position: 'relative' }}>
                <Label visible={showLabel} htmlFor={inputId}>
                    {label}
                </Label>
                <Input id={inputId}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={value || ''}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    title={label}
                    required={required}
                    hasError={!!validation.error}
                    onChange={event => onChange({
                        value: event.target.value,
                        strength: zxcvbn ? zxcvbn(event.target.value).score : 0
                    })}
                    onFocus={() => onChange({ isTouched: true })}
                    onBlur={() => onChange({ isDirty: true })} />
                {canShowPassword && showPassword && <HidePasswordIcon onClick={this.toggleShowPassword} />}
                {canShowPassword && !showPassword && <ShowPasswordIcon onClick={this.toggleShowPassword} />}
                {isTouched && zxcvbn && <PasswordStrength score={strength} />}
                {validation.error && <FormError>{validation.error}</FormError>}
            </div>
        </FormGroupContainer>;
    }
}

function checkSpecialsCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.specialCharacters) {
        const SPECIAL_CHARACTERS = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
        const passwordChars = Array.from(password)
        return !!passwordChars.find(c => SPECIAL_CHARACTERS.includes(c))
    } else {
        return false
    }
}

function checkLowercaseCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.lowercaseCharacters) {
        return !!Array.from(password).find(c => isLower(c))
    } else {
        return false
    }
}

function checkUppercaseCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.uppercaseCharacters) {
        return !!Array.from(password).find(c => isUpper(c))
    } else {
        return false
    }
}

function checkDigitCharacters(password, passwordPolicy) {
    if (!!passwordPolicy.digitCharacters) {
        return !!Array.from(password).find(c => isDigit(c))
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
                if (isDirty || ctx.isSubmitted) {
                    if (!value) {
                        return { error: i18n('validation.required') };
                    } else {
                        if (value.length < passwordPolicy.minLength) {
                            return { error: i18n('validation.password.minLength', { min: passwordPolicy.minLength }) };
                        } else if (value.length > MAX_PASSWORD_LENGTH) {
                            return { error: i18n('validation.password.maxLength', { max: MAX_PASSWORD_LENGTH }) };
                        } else if (strength < passwordPolicy.minStrength) {
                            return { error: i18n('validation.password.minStrength') };
                        } else if (checkSpecialsCharacters(value, passwordPolicy)) {
                            return { error: i18n('validation.password.specials.characters') };
                        } else if (checkLowercaseCharacters(value, passwordPolicy)) {
                            return { error: i18n('validation.password.specials.lowercase') };
                        } else if (checkUppercaseCharacters(value, passwordPolicy)) {
                            return { error: i18n('validation.password.specials.uppercase') };
                        } else if (checkDigitCharacters(value, passwordPolicy)) {
                            return { error: i18n('validation.password.specials.digit') };
                        }
                    }
                }
                return {};
            }
        }
    }
});
