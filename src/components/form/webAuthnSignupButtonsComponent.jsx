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

const PrimaryButtonWithIcon = styled(withTheme(({ type = "submit", onClick, disabled = false, title, children, theme, text, className }) => (
    <Button
        type={type}
        className={classes(['r5-webauthn-button'], className)}
        title={title}
        onClick={onClick}
        disabled={disabled}
        background={theme.get('backgroundColor')}
        border={theme.get('backgroundColor')}
        color={theme.get('primaryColor')}
        theme={theme}>
        {children}
        <span className="button-text">{text}</span>
    </Button>
)))`
    display: flex;
    align-items: center;
    justify-content: center;

    .button-text {
        margin-left: 10px;
        text-transform: uppercase;
    }
`;

export const WebAuthnSignupViewPrimaryButtons = styled(({ disabled, onClick, i18n, className }) => <div className={classes(['r5-webauthn-signup-buttons'], className)}>
<PrimaryButtonWithIcon
    type="submit"
    title="Signup with biometrics"
    text="Biometrics">
    <FingerPrintIcon />
</PrimaryButtonWithIcon>

<Separator text={i18n('or')} />

<PrimaryButtonWithIcon
    title="Signup with password"
    disabled={disabled}
    onClick={onClick}
    text="Password">
    <KeyboardIcon />
</PrimaryButtonWithIcon>
</div>)``;
