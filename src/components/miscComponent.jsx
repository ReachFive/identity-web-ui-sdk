import React from 'react';

import { Remarkable } from 'remarkable';
import styled from 'styled-components';
import { compose } from '@hypnosphi/recompose';

import { withGoTo, withTheme } from './widget/widgetContext';

export const Heading = withTheme(styled.div`
    margin-bottom: ${props => props.theme.get('spacing') * 1.5}px;
    text-align: center;
    color: ${props => props.theme.get('headingColor')};
    font-weight: bold;
    font-size: ${props => props.theme.get('fontSize') * 1.2}px;
`); // Derive font size from base font size

const TextBase = styled.div`
    text-align: center;
    margin-bottom: ${props => props.theme.get('spacing')}px;
`;

export const Info = withTheme(styled(TextBase)`
    color: ${props => props.theme.get('textColor')};
`);

export const Error = withTheme(styled(TextBase)`
    color: ${props => props.theme.get('dangerColor')};
`);

export const Intro = Info;

const SeparatorInner = withTheme(styled.div`
    color: ${props => props.theme.get('mutedTextColor')};
    display: block;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    margin: ${props => props.theme.get('spacing')}px 0;

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
        background: ${props => props.theme.get('borderColor')};
    }

    & > span:before {
        right: 100%;
        margin-right: ${props => props.theme.get('fontSize')}px;
    }

    & > span:after {
        left: 100%;
        margin-left: ${props => props.theme.get('fontSize')}px;
    }
`);

export const Separator = ({ text }) => <SeparatorInner><span>{text}</span></SeparatorInner>;

export const Alternative = withTheme(styled.div`
    text-align: center;
    margin-top: ${props => props.theme.get('spacing') * 1.5}px;
    color: ${props => props.theme.get('textColor')};
`);

export const Link = compose(withGoTo, withTheme)(styled(({ target, href = '#', children, goTo, className }) => {
    const onClick = target ? (e => {
        e.preventDefault();
        goTo(target);
    }) : (() => { });

    return (
        <a href={href} onClick={onClick} className={className}>
            {children}
        </a>
    );
})`
    color: ${({ theme }) => theme.get('link.color')};
    text-decoration: ${({ theme }) => theme.get('link.decoration')};
    &:hover {
        color: ${({ theme }) => theme.get('link.hoverColor')};
        text-decoration: ${({ theme }) => theme.get('link.hoverDecoration')};
    }
`);

function buildMarkdownParser() {
    const md = new Remarkable();
    const originalLinkRender = md.renderer.rules.link_open;

    md.inline.ruler.enable(['text', 'newline', 'emphasis', 'links', 'ins']);
    md.block.ruler.enable(['list']);
    md.renderer.rules.link_open = function () {
        return originalLinkRender
            .apply(null, arguments)
            .replace('>', ` target="_blank" rel="nofollow noreferrer noopener">`);
    };

    return md;
}

const markdownParser = buildMarkdownParser();

export const MarkdownContent = ({ source, root: Root }) =>
    <Root data-text='md' dangerouslySetInnerHTML={{ __html: markdownParser.render(source) }} />;
