import icon from './apple.svg';

import type { Provider } from '../providers';

export default {
    key: 'apple',
    name: 'Apple',
    // Apple's Human Interface Guidelines require the button to read "Sign in with Apple"
    buttonLabel: 'Sign in with Apple',
    color: '#000',
    fontWeight: 400,
    fontFamily: 'SF Pro Text,SF Pro Icons,Helvetica Neue,Helvetica,Arial,sans-serif',
    icon,
} satisfies Provider;
