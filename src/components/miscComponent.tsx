import React, { AnchorHTMLAttributes, ComponentType, HTMLAttributes, MouseEvent } from 'react';

import { Remarkable } from 'remarkable';
import styled from 'styled-components';
import { useRouting } from '../contexts/routing'

export const Heading = styled.div`
    margin-bottom: ${props => props.theme.spacing * 1.5}px;
    text-align: center;
    color: ${props => props.theme.headingColor};
    font-weight: bold;
    font-size: ${props => props.theme.fontSize * 1.2}px;
`; // Derive font size from base font size

const TextBase = styled.div`
    text-align: center;
    margin-bottom: ${props => props.theme.spacing}px;
`;

export const Info = styled(TextBase)`
    color: ${props => props.theme.textColor};
`;

export const Error = styled(TextBase)`
    color: ${props => props.theme.dangerColor};
`;

export const MutedText = styled.span`
    color: ${props => props.theme.mutedTextColor};
`

export const Intro = Info;

const SeparatorInner = styled.div`
    color: ${props => props.theme.mutedTextColor};
    display: block;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    margin: ${props => props.theme.spacing}px 0;

    & > span {
        position: relative;
        display: inline-block;
    }

    & > span:before,
    & > span:after {
        content: '';
        position: absolute;
        top: 50%;
        width: 9999px;
        height: 1px;
        background: ${props => props.theme.borderColor};
    }

    & > span:before {
        right: 100%;
        margin-right: ${props => props.theme.fontSize}px;
    }

    & > span:after {
        left: 100%;
        margin-left: ${props => props.theme.fontSize}px;
    }
`;

export const Separator = ({ text }: { text?: string }) => <SeparatorInner><span>{text}</span></SeparatorInner>;

export const Alternative = styled.div`
    text-align: center;
    margin-top: ${props => props.theme.spacing * 1.5}px;
    color: ${props => props.theme.textColor};
`;

export const Link = styled(({ target, href = '#', children, className, controller }: {controller?: AbortController} & AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const { goTo } = useRouting()

    const onClick = target ? ((e: MouseEvent<HTMLAnchorElement>) => {
        controller?.abort(`Going to ${target}`)
        e.preventDefault();
        goTo(target);
    }) : (() => { });

    return (
        <a href={href} onClick={onClick} className={className}>
            {children}
        </a>
    );
})`
    color: ${props => props.theme.link.color};
    text-decoration: ${props => props.theme.link.decoration};
    &:hover {
        color: ${props => props.theme.link.hoverColor};
        text-decoration: ${props => props.theme.link.hoverDecoration};
    }
`;

function buildMarkdownParser() {
    const md = new Remarkable();
    const originalLinkRender = md.renderer.rules.link_open;

    md.inline.ruler.enable(['text', 'newline', 'emphasis', 'links', 'ins']);
    md.block.ruler.enable(['list']);
    md.renderer.rules.link_open = function (...args: Parameters<Remarkable.Rule<Remarkable.LinkOpenToken>>) {
        return originalLinkRender(...args)
            .replace('>', ` target="_blank" rel="nofollow noreferrer noopener">`);
    };

    return md;
}

const markdownParser = buildMarkdownParser();

export const MarkdownContent = <T,>({ source, root: Root, ...props }: { source: string, root: ComponentType<HTMLAttributes<T>> & HTMLAttributes<T> }) =>
    <Root data-text='md' dangerouslySetInnerHTML={{ __html: markdownParser.render(source) }} {...props} />;
