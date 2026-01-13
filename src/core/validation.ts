import { type TFunction } from 'i18next';
import isEmail from 'validator/lib/isEmail';
import isFloat from 'validator/lib/isFloat';
import isInt from 'validator/lib/isInt';

import { isValued } from '../helpers/utils';

export class CompoundValidator<T, C = unknown> {
    current: Validator<T, C> | CompoundValidator<T, C>;
    next: Validator<T, C> | CompoundValidator<T, C>;

    constructor(
        current: Validator<T, C> | CompoundValidator<T, C>,
        next: Validator<T, C> | CompoundValidator<T, C>
    ) {
        this.current = current;
        this.next = next;
    }

    create(i18n: TFunction): ValidatorInstance<T, C> {
        const current = this.current.create(i18n);
        const next = this.next.create(i18n);

        return async (value: T, ctx: C) => {
            const currentValidation = await current(value, ctx);
            if (isValidatorError(currentValidation)) return currentValidation;
            const { valid, ...extra } = currentValidation;
            return { ...extra, ...(await next(value, ctx)) };
        };
    }

    and(validator: Validator<T, C> | CompoundValidator<T, C>) {
        return new CompoundValidator(this, validator);
    }
}

export type ValidatorError<Extra = {}> = { valid: false; error?: string } & Extra;
export type ValidatorSuccess<Extra = {}> = { valid: true } & Extra;

export type ValidatorResult<Extra = {}> = ValidatorError<Extra> | ValidatorSuccess<Extra>;

export type ValidatorInstance<T, C, Extra = {}> = (
    value: T,
    ctx: C
) => Promise<ValidatorResult<Extra>>;

type RuleResult<E = {}> = boolean | ValidatorSuccess<E> | ValidatorError<E>;

export type Rule<T, C, E = {}> = (value: T, ctx: C) => RuleResult<E> | Promise<RuleResult<E>>;

export type Hint<T> = (value: T) => string | undefined;

export function isValidatorError<E = {}>(result: ValidatorResult<E>): result is ValidatorError<E> {
    return result.valid === false;
}

export function isValidatorSuccess<E = {}>(
    result: ValidatorResult<E>
): result is ValidatorSuccess<E> {
    return result.valid === true;
}

export interface ValidatorOptions<T, C, E = {}> {
    rule: Rule<T, C, E>;
    hint?: Hint<T> | string;
    parameters?: Record<string, unknown>;
}

export class Validator<T, C = unknown, E = {}> {
    rule: Rule<T, C, E>;
    hint: Hint<T>;
    parameters: Record<string, unknown>;

    constructor({ rule, hint, parameters = {} }: ValidatorOptions<T, C, E>) {
        this.rule = rule;
        this.hint = typeof hint !== 'function' ? () => hint : hint;
        this.parameters = parameters;
    }

    create(i18n: TFunction): ValidatorInstance<T, C, E> {
        const errorMessage = (value: T) => i18n(`validation.${this.hint(value)}`, this.parameters);
        return async (value: T, ctx: C) => {
            const res = this.rule(value, ctx);
            const result = await (res instanceof Promise ? res : Promise.resolve(res));
            return typeof result === 'boolean'
                ? result
                    ? { valid: true }
                    : { valid: false, error: errorMessage(value) }
                : isValidatorError(result)
                  ? { ...result, error: errorMessage(value) }
                  : result;
        };
    }

    and(validator: Validator<T, C> | CompoundValidator<T, C>) {
        return new CompoundValidator(this, validator);
    }
}

export const empty = new Validator<unknown, unknown>({
    rule: <T>(_value: T) => true,
});

export const required = new Validator<unknown, unknown>({
    rule: <T>(value: T | undefined) => isValued(value),
    hint: 'required',
});

export const checked = new Validator<boolean | string, unknown>({
    rule: value => (typeof value === 'boolean' ? value === true : value.toLowerCase() === 'true'),
    hint: 'checked',
});

export const email = new Validator<string, unknown>({
    rule: value => isEmail(value),
    hint: 'email',
});

export const integer = new Validator<string, unknown>({
    rule: value => isInt(value),
    hint: 'integer',
});

export const float = new Validator<string, unknown>({
    rule: value => isFloat(value),
    hint: 'float',
});
