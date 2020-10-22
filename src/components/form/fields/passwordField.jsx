import React from 'react';

import { isLower, isUpper, isDigit } from 'char-info';
import { isEqual } from 'lodash-es';
import zxcvbn from '@reachfive/zxcvbn';

import styled from 'styled-components';

import { Input, Label, FormGroupContainer, FormError } from '../formControlsComponent';
import { PasswordPolicyRules } from '../passwordPolicyComponent';
import { withI18n, withTheme } from '../../widget/widgetContext';

import { ShowPasswordIcon, HidePasswordIcon } from './simplePasswordField';

const SPECIAL_CHARACTERS = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const MAX_PASSWORD_LENGTH = 255;

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

    componentDidUpdate(prevProps, prevState, snapshot) {
        const blacklistUpdated = isEqual(prevProps.blacklist, this.props.blacklist)
        if (!blacklistUpdated) {
            const { value, onChange, blacklist } = this.props;
            onChange({ strength: zxcvbn(value).score, blacklist });
        }
    }

    componentDidMount() {
        const { value, onChange, blacklist } = this.props;

        this.setState({ ...this.state });
        onChange({ strength: zxcvbn(value).score, blacklist });
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
            isTouched,
            value,
            blacklist = [],
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
                        value={value || ''}
                        placeholder={this.props.placeholder || label}
                        autoComplete={this.props.autoComplete}
                        title={label}
                        required={this.props.required}
                        hasError={Boolean(validation.error)}
                        onChange={event => onChange({
                            value: event.target.value,
                            strength: zxcvbn(event.target.value).score,
                            blacklist
                        })}
                        onFocus={() => onChange({ isTouched: true })}
                        onBlur={() => onChange({ isDirty: true })}
                        data-testid="password" />
                    {this.props.canShowPassword && (showPassword
                        ? <HidePasswordIcon onClick={this.toggleShowPassword} />
                        : <ShowPasswordIcon onClick={this.toggleShowPassword} />)}
                </div>
                {isTouched && <PasswordStrength score={this.props.strength || 0} />}
                {validation.error && <FormError>{validation.error}</FormError>}
                {isTouched && <PasswordPolicyRules value={value} rules={this.props.enabledRules} />}
            </div>
        </FormGroupContainer>;
    }
}

function listEnabledRules(i18n, passwordPolicy) {
    if (!passwordPolicy) return {};

    const rules = {
        minLength: {
            label: i18n('validation.password.minLength', { min: passwordPolicy.minLength }),
            verify: password => password.length >= passwordPolicy.minLength
        },
        specialCharacters: {
            label: i18n('validation.password.specials.characters'),
            verify: password => Array.from(password).some(c => SPECIAL_CHARACTERS.includes(c))
        },
        lowercaseCharacters: {
            label: i18n('validation.password.specials.lowercase'),
            verify: password => Array.from(password).some(c => isLower(c))
        },
        uppercaseCharacters: {
            label: i18n('validation.password.specials.uppercase'),
            verify: password => Array.from(password).some(c => isUpper(c))
        },
        digitCharacters: {
            label: i18n('validation.password.specials.digit'),
            verify: password => Array.from(password).some(c => isDigit(c))
        }
    };

    return Object.keys(rules).reduce((enabledRules, key) => {
        if (passwordPolicy[key]) enabledRules[key] = rules[key];
        return enabledRules;
    }, {});
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
                enabledRules: listEnabledRules(i18n, passwordPolicy),
                isTouched: false,
                isDirty: false,
                blacklist: [],
            }),
            unbind: (model, { value }) => ({ ...model, password: value }),
            validate: ({ value, strength, isDirty, blacklist }, ctx) => {
                if (!isDirty && !ctx.isSubmitted) return {};

                const errors = [];
                if (!value) {
                    errors.push(i18n('validation.required'));
                }
                else {
                    const includesBannedWords = blacklist.some(taboo => value.toLowerCase().includes(taboo))
                    if (includesBannedWords || strength < passwordPolicy.minStrength) {
                        errors.push(i18n('validation.password.minStrength'));
                    }

                    if (value.length > MAX_PASSWORD_LENGTH) {
                        errors.push(i18n('validation.password.maxLength', { max: MAX_PASSWORD_LENGTH }));
                    }
                }

                return errors.length == 0 ? {} : { error: errors.join(' ') };
            }
        }
    }
});
