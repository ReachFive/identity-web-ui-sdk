import React from 'react';

import { Marker, MarkerContent } from '@/components/ui/marker';
import { useRouting } from '@/contexts/routing';
import { cn } from '@/lib/utils';

export const Heading = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        data-slot="widget-heading"
        className={cn(
            'mb-4 text-center font-heading-font-weight text-heading-text-size text-heading-text',
            className
        )}
        {...props}
    >
        {children}
    </div>
);

const TextBase = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('mb-2 text-center', className)} {...props}>
        {children}
    </div>
);

export const Info = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <TextBase data-slot="widget-info" className={cn('text-foreground', className)} {...props}>
        {children}
    </TextBase>
);

export const ErrorText = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <TextBase
        data-slot="widget-error-text"
        className={cn('text-destructive-foreground', className)}
        {...props}
    >
        {children}
    </TextBase>
);

export const Intro = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <TextBase data-slot="widget-intro" className={cn('text-foreground', className)} {...props}>
        {children}
    </TextBase>
);

export const Separator = ({
    text,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { text?: string }) => (
    <Marker data-slot="widget-separator" variant="separator" className={className} {...props}>
        <MarkerContent data-slot="widget-separator-text">{text}</MarkerContent>
    </Marker>
);

export const Alternative = ({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        data-slot="widget-alternative"
        className={cn('mt-4 text-center text-foreground', className)}
        {...props}
    >
        {children}
    </div>
);

export const Link = ({
    children,
    className,
    controller,
    href = '#',
    target,
    ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { controller?: AbortController }) => {
    const { goTo } = useRouting();

    const onClick = target
        ? (e: React.MouseEvent<HTMLAnchorElement>) => {
              controller?.abort(`Going to ${target}`);
              e.preventDefault();
              goTo(target);
          }
        : () => {};

    return (
        <a
            data-slot="widget-link"
            href={href}
            onClick={onClick}
            className={cn(
                'link-decoration mt-4 text-link-text hover:text-link-hover-text',
                className
            )}
            {...props}
        >
            {children}
        </a>
    );
};
