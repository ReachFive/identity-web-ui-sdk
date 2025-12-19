import React, { PropsWithChildren } from 'react';

import { darken } from 'polished';
import styled, { useTheme, type DefaultTheme } from 'styled-components';

const buttonTheme = <
    ThemePrefix extends 'button' | 'socialButton',
    Attr extends keyof DefaultTheme[ThemePrefix],
>(
    theme: DefaultTheme,
    themePrefix: ThemePrefix = 'button' as ThemePrefix,
    attr: Attr
): DefaultTheme[ThemePrefix][Attr] => theme[themePrefix][attr];

export type ExtraButtonProps = {
    $color?: string;
    $background?: string;
    $border?: string;
    $themePrefix?: 'button' | 'socialButton';
};

export type ButtonProps = React.ComponentProps<typeof Button>;

export const Button = styled.button<ExtraButtonProps>`
    display: block;
    width: 100%;
    box-sizing: border-box;
    text-align: center;
    font-weight: ${props => buttonTheme(props.theme, props.$themePrefix, 'fontWeight')};
    vertical-align: middle;
    user-select: none;
    touch-action: manipulation;
    cursor: pointer;
    color: ${props => props.$color ?? '#ffffff'};
    background-color: ${props => props.$background};
    border: ${props => buttonTheme(props.theme, props.$themePrefix, 'borderWidth')}px solid
        ${props => props.$border};
    padding: ${props => buttonTheme(props.theme, props.$themePrefix, 'paddingY')}px
        ${props => buttonTheme(props.theme, props.$themePrefix, 'paddingX')}px;
    font-size: ${props => buttonTheme(props.theme, props.$themePrefix, 'fontSize')}px;
    line-height: ${props => buttonTheme(props.theme, props.$themePrefix, 'lineHeight')};
    border-radius: ${props => buttonTheme(props.theme, props.$themePrefix, 'borderRadius')}px;
    transition: all 0.15s ease-in-out;

    &:focus {
        outline: 0;
        box-shadow: ${props =>
            buttonTheme(props.theme, props.$themePrefix, 'focusBoxShadow')(props.$border)};
    }

    &:hover,
    &:active {
        color: ${props => props.$color};
        background-color: ${props =>
            darken(0.08, props.$background ?? props.theme.backgroundColor)};
        border-color: ${props => darken(0.08, props.$border ?? props.theme.borderColor)};
    }

    &[disabled] {
        opacity: 0.65;
    }
`;

interface DefaultButtonProps extends Omit<ButtonProps, 'background' | 'border' | 'color'> {}

export function DefaultButton({ children, ...props }: PropsWithChildren<DefaultButtonProps>) {
    const theme = useTheme();
    return (
        <Button
            {...props}
            $background="#ffffff"
            $border={theme.borderColor}
            $color={theme.textColor}
        >
            {children}
        </Button>
    );
}

interface PrimaryButtonProps extends Omit<ButtonProps, 'background' | 'border'> {}

export function PrimaryButton({
    children,
    type = 'submit' as const,
    ...props
}: PropsWithChildren<PrimaryButtonProps>) {
    const theme = useTheme();
    return (
        <Button
            type={type as 'submit' | 'reset' | 'button'}
            {...(props as Omit<ButtonProps, '$background' | '$border'>)}
            $background={theme.primaryColor}
            $border={theme.primaryColor}
        >
            {children}
        </Button>
    );
}

interface DestructiveButtonProps extends Omit<ButtonProps, 'background' | 'border'> {}

export function DestructiveButton({
    children,
    type = 'submit' as const,
    ...props
}: PropsWithChildren<DestructiveButtonProps>) {
    const theme = useTheme();
    return (
        <Button
            type={type as 'submit' | 'reset' | 'button'}
            {...(props as Omit<ButtonProps, '$background' | '$border'>)}
            $background={theme.dangerColor}
            $border={theme.dangerColor}
        >
            {children}
        </Button>
    );
}
