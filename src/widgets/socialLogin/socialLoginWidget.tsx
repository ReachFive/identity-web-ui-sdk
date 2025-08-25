import { SocialButtons } from '../../components/form/socialButtonsComponent';
import { createWidget } from '../../components/widget/widget';

import type { SocialButtonsProps } from '../../components/form/socialButtonsComponent';

export interface SocialLoginWidgetProps extends Omit<SocialButtonsProps, 'providers'> {
    /**
     * Lists the available social providers. This is an array of strings.
     *
     * Tip: If you pass an empty array, social providers will not be displayed.
     * */
    socialProviders?: SocialButtonsProps['providers'];
}

export default createWidget<SocialLoginWidgetProps, SocialButtonsProps>({
    name: 'social-login',
    standalone: false,
    component: SocialButtons,
    prepare: ({ socialProviders, ...options }, { config }) => ({
        providers: (Array.isArray(socialProviders) && socialProviders) || config.socialProviders,
        ...options,
    }),
});
