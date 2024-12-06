import validator from 'validator';

import { isValued } from '../helpers/utils'
import { I18nResolver } from './i18n';

export class CompoundValidator<T, C = {}> {
    current: Validator<T, C> | CompoundValidator<T, C>
    next: Validator<T, C> | CompoundValidator<T, C>

    constructor(current: Validator<T, C> | CompoundValidator<T, C>, next: Validator<T, C> | CompoundValidator<T, C>) {
        this.current = current;
        this.next = next;
    }

    create(i18n: I18nResolver): ValidatorInstance<T, C> {
        const current = this.current.create(i18n);
        const next = this.next.create(i18n);

        return (value: T, ctx: C) => current(value, ctx) || next(value, ctx);
    }

    and(validator: Validator<T, C> | CompoundValidator<T, C>) {
        return new CompoundValidator(this, validator);
    }
}

export type VaildatorError = { error: string }
export type ValidatorSuccess = { success?: true }

export type ValidatorResult = boolean | VaildatorError | ValidatorSuccess

export type ValidatorInstance<T, C> = (value: T, ctx: C) => ValidatorResult

export type Rule<T, C> = (value: T, ctx: C) => boolean

export type Hint<T> = (value: T) => (string | undefined)

export function isVaildationError(result: ValidatorResult): result is VaildatorError {
    return (result as VaildatorError).error !== undefined;
}

export function isValidatorSuccess(result: ValidatorResult): result is ValidatorSuccess {
    return (typeof result === 'boolean' && result === false) || (result as ValidatorSuccess).success !== undefined;
}

export interface ValidatorOptions<T, C> {
    rule: Rule<T, C>
    hint?: Hint<T> | string
    parameters?: Record<string, unknown>
}

export class Validator<T, C = {}> {
    rule: Rule<T, C>
    hint: Hint<T>
    parameters: Record<string, unknown>

    constructor({ rule, hint, parameters = {} }: ValidatorOptions<T, C>) {
        this.rule = rule;
        this.hint = typeof hint !== 'function' ? () => hint : hint;
        this.parameters = parameters;
    }

    create(i18n: I18nResolver): ValidatorInstance<T, C> {
        const errorMessage = (value: T) => i18n(`validation.${this.hint(value)}`, this.parameters);
        return (value: T, ctx: C) => !this.rule(value, ctx) && { error: errorMessage(value) };
    }

    and(validator: Validator<T, C> | CompoundValidator<T, C>) {
        return new CompoundValidator(this, validator);
    }
}

export const empty = new Validator({
    rule: <T>(_value: T) => true
});

export const required = new Validator({
    rule: <T>(value: T | undefined) => isValued(value),
    hint: 'required'
});

export const checked = new Validator<boolean | string>({
    rule: value => typeof value === 'boolean' ? value === true : value.toLowerCase() === 'true',
    hint: 'checked'
});

export const email = new Validator<string>({
    rule: value => validator.isEmail(value),
    hint: 'email'
});

export const integer = new Validator<string>({
    rule: value => validator.isInt(value),
    hint: 'integer'
});

export const float = new Validator<string>({
    rule: value => validator.isFloat(value),
    hint: 'float'
});
