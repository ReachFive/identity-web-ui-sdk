import React from 'react';

import styled from 'styled-components';

import { debounce, find } from '../../helpers/utils';

import { PrimaryButton } from './buttonComponent';
import { Error, MutedText } from '../miscComponent';
import { withConfig } from '../../contexts/config'
import { withI18n } from '../../contexts/i18n';
import { logError } from '../../helpers/logger';

const Form = styled.form`
    position: relative;
`;

const RequiredFields = styled(MutedText)`
    display: block;
    padding: ${props => `${props.theme.paddingY}px ${props.theme.paddingX}px`};
    text-align: center;
`

export function createForm(config) {
    class FormComponent extends React.Component {
        static defaultProps = {
            initialModel: {},
            supportMultipleSubmits: false,
            submitLabel: 'send',
            showLabels: false,
            skipError: false,
            fieldValidationDebounce: 1000,
            onFieldChange: x => x,
            ...config
        };

        constructor(props) {
            super(props);

            this.updateFields(props)

            this.state = {
                isLoading: false,
                hasErrors: false,
                errorMessage: null,
                fields: this.applyModel(props.initialModel)
            };
        }

        updateFields(props) {
            this.allFields = (typeof props.fields === 'function' ? props.fields(props) : props.fields ?? []).filter(x => !!x).map(f => (
                !f.staticContent ? f.create({ i18n: props.i18n, showLabel: props.showLabels }) : f
            ));

            this.inputFields = this.allFields.filter(f => !f.staticContent);

            this.fieldByKey = this.inputFields.reduce((acc, field) => ({ ...acc, [field.key]: field }), {});
        }


        UNSAFE_componentWillReceiveProps(props) {
            this.updateFields(props)
        }

        componentWillUnmount() {
            this.unmounted = true;
        }

        applyModel(model) {
            return this.inputFields.reduce((acc, field) => ({
                ...acc,
                [field.key]: field.initialize(model)
            }), {});
        }

        validateField(field, fieldState, formState) {
            return field.validate(fieldState, formState) || {};
        }

        formatErrorMessage(err) {
            const i18nErrorMessage = this.props.i18n(err.errorMessageKey);

            return i18nErrorMessage === err.errorMessageKey ? err.errorUserMsg : i18nErrorMessage;
        }

        // Returns boolean
        validateAllFields(callback) {
            this.setState(prevState => {
                return this.inputFields.reduce((acc, field) => {
                    const fieldState = prevState.fields[field.key];
                    const validation = this.validateField(field, fieldState, { ...prevState, isSubmitted: true });

                    return {
                        isSubmitted: true,
                        hasErrors: acc.hasErrors || !!validation.error,
                        fields: {
                            ...acc.fields,
                            [field.key]: {
                                ...fieldState,
                                validation
                            }
                        }
                    };
                }, { hasErrors: false, fields: [] });
            }, () => callback?.(!this.state.hasErrors));
        }

        handleFieldChange = (fieldName, stateUpdate) => {
            this.setState(prevState => {
                const { validation: _, ...currentState } = prevState.fields[fieldName] ?? {};
                const newState = {
                    ...currentState,
                    ...(typeof stateUpdate === 'function' ? stateUpdate(currentState) : stateUpdate)
                };
                const newFields = {
                    ...prevState.fields,
                    [fieldName]: {
                        ...newState,
                    }
                };

                return {
                    fields: newFields
                };
            });
        };

        handleFieldValidation = (fieldName) => {
            this.setState(prevState => {
                const currentState = prevState.fields[fieldName];
                const validation = this.validateField(this.fieldByKey[fieldName], currentState, this.state);
                const newFields = {
                    ...prevState.fields,
                    [fieldName]: {
                        ...currentState,
                        validation
                    }
                };

                this.props.onFieldChange(newFields);

                return {
                    hasErrors: !!validation.error || find(newFields, ({ validation = {} }) => validation.error) !== undefined,
                    fields: newFields
                };
            });
        };

        onSuccess = result => {
            this.props.onSuccess?.(result);

            if (this.unmounted) return;

            this.setState({
                isLoading: !this.props.supportMultipleSubmits,
                errorMessage: null,
                ...(this.props.resetAfterSuccess ? { fields: this.applyModel({}) } : {})
            });
        };

        onError = err => {
            this.props.onError.onError?.(err);

            if (!err.errorUserMsg) {
                if (err.errorDescription) {
                    logError(err.errorDescription)
                } else {
                    logError(err)
                }
            }

            if (this.unmounted) return;
            this.setState({
                isLoading: false,
                errorMessage: this.formatErrorMessage(err) || this.props.i18n('unexpectedErrorOccurred'),
                ...(this.props.resetAfterError ? { fields: this.applyModel({}) } : {})
            });
        };

        handleSubmit = event => {
            event.preventDefault();

            this.validateAllFields(isValid => {
                if (isValid) {
                    this.setState({ isLoading: true });

                    const fieldData = this.inputFields.reduce((acc, field) => {
                        return field.unbind(acc, this.state.fields[field.key]);
                    }, {});

                    const processedData = this.props.beforeSubmit ? this.props.beforeSubmit(fieldData) : fieldData;

                    this.props.handler(processedData)
                        .then(this.onSuccess)
                        .catch(err => typeof this.props.skipError === 'function' && this.props.skipError(err)
                            ? this.onSuccess()
                            : this.onError(err));
                }
            });
        };

        handleClick = event => {
            event.preventDefault();

            this.validateAllFields(isValid => {
                if (isValid) {
                    this.setState({ isLoading: true });

                    const fieldData = this.inputFields.reduce((acc, field) => {
                        return field.unbind(acc, this.state.fields[field.key]);
                    }, {});

                    this.props.redirect(fieldData);
                }
            });
        }

        render() {
            const { showLabels, submitLabel, enablePasswordAuthentication, allowWebAuthnLogin, i18n, fieldValidationDebounce } = this.props;
            const { errorMessage, isLoading, fields } = this.state;

            return <Form noValidate onSubmit={this.handleSubmit}>
                {errorMessage && <Error>{errorMessage}</Error>}
                {
                    this.allFields.map(field => !field.staticContent ? field.render({
                        state: fields[field.key],
                        onChange: newState => {
                            this.handleFieldChange(field.key, newState);
                            debounce(function (component) {
                                component.handleFieldValidation(field.key)
                            }, fieldValidationDebounce)(this);
                        },
                        ...this.props.sharedProps
                    }) : field.staticContent)
                }
                {!allowWebAuthnLogin && (
                    <PrimaryButton disabled={isLoading}>
                        {i18n(typeof submitLabel === 'function' ? submitLabel(this.props) : submitLabel)}
                    </PrimaryButton>
                )}
                {allowWebAuthnLogin && this.props.webAuthnButtons(isLoading, enablePasswordAuthentication, this.handleClick)}
                {showLabels && <RequiredFields>*{i18n('form.required.fields')}</RequiredFields>}
            </Form>;
        }
    }

    return withConfig(withI18n(FormComponent));
}
