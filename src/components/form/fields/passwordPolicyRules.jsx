import React from 'react';

import styled from 'styled-components';

import { Label } from '../formControlsComponent';

import { withTheme, withI18n } from '../../widget/widgetContext';

const RoundCheckbox = withTheme(styled(({ className, ...props }) =>
    <div className={className}>
        <input type="checkbox" checked={props.checked} onChange={() => { }} />
        <label />
    </div>
)`
    position: relative;
    margin-right: 5px;

    > label {
        position: absolute;
        top: 0;
        left: 0;
        height: 15px;
        width: 15px;
        background-color: #fff;
        border: 1px solid #ccc;
        border-radius: 50%;
    }

    > label:after {
        position: absolute;
        top: 4px;
        left: 3px;
        height: 3px;
        width: 7px;
        border: 1px solid #fff;
        border-top: none;
        border-right: none;
        content: "";
        opacity: 0;
        transform: rotate(-45deg);
    }

    > input[type="checkbox"] {
        visibility: hidden;
    }

    > input[type="checkbox"]:checked + label {
        background-color: ${props => props.theme.get('primaryColor')};
        border-color: ${props => props.theme.get('primaryColor')};
    }

    > input[type="checkbox"]:checked + label:after {
        opacity: 1;
    }
`);

const PasswordPolicyRule = withTheme(styled.div`
    display: flex;
    margin-bottom: 2px;
`);

const PasswordPolicyIntro = withI18n(withTheme(styled(({ i18n, className }) =>
    <Label className={className} visible>{i18n('validation.password.must.contain')}</Label>
)`
    margin-bottom: ${props => props.theme.get('spacing')}px;
`));

export const PasswordPolicyRules = withI18n(withTheme(styled(({ className, i18n, ...props }) =>
    <div className={className}>
        {props.minStrength !== 0 && <PasswordPolicyRule>
            <RoundCheckbox checked={props.strength >= props.minStrength} />
            <Label visible>
                {i18n('passwordStrength.minimum.required')} {i18n(`passwordStrength.score${props.minStrength}`).toLowerCase()}.
            </Label>
        </PasswordPolicyRule>}

        <PasswordPolicyIntro />

        {Object.keys(props.rules).map(key => {
            const rule = props.rules[key];

            return <PasswordPolicyRule key={key}>
                <RoundCheckbox checked={rule.verify(props.value)} />
                <Label visible>{rule.label}</Label>
            </PasswordPolicyRule>
        })}
    </div>
)`
    margin-top: ${props => props.theme.get('spacing')}px;
`));
