import React from 'react';

import PropTypes from 'prop-types';
import pick from 'lodash-es/pick';
import isFunction from 'lodash-es/isFunction';
import { withContext } from 'recompose';

import resolveTheme from '../../core/theme';
import resolveI18n from '../../core/i18n';
import WidgetContainer from './widgetContainerComponent';

const contextEnhancer = withContext(
    {
        theme: PropTypes.object.isRequired,
        i18n: PropTypes.func.isRequired,
        config: PropTypes.object.isRequired,
        apiClient: PropTypes.object.isRequired,
        redirectUrl: PropTypes.object,
    },
    props => pick(props, ['theme', 'i18n', 'config', 'apiClient'])
);

export function createWidget({ component, prepare = (x => x), ...widgetAttrs }) {
    return (options = {}, context = {}) => {
        return Promise.resolve(prepare(options, context)).then(preparedOptions => {
            const Component = contextEnhancer(component);

            const { i18n, theme, ...optionsRest } = preparedOptions;
            const fullProps = {
                ...optionsRest,
                ...context,
                i18n: resolveI18n(context.defaultI18n, i18n),
                theme: resolveTheme(theme)
            };

            return (
                <WidgetContainer {...widgetAttrs} {...fullProps}>
                    <Component {...fullProps} />
                </WidgetContainer>
            );
        });
    }
}

export const createMultiViewWidget = ({ prepare, ...params }) => {
    return createWidget({
        component: multiViewWidget(params),
        prepare,
        noIntro: true
    });
}

function multiViewWidget({ initialView, views, initialState = {}, onStartup, handlers }) {
    return class extends React.Component {
        state = {
            ...initialState,
            activeView: isFunction(initialView) ? initialView(this.props) : initialView
        };

        static childContextTypes = {
            goTo: PropTypes.func.isRequired
        };

        getChildContext() {
            return {
                goTo: this._goTo
            };
        }

        componentDidMount() {
            onStartup && onStartup(this.props, this._setState);
        }

        _setState = param => this.setState(param);

        _goTo = (view, props) => this.setState({ activeView: view, ...props });

        render() {
            const preparedHandlers = handlers ? handlers(this.props, this._setState) : {};
            const ActiveComponent = views[this.state.activeView];

            return <ActiveComponent
                {...this.props}
                {...preparedHandlers}
                {...this.state}
                goTo={this._goTo} />;
        }
    }
}
