import React from 'react';

import { marked } from 'marked';

const linkClassName =
    'text-link-text underline-offset-4 hover:text-link-hover-text hover:underline';

const escapeAttribute = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Overriding marked's `link` renderer bypasses its built-in `cleanUrl()`, so the scheme is checked
 * here: only http(s), mailto and relative references are let through.
 */
const safeHref = (href: string): string | null => {
    const url = href.trim();
    return /^(https?:|mailto:|[/#.?])/i.test(url) ? url : null;
};

marked.use({
    renderer: {
        link({ href, title, tokens }) {
            const text = this.parser.parseInline(tokens);
            const url = safeHref(href);
            if (url === null) return text;
            return (
                `<a href="${escapeAttribute(url)}"` +
                (title ? ` title="${escapeAttribute(title)}"` : '') +
                ' target="_blank" rel="nofollow noreferrer noopener"' +
                ` class="${linkClassName}">${text}</a>`
            );
        },
    },
    extensions: [
        // specific underline markup is missed in marked module
        // see https://marked.js.org/using_pro#extensions
        {
            name: 'underline',
            level: 'inline',
            start(src) {
                return /\+{2}/.exec(src)?.index; // starts with ++
            },
            tokenizer(src) {
                const rule = /^\+{2}([^+\n]+)\+{2}/;
                const match = rule.exec(src);
                if (match) {
                    return {
                        type: 'underline',
                        raw: match[0],
                        text: match[1],
                        tokens: this.lexer.inlineTokens(match[1]),
                    };
                }
            },
            renderer(token) {
                return `<u>${token.text}</u>`;
            },
        },
    ],
});

interface MarkdownContentProps<T> extends React.HTMLAttributes<T> {
    root: React.ComponentType<React.HTMLAttributes<T>>;
    source: string;
}

function MarkdownContent<T>({ root: Root, source, ...props }: MarkdownContentProps<T>) {
    return (
        <Root
            data-text="md"
            dangerouslySetInnerHTML={{ __html: marked.parse(source) }}
            {...props}
        />
    );
}

export { marked, MarkdownContent };
