import React from 'react';

import styled from 'styled-components';
import { darken } from 'polished';
import classes from 'classnames';

import { withTheme } from '../widget/widgetContext';

const buttonTheme = (props, attr) => props.theme.get(`${props.themePrefix || 'button'}.${attr}`);

export const Button = styled(({ tagname = 'button', className, extendedClasses, title, disabled, type, onClick, children }) => {
    const Tagname = tagname;

    return (
        <Tagname className={classes([extendedClasses, className])}
            disabled={disabled}
            type={type}
            data-testid={type}
            onClick={onClick}
            {...(title ? { title } : {})}>{children}</Tagname>
    );
})`
    display: block;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    font-weight: ${props => buttonTheme(props, 'fontWeight')};
    white-space: nowrap;
    vertical-align: middle;
    user-select: none;
    touch-action: manipulation;
    cursor: pointer;
    color: ${props => props.color || '#ffffff'};
    background-color: ${props => props.background};
    border: ${props => buttonTheme(props, 'borderWidth')}px solid ${props => props.border};
    padding: ${props => buttonTheme(props, 'paddingY')}px ${props => buttonTheme(props, 'paddingX')}px;
    font-size: ${props => buttonTheme(props, 'fontSize')}px;
    line-height: ${props => buttonTheme(props, 'lineHeight')};
    border-radius: ${props => buttonTheme(props, 'borderRadius')}px;
    transition: all .15s ease-in-out;

    &:focus {
        outline: 0;
        box-shadow: ${props => buttonTheme(props, 'focusBoxShadow')(props.border)};
    }

    &:hover,
    &:active {
        color: ${props => props.color};
        background-color: ${props => darken(0.08, props.background)};
        border-color: ${props => darken(0.08, props.border)};
    }

    &[disabled] {
        opacity: .65;
    }
`;

export const DefaultButton = withTheme(props => (
    <Button {...props} background="#ffffff" border={props.theme.get('borderColor')} color={props.theme.get('textColor')} />
));

export const PrimaryButton = withTheme(({ onClick, disabled = false, children, theme }) => (
    <Button type="submit"
        onClick={onClick}
        disabled={disabled}
        background={theme.get('primaryColor')}
        border={theme.get('primaryColor')}
        theme={theme}>
        {children}
    </Button>
));
