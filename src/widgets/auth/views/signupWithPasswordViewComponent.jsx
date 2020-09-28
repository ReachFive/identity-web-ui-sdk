import React from 'react';

import { Alternative, Heading, Link } from '../../../components/miscComponent';
import PasswordSignupForm from '../../../components/form/passwordSignupFormComponent';

export default class SignupWithPasswordView extends React.Component {
    render() {
        return <div>
            <Heading>{this.props.i18n('signup.withPassword')}</Heading>
            <PasswordSignupForm {...this.props} />
            <Alternative>
                <Link target={'signup'}>{this.props.i18n('back')}</Link>
            </Alternative>
        </div>;
    }
}
