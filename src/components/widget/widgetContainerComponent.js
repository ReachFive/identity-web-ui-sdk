import React from 'react';

import styled from 'styled-components';
import { Transition } from 'react-transition-group';
import classes from 'classnames';

import { Heading, Intro } from '../miscComponent';

const WidgetContent = styled(({ name = false, className, children }) => (
    <div className={classes({
        [className]: true,
        [`r5-${name}`]: !!name,
        'r5-widget-active': !!name
    })}>{children}</div>
))`
    font-size: ${props => props.theme.get('fontSize')}px;
    transition:
        transform 400ms ease,
        opacity 400ms ease;

    opacity: ${props => props.transition === 'entered' ? '1' : '0'};

    ${props => props.standalone && `
        padding: ${props.theme.get('spacing') * 2}px;
        border-radius: ${props.theme.get('borderRadius')}px;
        background-color: ${props.theme.get('backgroundColor')};
        max-width: ${props.theme.get('maxWidth')}px;
        box-sizing: border-box;
        margin: 0 auto;
    `}
`;

export default ({
    name,
    standalone = true,
    noIntro = false,
    title,
    intro,
    theme,
    children
}) => <Transition in={true} appear={theme.get('animateWidgetEntrance')} timeout={400}>
        {state => (
            <WidgetContent standalone={standalone}
                theme={theme}
                name={name}
                transition={state}>
                {title && <Heading>{title}</Heading>}
                {!noIntro && intro && <Intro>{intro}</Intro>}
                {children}
            </WidgetContent>
        )}
    </Transition>;
