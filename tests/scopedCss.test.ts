import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import path from 'path';
import postcss, { type Rule } from 'postcss';

import postcssConfig from '../postcss.config.cjs';

const SCOPE = '.r5-widget';

const isInsideKeyframes = (rule: Rule) =>
    rule.parent?.type === 'atrule' && (rule.parent as { name: string }).name.endsWith('keyframes');

describe('injected CSS', () => {
    test('scopes every rule to the widget so it does not style the host page', async () => {
        const from = path.resolve(__dirname, '../src/index.css');
        const { root } = await postcss(postcssConfig.plugins).process(readFileSync(from, 'utf8'), {
            from,
        });

        const unscoped: string[] = [];
        root.walkRules(rule => {
            if (isInsideKeyframes(rule)) return;
            rule.selectors
                .filter(selector => !selector.startsWith(`${SCOPE} `))
                .forEach(selector => unscoped.push(selector));
        });

        expect(unscoped).toEqual([]);
    }, 30000);
});
