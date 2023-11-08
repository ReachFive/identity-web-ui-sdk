import React from 'react';
import {createMultiViewWidget} from '../../components/widget/widget';
import {deepDefaults} from '../../helpers/deepDefaults';
import {createForm} from '../../components/form/formComponent';
import radioboxField from '../../components/form/fields/radioboxField';
import {Info, Intro} from '../../components/miscComponent';
import {simpleField} from '../../components/form/fields/simpleField';
import {toQueryString} from '../../helpers/queryString';

const StartStepUpMfaButton = createForm({
    prefix: 'r5-mfa-start-step-up-',
    submitLabel: 'mfa.stepUp.start',
});

const VerificationCodeInputForm = createForm({
    prefix: 'r5-passwordless-sms-',
    fields: [
        simpleField({
            key: 'verification_code',
            label: 'verificationCode',
            type: 'text'
        })
    ]
});

const StartPasswordlessForm = createForm({
    prefix: 'r5-mfa-start-passwordless',
    fields({options}) {
        return [
            radioboxField({
                key: 'authType',
                options
            }),
        ]
    }
})

class MainView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {response: undefined}
    }

    componentDidMount() {
        this.onGetStepUpToken()
    }

    onGetStepUpToken = () => {
        return this.props.apiClient.getMfaStepUpToken({
            options: this.props.auth,
            accessToken: this.props.accessToken
        }).then(res => this.setState({response: res}))
    }
    render() {
        const {showStepUpStart, goTo} = this.props
        return this.state.response === undefined ? null : <div>
            {showStepUpStart ?
                <StartStepUpMfaButton
                    handler={this.onGetStepUpToken}
                    onSuccess={_ => goTo('fa-selection', this.state.response)}
                /> : <FaSelectionView {...this.state.response} {...this.props}/>}
        </div>
    }
}

export class FaSelectionView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {response: undefined}
    }

    componentDidMount() {
        if (this.props.amr.length == 1)
            this.onChooseFa({authType: this.props.amr[0]})
        else
            this.setState({response: {}})
    }

    onChooseFa = factor => this.props.apiClient.startPasswordless({
        ...factor,
        stepUp: this.props.token,
    }).then(res => this.setState({response: {...res, ...factor}}))

    render() {
        const {amr, showIntro, i18n} = this.props
        return this.state.response === undefined ? null : amr.length == 1 ?
            <VerificationCodeView {...this.state.response} {...this.props}/>
            : <div>
                {showIntro && <Intro>{i18n('mfa.select.factor')}</Intro>}
                <StartPasswordlessForm
                    options={amr.map(factor => ({key: factor, value: factor, label: factor}))}
                    handler={this.onChooseFa}
                    onSuccess={(data) => this.props.goTo('verification-code', {...data, amr, ...this.state.response})}/>
            </div>
    }
}

export class VerificationCodeView extends React.Component {
    handleSubmit = data => {
        const {apiClient, auth, challengeId, accessToken} = this.props;
        return apiClient
            .verifyMfaPasswordless({challengeId, verificationCode: data.verificationCode, accessToken})
            .then(resp =>
                window.location.replace(auth.redirectUri + "?" + toQueryString(resp)),
            )
    }

    render() {
        return <div>
            {this.props.authType === "sms" && <Info>{this.props.i18n('passwordless.sms.verification.intro')}</Info>}
            {this.props.authType === "email" && <Info>{this.props.i18n('passwordless.email.verification.intro')}</Info>}
            <VerificationCodeInputForm handler={this.handleSubmit}/>
        </div>;
    }
}


export default createMultiViewWidget({
    initialView: 'main',
    views: {
        'main': MainView,
        'fa-selection': FaSelectionView,
        'verification-code': VerificationCodeView
    },
    prepare: (options) => {
        return deepDefaults(
            {},
            options,
            {
                showIntro: true,
                showStepUpStart: true
            })
    }
})
