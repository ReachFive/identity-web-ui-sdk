import React from 'react';

import { useSuspenseQuery } from '@tanstack/react-query';

import type { AuthOptions } from '@reachfive/identity-core';

import { createQueryWidget } from '@/components/widget/queryWidget';
import { useReachfive } from '@/contexts/reachfive';
import { logWarn } from '@/helpers/logger';
import { noop } from '@/helpers/utils';
import { StepUpFlow } from '@/widgets/stepUp/stepUpFlow';

import type { OnError, OnSuccess } from '@/types';

export type MfaStepUpWidgetProps = {
    /**
     * **Not recommended**
     *
     * The authorization credential JSON Web Token (JWT) used to access the ReachFive API, less than five minutes old.
     *
     * If empty, using an existing SSO session cookie.
     */
    accessToken?: string;
    /**
     * List of authentication options
     */
    auth?: AuthOptions;
    /**
     * Boolean that specifies whether a device can be trusted during step up.
     *
     * @default false
     */
    allowTrustDevice?: boolean;
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
    /**
     * Action used in template
     */
    action?: string;
    /**
     * @deprecated Has no effect.
     */
    showIntro?: boolean;
    /**
     * @deprecated Has no effect: the step-up starts on mount.
     */
    showStepUpStart?: boolean;
};

const MfaStepUp = ({
    accessToken,
    auth,
    action,
    allowTrustDevice = false,
    onSuccess = noop,
    onError = noop,
}: MfaStepUpWidgetProps) => {
    const client = useReachfive();
    // One request per widget: the query is shared by key, even when React renders twice.
    const { data } = useSuspenseQuery({
        queryKey: ['mfaStepUp', accessToken, action],
        queryFn: () => client.getMfaStepUpToken({ options: auth, accessToken, action }),
        staleTime: Infinity,
        retry: false,
    });

    return (
        <StepUpFlow
            token={data.token}
            amr={data.amr}
            auth={auth}
            allowTrustDevice={allowTrustDevice}
            onSuccess={onSuccess}
            onError={onError}
        />
    );
};

export default createQueryWidget<MfaStepUpWidgetProps>({
    component: MfaStepUp,
    prepare: (options, _ctx) => {
        if (options.showStepUpStart !== undefined) {
            logWarn(
                'showStepUpStart is deprecated and has no effect: the step-up starts when the widget opens.'
            );
        }
        return options;
    },
});
