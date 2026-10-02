import { describe, expect, test } from '@jest/globals';

import { marked } from '@/components/markdown';

describe('markdown link renderer', () => {
    test('renders an external anchor with the link classes', () => {
        expect(marked.parse('see [terms](https://example.com "T&C") please')).toContain(
            '<a href="https://example.com" title="T&amp;C" target="_blank" rel="nofollow noreferrer noopener" class="text-link-text underline-offset-4 hover:text-link-hover-text hover:underline">terms</a>'
        );
    });

    test('renders nested inline markup inside the link', () => {
        expect(marked.parse('[**bold** and ++under++](/local)')).toContain(
            '<strong>bold</strong> and <u>under</u></a>'
        );
    });

    test('drops javascript: hrefs but keeps the label', () => {
        const html = marked.parse('[click](javascript:alert(1))') as string;
        expect(html).not.toContain('javascript:');
        expect(html).toContain('click');
        expect(html).not.toContain('<a ');
    });
});
