import type { AuthOptions } from '@reachfive/identity-core';

import { createWidget } from '../../components/widget/widget';
import { SocialButtons } from '../../components/form/socialButtonsComponent';
import type { SocialButtonsProps } from '../../components/form/socialButtonsComponent';

export interface SocialLoginWidgetProps {
    /**
     * @deprecated
     */
    acceptTos?: boolean
    /**
     * List of authentication options
     */
    auth?: AuthOptions
    /**
     * Lists the available social providers. This is an array of strings.
     * 
     * Tip: If you pass an empty array, social providers will not be displayed. 
     * */
    providers: string[]
}

export default createWidget<SocialLoginWidgetProps, SocialButtonsProps>({
    name: 'social-login',
    standalone: false,
    component: SocialButtons,
    prepare: ({ providers, ...options }, { config }) => ({
        providers: providers || config.socialProviders,
        ...options,
    })
});
