import React, { useState } from 'react';

import PasswordSignupForm, {
    type PasswordSignupFormProps,
} from '../../../components/form/passwordSignupFormComponent';
import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { useI18n } from '../../../contexts/i18n';

export interface SignupWithPasswordViewProps extends PasswordSignupFormProps {}

export const SignupWithPasswordView = (props: SignupWithPasswordViewProps) => {
    const i18n = useI18n();
    const [isAwaitingIdentifierVerification, setIsAwaitingIdentifierVerification] =
        useState<boolean>(false);
    return (
        <div>
            {isAwaitingIdentifierVerification ? (
                <div className="success">{i18n('signup.awaiting.identifier.verification')}</div>
            ) : (
                <Heading>{i18n('signup.withPassword')}</Heading>
            )}
            {!isAwaitingIdentifierVerification && (
                <PasswordSignupForm
                    {...props}
                    setIsAwaitingIdentifierVerification={setIsAwaitingIdentifierVerification}
                />
            )}
            <Alternative>
                <Link target={'signup'}>{i18n('back')}</Link>
            </Alternative>
        </div>
    );
};

export default SignupWithPasswordView;
