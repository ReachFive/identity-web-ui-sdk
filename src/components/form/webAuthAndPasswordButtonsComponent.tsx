import React, { PropsWithChildren } from 'react';

import styled, { useTheme } from 'styled-components';
import classes from 'classnames';

import { Button, type ButtonProps } from './buttonComponent';
import { Separator } from '../miscComponent';

import { ReactComponent as FingerPrint } from '../../icons/fingerprint.svg'
import { ReactComponent as Keyboard } from '../../icons/keyboard.svg'

import { useI18n } from '../../contexts/i18n';


const iconStyle = `
    width: 40px;
    height: 40px;
`

const FingerPrintIcon = styled(FingerPrint)`${iconStyle}`;
const KeyboardIcon = styled(Keyboard)`${iconStyle}`;

const PrimaryButtonWithIcon = styled(({
    type = "submit",
    disabled = false,
    text,
    children,
    className,
    ...props
}: PropsWithChildren<ButtonProps & { text?: string }>) => {
    const theme = useTheme()
    return (
        <Button
            type={type}
            disabled={disabled}
            {...props}
            className={classes(['r5-button-with-icon'], className)}
            background={theme.backgroundColor}
            border={theme.backgroundColor}
            color={theme.primaryColor}
        >
            {children}
            {text && <span className="r5-button-text">{text}</span>}
        </Button>
    )
})`
    display: flex;
    align-items: center;
    justify-content: center;

    .r5-button-text {
        margin-left: 10px;
        text-transform: uppercase;
    }
`;

export interface WebAuthnSignupViewButtonsProps {
    onBiometricClick: ButtonProps['onClick']
    onPasswordClick: ButtonProps['onClick']
    className?: classes.Argument
}

export const WebAuthnSignupViewButtons = styled(({ onBiometricClick, onPasswordClick, className }: WebAuthnSignupViewButtonsProps) => {
    const i18n = useI18n()
    return (
        <div className={classes(['r5-webauthn-signup-buttons'], className)}>
        <PrimaryButtonWithIcon
            dataTestId="webauthn-button"
            onClick={onBiometricClick}
            title={i18n('signup.withBiometrics')}
            text={i18n('biometrics')}>
            <FingerPrintIcon />
        </PrimaryButtonWithIcon>

        <Separator text={i18n('or')} />

        <PrimaryButtonWithIcon
            dataTestId="password-button"
            onClick={onPasswordClick}
            title={i18n('signup.withPassword')}
            text={i18n('password')}>
            <KeyboardIcon />
        </PrimaryButtonWithIcon>
    </div>
    )
})``;
