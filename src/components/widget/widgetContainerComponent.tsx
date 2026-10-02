import React, { ForwardedRef, PropsWithChildren } from 'react';
import { Transition, TransitionStatus } from 'react-transition-group';

import { Heading, Intro } from '@/components/miscComponent';
import { useTheme } from '@/contexts/theme';
import { cn } from '@/lib/utils';

interface WidgetContentProps extends React.HTMLAttributes<HTMLDivElement> {
    name?: string;
    standalone?: boolean;
    transition?: TransitionStatus;
}

const WidgetContent = React.forwardRef(function WidgetContent(
    {
        name,
        className,
        children,
        standalone,
        transition,
        ...props
    }: PropsWithChildren<WidgetContentProps>,
    ref: ForwardedRef<HTMLDivElement>
) {
    return (
        <div
            ref={ref}
            data-slot="widget-content"
            className={cn(
                'text-[length:var(--font-size)] transition-[transform,opacity] duration-[400ms] ease-[ease]',
                transition === 'entered' ? 'opacity-100' : 'opacity-0',
                standalone &&
                    'mx-auto max-w-widget-max-width rounded bg-background p-[calc(var(--spacing)*2)]',
                {
                    [`r5-${name}`]: !!name,
                    'r5-widget-active': !!name,
                },
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});

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
