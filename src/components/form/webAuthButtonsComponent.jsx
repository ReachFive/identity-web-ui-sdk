import React from 'react';

import styled from 'styled-components';
import classes from 'classnames';

import { Button } from './buttonComponent';
import { Alternative } from '../miscComponent';
import { withTheme } from '../widget/widgetContext';

import { ReactComponent as FingerPrint } from '../../icons/fingerprint.svg'
import { ReactComponent as Keyboard } from '../../icons/keyboard.svg'


const iconStyle = `
    width: 35px;
    height: 35px;
`

const FingerPrintIcon = styled(FingerPrint)`${iconStyle}`;
const KeyboardIcon = styled(Keyboard)`${iconStyle}`;

const PrimaryButtonWithIcon = withTheme(({ type = "submit", onClick, disabled = false, title, children, theme }) => (
    <Button
        type={type}
        title={title}
        onClick={onClick}
        disabled={disabled}
        background={theme.get('backgroundColor')}
        border={theme.get('backgroundColor')}
        color={theme.get('primaryColor')}
        theme={theme}>
        {children}
    </Button>
));

export const WebAuthnViewPrimaryButtons = styled(({ disabled, onPasswordIconClick, i18n, className }) => <div className={classes(['r5-webauthn-buttons'], className)}>
    <PrimaryButtonWithIcon
        title="Login with biometrics"
        disabled={disabled}>
        <FingerPrintIcon />
    </PrimaryButtonWithIcon>

    <Alternative>{i18n('or')}</Alternative>

    <PrimaryButtonWithIcon
        type="button"
        title="Login with password"
        disabled={disabled}
        onClick={onPasswordIconClick}>
        <KeyboardIcon />
    </PrimaryButtonWithIcon>
</div>)`
    display: flex;
    align-items: center;

    & > :not(:last-child) {
        margin-right: 20px;
    }
`;
