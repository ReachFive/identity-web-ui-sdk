import icon from './qq.svg';

import type { Provider } from '../providers'

export default {
    key: 'qq',
    name: 'QQ',
    color: '#0071c3',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
