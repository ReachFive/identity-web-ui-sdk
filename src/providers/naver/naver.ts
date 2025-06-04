import icon from './naver.svg';

import type { Provider } from '../providers';

export default {
    key: 'naver',
    name: 'Naver',
    color: '#19CE60',
    icon,
    windowSize: {
        width: 450,
        height: 400,
    },
} satisfies Provider;
