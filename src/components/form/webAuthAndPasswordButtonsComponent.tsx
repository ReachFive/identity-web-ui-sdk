import React, { PropsWithChildren } from 'react';

import classes from 'classnames';
import styled, { useTheme } from 'styled-components';

import { Separator } from '../miscComponent';
import { Button, type ButtonProps } from './buttonComponent';

import { ReactComponent as FingerPrint } from '../../icons/fingerprint.svg';
import { ReactComponent as Keyboard } from '../../icons/keyboard.svg';

import { useI18n } from '../../contexts/i18n';

const iconStyle = `
    width: 40px;
    height: 40px;
`;

const FingerPrintIcon = styled(FingerPrint)`
    ${iconStyle}
`;
const KeyboardIcon = styled(Keyboard)`
    ${iconStyle}
`;

const PrimaryButtonWithIcon = styled(
    ({
        type = 'submit',
        disabled = false,
        text,
        children,
        className,
        ...props
    }: PropsWithChildren<ButtonProps & { text?: string }>) => {
        const theme = useTheme();
        return (
            <Button
                type={type}
                disabled={disabled}
                {...props}
                className={classes(['r5-button-with-icon'], className)}
                $background={theme.backgroundColor}
                $border={theme.backgroundColor}
                $color={theme.primaryColor}
            >
                {children}
                {text && <span className="r5-button-text">{text}</span>}
            </Button>
        );
    }
)`
    display: flex;
    align-items: center;
    justify-content: center;

    .r5-button-text {
        margin-left: 10px;
        text-transform: uppercase;
    }
`;

const ButtonsSeparator = styled.div`
    text-align: center;
    color: ${props => props.theme.mutedTextColor};
`;

export interface WebAuthnLoginViewButtonsProps {
    disabled?: ButtonProps['disabled'];
    enablePasswordAuthentication?: boolean;
    onPasswordClick: ButtonProps['onClick'];
    className?: classes.Argument;
}

export const WebAuthnLoginViewButtons = styled(
    ({
        disabled,
        enablePasswordAuthentication,
        onPasswordClick,
        className,
        ...props
    }: WebAuthnLoginViewButtonsProps) => {
        const i18n = useI18n();
        return (
            <div className={classes(['r5-webauthn-login-buttons'], className)}>
                <PrimaryButtonWithIcon
                    type="submit"
                    data-testid="webauthn-button"
                    title={i18n('login.withBiometrics')}
                    disabled={disabled}
                    {...props}
                >
                    <FingerPrintIcon />
                </PrimaryButtonWithIcon>

                {enablePasswordAuthentication && (
                    <>
                        <ButtonsSeparator>{i18n('or')}</ButtonsSeparator>

                        <PrimaryButtonWithIcon
                            data-testid="password-button"
                            title={i18n('login.withPassword')}
                            disabled={disabled}
                            onClick={onPasswordClick}
                        >
                            <KeyboardIcon />
                        </PrimaryButtonWithIcon>
                    </>
                )}
            </div>
        );
    }
)`
    display: flex;
    align-items: center;

    & > :not(:last-child) {
        margin-right: 20px;
    }
`;

export interface WebAuthnSignupViewButtonsProps {
    enablePasswordAuthentication?: boolean;
    onBiometricClick: ButtonProps['onClick'];
    onPasswordClick: ButtonProps['onClick'];
    className?: classes.Argument;
}

export const WebAuthnSignupViewButtons = styled(
    ({
        enablePasswordAuthentication,
        onBiometricClick,
        onPasswordClick,
        className,
    }: WebAuthnSignupViewButtonsProps) => {
        const i18n = useI18n();
        return (
            <div className={classes(['r5-webauthn-signup-buttons'], className)}>
                <PrimaryButtonWithIcon
                    data-testid="webauthn-button"
                    onClick={onBiometricClick}
                    title={i18n('signup.withBiometrics')}
                    text={i18n('biometrics')}
                >
                    <FingerPrintIcon />
                </PrimaryButtonWithIcon>

                {enablePasswordAuthentication && (
                    <>
                        <Separator text={i18n('or')} />

                        <PrimaryButtonWithIcon
                            data-testid="password-button"
                            onClick={onPasswordClick}
                            title={i18n('signup.withPassword')}
                            text={i18n('password')}
                        >
                            <KeyboardIcon />
                        </PrimaryButtonWithIcon>
                    </>
                )}
            </div>
        );
    }
)``;
