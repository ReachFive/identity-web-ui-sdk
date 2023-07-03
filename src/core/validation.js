import validator from 'validator';

import { isValued } from '../helpers/utils'
import isFunction from 'lodash-es/isFunction';

class CompoundValidator {
    constructor(current, next) {
        this.current = current;
        this.next = next;
    }

    create(i18n) {
        const current = this.current.create(i18n);
        const next = this.next.create(i18n);

        return (value, ctx) => current(value, ctx) || next(value, ctx);
    }

    and(validator) {
        return new CompoundValidator(this, validator);
    }
}

export class Validator {
    constructor({ rule, hint, parameters = [] }) {
        this.rule = rule;
        this.hint = !isFunction(hint) ? _ => hint : hint;
        this.parameters = parameters;
    }

    create(i18n) {
        const errorMessage = v => i18n(`validation.${this.hint(v)}`, this.parameters);
        return (value, ctx) => !this.rule(value, ctx) && { error: errorMessage(value) };
    }

    and(validator) {
        return new CompoundValidator(this, validator);
    }
}

export const empty = new Validator({
    rule: () => true
});

export const required = new Validator({
    rule: value => isValued(value),
    hint: 'required'
});

export const checked = new Validator({
    rule: value => value === true,
    hint: 'checked'
});

const emailRegex = new RegExp("^[a-zA-Z0-9\.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")

export const email = new Validator({
    rule: value =>  emailRegex.test(value),
    hint: 'email'
});

export const integer = new Validator({
    rule: validator.isInt,
    hint: 'integer'
});

export const float = new Validator({
    rule: validator.isFloat,
    hint: 'float'
});
