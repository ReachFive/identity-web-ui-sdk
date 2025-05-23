import React from 'react';

import PasswordSignupForm, {
    type PasswordSignupFormProps,
} from '../../../components/form/passwordSignupFormComponent';
import { Alternative, Heading, Link } from '../../../components/miscComponent';
import { useI18n } from '../../../contexts/i18n';

export interface SignupWithPasswordViewProps extends PasswordSignupFormProps {}

export const SignupWithPasswordView = (props: SignupWithPasswordViewProps) => {
    const i18n = useI18n();
    return (
        <div>
            <Heading>{i18n('signup.withPassword')}</Heading>
            <PasswordSignupForm {...props} />
            <Alternative>
                <Link target={'signup'}>{i18n('back')}</Link>
            </Alternative>
        </div>
    );
};

export default SignupWithPasswordView;
