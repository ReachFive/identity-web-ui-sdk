import React from 'react';

import { Heading, Link, Alternative, Separator } from '../../../components/miscComponent';
import SocialButtons from '../../../components/form/socialButtonsComponent';
import MultiSignupForm from '../../../components/form/multiSignupFormComponent';


export default class SignupView extends React.Component {
    render() {
        const { socialProviders, i18n } = this.props;

        return <div>
            <Heading>{i18n('signup.title')}</Heading>
            {socialProviders && socialProviders.length > 0 &&
                <SocialButtons providers={socialProviders} auth={this.props.auth} />}
            {socialProviders && socialProviders.length > 0 && <Separator text={i18n('or')} />}

            {this.props.allowWebAuthnSignup
                ? <div>
                    <Link target={'signup-with-web-authn'}>FIDO2</Link>
                    <Separator text={i18n('or')} />
                    <Link target={'signup-with-password'}>Password</Link>
                </div>
                : <MultiSignupForm {...this.props} />
            }

            {this.props.allowLogin && <Alternative>
                <span>{i18n('signup.loginLinkPrefix')}</span>
                &nbsp;
                <Link target={this.props.allowWebAuthnLogin ? 'login-with-web-authn' : 'login'}>
                    {i18n('signup.loginLink')}
                </Link>
            </Alternative>}
        </div>;
    }
}
