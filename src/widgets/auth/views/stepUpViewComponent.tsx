import React from 'react';

import { useRouting } from '@/contexts/routing';
import { noop } from '@/helpers/utils';
import { StepUpFlow, type StepUpViewState } from '@/widgets/stepUp/stepUpFlow';

import type { OnError, OnSuccess } from '@/types';

export interface StepUpViewProps {
    /**
     * Callback function called when the request has succeed.
     */
    onSuccess?: OnSuccess;
    /**
     * Callback function called when the request has failed.
     */
    onError?: OnError;
}

/** The step-up screens, opened by a login view with the step-up token and the accepted factors. */
export const StepUpView = ({ onSuccess = noop, onError = noop }: StepUpViewProps) => {
    const { params } = useRouting();
    const { token, amr, auth, allowTrustDevice } = params as StepUpViewState;

    return (
        <StepUpFlow
            token={token}
            amr={amr}
            auth={auth}
            allowTrustDevice={allowTrustDevice}
            onSuccess={onSuccess}
            onError={onError}
        />
    );
};

export default StepUpView;
