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

const ButtonWithIcon = withTheme(({ onClick, disabled = false, children, theme }) => (
    <Button type="submit"
        onClick={onClick}
        disabled={disabled}
        color={theme.get('primaryColor')}
        background={theme.get('backgroundColor')}
        border={theme.get('backgroundColor')}
        theme={theme}>
        {children}
    </Button>
));

export const ButtonsWithIcons = styled(({ disabled = false, i18n, className }) => <div className={classes(['r5-webauthn-buttons'], className)}>
    <ButtonWithIcon disabled={disabled}>
        <FingerPrintIcon />
    </ButtonWithIcon>
    <Alternative>{i18n('or')}</Alternative>
    <ButtonWithIcon disabled={disabled}>
        <KeyboardIcon />
    </ButtonWithIcon>
</div>)`
    display: flex;
    align-items: center;

    & > :not(:last-child) {
        margin-right: 20px;
    }
`;
