import React from 'react';

import styled from 'styled-components';
import classes from 'classnames';

import { Button } from './buttonComponent';
import { Separator } from '../miscComponent';
import { withTheme } from '../widget/widgetContext';

import { ReactComponent as FingerPrint } from '../../icons/fingerprint.svg'
import { ReactComponent as Keyboard } from '../../icons/keyboard.svg'


const iconStyle = `
    width: 35px;
    height: 35px;
`

const FingerPrintIcon = styled(FingerPrint)`${iconStyle}`;
const KeyboardIcon = styled(Keyboard)`${iconStyle}`;

const PrimaryButtonWithIcon = styled(withTheme(({ type = "submit", onClick, disabled = false, title, text, children, theme, className }) => (
    <Button
        type={type}
        title={title}
        className={classes(['r5-button-with-icon'], className)}
        onClick={onClick}
        disabled={disabled}
        background={theme.get('backgroundColor')}
        border={theme.get('backgroundColor')}
        color={theme.get('primaryColor')}
        theme={theme}>
        {children}
        {text && <span className="r5-button-text">{text}</span>}
    </Button>
)))`
    display: flex;
    align-items: center;
    justify-content: center;

    .r5-button-text {
        margin-left: 10px;
        text-transform: uppercase;
    }
`;

const ButtonsSeparator = withTheme(styled.div`
    text-align: center;
    color: ${props => props.theme.get('mutedTextColor')}
`);

export const WebAuthnLoginViewButtons = styled(({ disabled, onPasswordClick, i18n, className }) => <div className={classes(['r5-webauthn-login-buttons'], className)}>
    <PrimaryButtonWithIcon
        type="submit"
        title="Login with biometrics"
        disabled={disabled}>
        <FingerPrintIcon />
    </PrimaryButtonWithIcon>

    <ButtonsSeparator>{i18n('or')}</ButtonsSeparator>

    <PrimaryButtonWithIcon
        title="Login with password"
        disabled={disabled}
        onClick={onPasswordClick}>
        <KeyboardIcon />
    </PrimaryButtonWithIcon>
</div>)`
    display: flex;
    align-items: center;

    & > :not(:last-child) {
        margin-right: 20px;
    }
`;

export const WebAuthnSignupViewButtons = styled(({ onBiometricClick, onPasswordClick, i18n, className }) => <div className={classes(['r5-webauthn-signup-buttons'], className)}>
    <PrimaryButtonWithIcon
        onClick={onBiometricClick}
        title="Signup with biometrics"
        text="Biometrics">
        <FingerPrintIcon />
    </PrimaryButtonWithIcon>

    <Separator text={i18n('or')} />

    <PrimaryButtonWithIcon
        onClick={onPasswordClick}
        title="Signup with password"
        text="Password">
        <KeyboardIcon />
    </PrimaryButtonWithIcon>
</div>)``;
