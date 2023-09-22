// From Bootstrap 4
import get from 'lodash-es/get';
import isUndefined from 'lodash-es/isUndefined';
import isFunction from 'lodash-es/isFunction';
import { lighten, transparentize, darken } from 'polished';

/* eslint-disable @typescript-eslint/no-unused-vars */
const white = '#fff';
const gray100 = '#f8f9fa';
const gray200 = '#e9ecef';
const gray300 = '#dee2e6';
const gray400 = '#ced4da';
const gray500 = '#adb5bd';
const gray600 = '#868e96';
const gray700 = '#495057';
const gray800 = '#343a40';
const gray900 = '#212529';
const black = '#000';
/* eslint-enable @typescript-eslint/no-unused-vars */

const inputBtnFocusBoxShadow = borderColor => `0 0 0 3px ${transparentize(0.5, borderColor)}`;

export default function resolveTheme(theme = {}) {
    return new Theme(theme, {
        animateWidgetEntrance: () => true,
        fontSize: () => 14,
        smallTextFontSize: () => 12,
        lineHeight: () => 1.428571429,
        headingColor: () => gray900,
        textColor: () => gray700,
        mutedTextColor: () => gray500,
        borderRadius: () => 3,
        borderColor: () => gray400,
        borderWidth: () => 1,
        backgroundColor: () => '#ffffff',
        primaryColor: () => '#229955',
        dangerColor: () => '#dc4e41',
        warningColor: () => '#ffc107',
        successColor: () => '#229955',
        lightBackgroundColor: () => gray200,
        paddingY: _ => Math.round(_.get('fontSize') * _.get('lineHeight')) / 2 - _.get('borderWidth'),
        paddingX: _ => Math.round(_.get('paddingY') * 4 / 3),
        spacing: _ => Math.round(_.get('_blockHeight') / 4),
        maxWidth: () => 400,
        _absoluteLineHeight: _ => Math.round(_.get('fontSize') * _.get('lineHeight')),
        _blockInnerHeight: _ => _.get('_absoluteLineHeight') + 2 * _.get('paddingY'),
        _blockHeight: _ => _.get('_blockInnerHeight') + 2 * _.get('borderWidth'),
        link: {
            color: _ => _.get('primaryColor'),
            decoration: () => 'none',
            hoverColor: _ => darken(0.15, _.get('link.color')),
            hoverDecoration: () => 'none'
        },
        input: {
            color: () => gray700,
            placeholderColor: () => gray600,
            fontSize: _ => _.get('fontSize'),
            lineHeight: _ => _.get('lineHeight'),
            paddingX: _ => _.get('paddingX'),
            paddingY: _ => _.get('paddingY'),
            borderRadius: _ => _.get('borderRadius'),
            borderColor: _ => _.get('borderColor'),
            borderWidth: _ => _.get('borderWidth'),
            background: () => white,
            disabledBackground: () => gray200,
            boxShadow: () => 'none',
            focusBorderColor: _ => lighten(0.25, _.get('primaryColor')),
            focusBoxShadow: () => inputBtnFocusBoxShadow,
            height: _ => Math.round(_.get('input.fontSize') * _.get('input.lineHeight'))
                + 2 * _.get('input.paddingY') + 2 * _.get('input.borderWidth')
        },
        button: {
            fontWeight: () => 'bold',
            fontSize: _ => _.get('fontSize'),
            lineHeight: _ => _.get('lineHeight'),
            paddingX: _ => _.get('paddingX'),
            paddingY: _ => _.get('paddingY'),
            borderRadius: _ => _.get('borderRadius'),
            borderWidth: _ => _.get('borderWidth'),
            focusBoxShadow: () => inputBtnFocusBoxShadow,
            height: _ => Math.round(_.get('button.fontSize') * _.get('button.lineHeight'))
                + 2 * _.get('button.paddingY') + 2 * _.get('button.borderWidth')
        },
        socialButton: {
            inline: () => false,
            textVisible: _ => !_.get('socialButton.inline'),
            fontWeight: _ => _.get('button.fontWeight'),
            fontSize: _ => _.get('button.fontSize'),
            lineHeight: _ => _.get('button.lineHeight'),
            paddingX: _ => _.get('button.paddingX'),
            paddingY: _ => _.get('button.paddingY'),
            borderRadius: _ => _.get('button.borderRadius'),
            borderWidth: _ => _.get('button.borderWidth'),
            focusBoxShadow: () => () => undefined,
            height: _ => _.get('socialButton.fontSize') * _.get('socialButton.lineHeight')
                + 2 * _.get('socialButton.paddingY') + 2 * _.get('socialButton.borderWidth')
        },
        passwordStrengthValidator: {
            color0: _ => _.get('dangerColor'),
            color1: _ => _.get('dangerColor'),
            color2: _ => _.get('warningColor'),
            color3: _ => lighten(0.2, _.get('successColor')),
            color4: _ => _.get('successColor')
        }
    });
}

class Theme {
    constructor(props, defaults) {
        this.props = props;
        this.defaults = defaults;

        this.cache = {};
    }

    get(prop) {
        if (!(prop in this.cache)) {
            this.cache[prop] = this._doGet(prop);
        }

        return this.cache[prop];
    }

    _doGet(prop) {
        const result = get(this.props, prop);

        if (!isUndefined(result)) return result;
        const defaultResolver = get(this.defaults, prop);

        if (isUndefined(defaultResolver)) throw new Error('Unknown theme attribute: ' + prop);
        if (!isFunction(defaultResolver)) throw new Error('Invalid theme attribute resolver: ' + defaultResolver);

        return defaultResolver(this);
    }
}
