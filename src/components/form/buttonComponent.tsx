import React, { MouseEventHandler, PropsWithChildren } from 'react';

import styled, { useTheme, type DefaultTheme } from 'styled-components';
import { darken } from 'polished';
import classes from 'classnames';

const buttonTheme =
<P extends { theme: DefaultTheme, themePrefix?: ThemePrefix },
    ThemePrefix extends 'button' | 'socialButton',
    Attr extends keyof DefaultTheme[ThemePrefix]
>({ theme, themePrefix = 'button' as ThemePrefix }: P, attr: Attr): DefaultTheme[ThemePrefix][Attr] =>
    theme[themePrefix][attr]

export type ButtonProps = {
    tagname?: 'button' | 'div'
    className?: classes.Argument
    extendedClasses?: classes.Argument
    title?: HTMLButtonElement['title']
    disabled?: HTMLButtonElement['disabled']
    type?: HTMLButtonElement['type']
    dataTestId?: string
    onClick?: MouseEventHandler<HTMLButtonElement> & MouseEventHandler<HTMLDivElement>
    color?: string
    background?: string
    border?: string
    themePrefix?: 'button' | 'socialButton'
}

export const Button = styled(({ tagname = 'button', className, extendedClasses, title, disabled, type, dataTestId, onClick, children }: PropsWithChildren<ButtonProps>) => {
    const Tagname = tagname;

    return (
        <Tagname className={classes([extendedClasses, className])}
            disabled={disabled}
            type={type}
            data-testid={dataTestId || type}
            onClick={onClick}
            {...(title ? { title } : {})}>{children}</Tagname>
    );
})`
    display: block;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    font-weight: ${props => buttonTheme(props, 'fontWeight')};
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
        background-color: ${props => darken(0.08, props.background || props.theme.backgroundColor)};
        border-color: ${props => darken(0.08, props.border || props.theme.borderColor)};
    }

    &[disabled] {
        opacity: .65;
    }
`;

interface DefaultButtonProps extends Omit<ButtonProps, 'background' | 'border' | 'color'> {}

export const DefaultButton = ({ children, ...props }: PropsWithChildren<DefaultButtonProps>) => {
    const theme = useTheme()
    return (
        <Button {...props} background="#ffffff" border={theme.borderColor} color={theme.textColor}>
            {children}
        </Button>
    )
};

interface PrimaryButtonProps extends Omit<ButtonProps, 'background' | 'border'> {}

export const PrimaryButton = ({ children, type = "submit", ...props }: PropsWithChildren<PrimaryButtonProps>) =>  {
    const theme = useTheme()
    return (
        <Button
            {...props}
            type={type}
            background={theme.primaryColor}
            border={theme.primaryColor}
        >
            {children}
        </Button>
    )
};
