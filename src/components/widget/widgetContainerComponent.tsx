import React, { PropsWithChildren } from 'react';

import styled, { useTheme } from 'styled-components';
import { Transition, TransitionStatus } from 'react-transition-group';
import classes from 'classnames';

import { Heading, Intro } from '../miscComponent';

interface WidgetContentProps {
    name?: string
    className?: classes.Argument
    standalone?: boolean
    transition?: TransitionStatus
}

const WidgetContent = styled(({ name, className, children }: PropsWithChildren<WidgetContentProps>) => (
    <div className={classes(className, {
        [`r5-${name}`]: !!name,
        'r5-widget-active': !!name
    })}>{children}</div>
))`
    font-size: ${props => props.theme.fontSize}px;
    transition:
        transform 400ms ease,
        opacity 400ms ease;

    opacity: ${props => props.transition === 'entered' ? '1' : '0'};

    ${props => props.standalone && `
        padding: ${props.theme.spacing * 2}px;
        border-radius: ${props.theme.borderRadius}px;
        background-color: ${props.theme.backgroundColor};
        max-width: ${props.theme.maxWidth}px;
        box-sizing: border-box;
        margin: 0 auto;
    `}
`;

export interface WidgetContainerProps {
    name?: string
    standalone?: boolean
    noIntro?: boolean
    title?: string
    intro?: string
}

export default function WidgetContainer({
    name,
    standalone = true,
    noIntro = false,
    title,
    intro,
    children
}: PropsWithChildren<WidgetContainerProps>) {
    const theme = useTheme()
    return (
        <Transition in={true} appear={theme.animateWidgetEntrance} timeout={400}>
            {state => (
                <WidgetContent
                    standalone={standalone}
                    name={name}
                    transition={state}
                >
                    {title && <Heading>{title}</Heading>}
                    {!noIntro && intro && <Intro>{intro}</Intro>}
                    {children}
                </WidgetContent>
            )}
        </Transition>
    )
}
