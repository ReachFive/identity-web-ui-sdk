import React, { useState } from 'react';

import { SignupEvent } from '@/types/events';

import PasswordSignupForm, {
    type PasswordSignupFormProps,
} from '../../../components/form/passwordSignupFormComponent';
import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { useI18n } from '../../../contexts/i18n';

import type { OnSuccess } from '@/types';

export interface SignupWithPasswordViewProps extends PasswordSignupFormProps {}

export const SignupWithPasswordView = ({
    onSuccess = (() => {}) satisfies OnSuccess,
    ...props
}: SignupWithPasswordViewProps) => {
    const i18n = useI18n();
    const [isAwaitingIdentifierVerification, setIsAwaitingIdentifierVerification] =
        useState<boolean>(false);
    const enrichedOnSuccess = (evt: SignupEvent) => {
        setIsAwaitingIdentifierVerification(evt.isIdentifierVerificationRequired);
        onSuccess(evt);
    };
    return (
        <div>
            {isAwaitingIdentifierVerification ? (
                <div className="success">{i18n('signup.awaiting.identifier.verification')}</div>
            ) : (
                <div>
                    <Heading>{i18n('signup.withPassword')}</Heading>
                    <PasswordSignupForm {...props} onSuccess={enrichedOnSuccess as OnSuccess} />
                </div>
            )}
            <Alternative>
                <Link target={'signup'}>{i18n('back')}</Link>
            </Alternative>
        </div>
    );
};

export default SignupWithPasswordView;
