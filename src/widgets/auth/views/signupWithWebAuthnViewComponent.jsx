import React from 'react';

import { Heading, Link } from '../../../components/miscComponent';
import MultiSignupForm from '../../../components/form/multiSignupFormComponent';


export default class SignupWithWebAuthnView extends React.Component {
    render() {
        return <div>
            <Heading>Signup with FIDO2</Heading>
            <MultiSignupForm {...this.props} />
            <Link target={'signup'}>Back</Link>
        </div>;
    }
}
