import React from 'react';

import styled from 'styled-components';

import { Label } from '../formControlsComponent';

import { useI18n } from '../../../contexts/i18n'

interface RoundCheckboxProps {
    checked?: boolean
    className?: string
}

const RoundCheckbox = styled(({ className, ...props }: RoundCheckboxProps) =>
    <div className={className}>
        <input type="checkbox" checked={props.checked} onChange={() => { }} />
        <label />
    </div>
)`
    display: flex;
    align-items: center;
    position: relative;

    > label {
        position: absolute;
        top: 0;
        left: 0;
        height: 15px;
        width: 15px;
        background-color: ${props => props.theme.input.background};
        border: 1px solid ${props => props.theme.input.borderColor};
        border-radius: 50%;
    }

    > label:after {
        position: absolute;
        top: 4px;
        left: 3px;
        height: 3px;
        width: 7px;
        border: 1px solid ${props => props.theme.input.color};
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
        background-color: ${props => props.theme.primaryColor};
        border-color: ${props => props.theme.primaryColor};
    }

    > input[type="checkbox"]:checked + label:after {
        opacity: 1;
    }
    
    + label {
        line-height: 1;
    }
`;

const PasswordPolicyRule = styled.div`
    display: flex;
    align-items: center;
<<<<<<< HEAD
=======
    gap: ${props => props.theme.spacing}px;
>>>>>>> master
    margin-bottom: 2px;
`;

interface PasswordPolicyIntroProps {
    className?: string
}

const PasswordPolicyIntro = styled(({ className }: PasswordPolicyIntroProps) => {
    const i18n = useI18n()
    return <Label className={className} visible>{i18n('validation.password.must.contain')}</Label>
})`
    margin-bottom: ${props => props.theme.spacing}px;
`;

export type PasswordStrengthScore = 0 | 1 | 2 | 3 | 4

export interface PasswordRule {
    label: string
    verify: (value: string) => boolean
}

interface PasswordPolicyRulesProps {
    className?: string
    minStrength: PasswordStrengthScore
    rules: Record<string, PasswordRule>
    strength: PasswordStrengthScore
    value: string
}

export const PasswordPolicyRules = styled(({ className, ...props }: PasswordPolicyRulesProps) => {
    const i18n = useI18n()
    return (
        <div className={className} data-testid="password-policy-rules">
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
    )
})`
    margin-top: ${props => props.theme.spacing}px;
`;
