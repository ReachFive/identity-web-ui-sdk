import React, { ForwardedRef, PropsWithChildren } from 'react';

import classes from 'classnames';
import { Transition, TransitionStatus } from 'react-transition-group';
import styled, { useTheme } from 'styled-components';

import { Heading, Intro } from '../miscComponent';

interface WidgetContentProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string;
    standalone?: boolean;
    transition?: TransitionStatus;
}

const WidgetContent = styled(
    React.forwardRef(function WidgetContent(
        { name, className, children, standalone, ...props }: PropsWithChildren<WidgetContentProps>,
        ref: ForwardedRef<HTMLDivElement>
    ) {
        return (
            <div
                ref={ref}
                className={classes(className, {
                    [`r5-${name}`]: !!name,
                    'r5-widget-active': !!name,
                })}
                {...props}
            >
                {children}
            </div>
        );
    })
)`
    font-size: ${props => props.theme.fontSize}px;
    transition:
        transform 400ms ease,
        opacity 400ms ease;

    opacity: ${props => (props.transition === 'entered' ? '1' : '0')};

    ${props =>
        props.standalone &&
        `
        padding: ${props.theme.spacing * 2}px;
        border-radius: ${props.theme.borderRadius}px;
        background-color: ${props.theme.backgroundColor};
        max-width: ${props.theme.maxWidth}px;
        box-sizing: border-box;
        margin: 0 auto;
    `}
`;

export interface WidgetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string;
    standalone?: boolean;
    noIntro?: boolean;
    title?: string;
    intro?: string;
}

export default function WidgetContainer({
    name,
    standalone = true,
    noIntro = false,
    title,
    intro,
    children,
    ...props
}: PropsWithChildren<WidgetContainerProps>) {
    const theme = useTheme();
    const nodeRef = React.useRef<HTMLDivElement>(null);
    return (
        <Transition nodeRef={nodeRef} in={true} appear={theme.animateWidgetEntrance} timeout={400}>
            {state => (
                <WidgetContent
                    ref={nodeRef}
                    standalone={standalone}
                    name={name}
                    transition={state}
                    {...props}
                >
                    {title && <Heading>{title}</Heading>}
                    {!noIntro && intro && <Intro>{intro}</Intro>}
                    {children}
                </WidgetContent>
            )}
        </Transition>
    );
}
