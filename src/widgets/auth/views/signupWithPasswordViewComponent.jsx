import React from 'react';

import { Heading, Link } from '../../../components/miscComponent';


export default class SignupWithPasswordView extends React.Component {
    render() {
        return <div>
            <Heading>Signup with password</Heading>
            <Link target={'signup'}>Back</Link>
        </div>;
    }
}
