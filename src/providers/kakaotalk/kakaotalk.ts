import icon from './kakaotalk.svg';

import type { Provider } from '../providers'

export default {
    key: 'kakaotalk',
    name: 'KakaoTalk',
    color: '#ffe806',
    btnTextColor: '#000000',
    icon,
    windowSize: {
        width: 450,
        height: 400
    }
} satisfies Provider;
