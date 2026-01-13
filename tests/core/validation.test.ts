import { beforeAll, describe, expect, it } from '@jest/globals';
import i18n from 'i18next';

import { type I18nMessages } from '@/contexts/i18n';
import {
    checked,
    email,
    empty,
    float,
    integer,
    isValidatorError,
    isValidatorSuccess,
    required,
    Validator,
} from '@/core/validation';

const defaultI18n: I18nMessages = {
    'validation.minLength': 'Min length is {min}',
    'validation.maxLength': 'Max length is {max}',
};

describe('Validator', () => {
    beforeAll(() => {
        i18n.init({
            lng: 'en',
            resources: {
                en: {
                    translation: defaultI18n,
                },
            },
            interpolation: {
                escapeValue: false, // react already safes from xss,
                prefix: '{',
                suffix: '}',
            },
        });
    });

    it('should instanciate a custom Validator', async () => {
        const matchValidator = (matchText: string) =>
            new Validator<string>({
                rule: value => value === matchText,
                hint: 'match',
            });

        const validate = matchValidator('valid').create(i18n.t);

        const valid = await validate('valid', {});
        expect(valid).toMatchObject({
            valid: true,
        });

        const invalid = await validate('invalid', {});
        expect(invalid).toMatchObject({
            valid: false,
            error: 'validation.match',
        });
    });

    it('should instanciate a custom Validator with parameters', async () => {
        const MAX_LENGTH = 5;
        const maxLengthValidator = new Validator<string>({
            rule: value => value.length <= MAX_LENGTH,
            hint: 'maxLength',
            parameters: { max: MAX_LENGTH },
        });

        const validate = maxLengthValidator.create(i18n.t);

        const valid = await validate('valid', {});
        expect(valid).toMatchObject({
            valid: true,
        });

        const invalid = await validate('invalid', {});
        expect(invalid).toMatchObject({
            valid: false,
            error: 'Max length is 5',
        });
    });

    it('should instanciate an asynchronous Validator', async () => {
        const asyncValidator = new Validator<string>({
            rule: value => Promise.resolve(value === 'valid'),
            hint: 'async',
        });

        const validate = asyncValidator.create(i18n.t);

        const valid = await validate('valid', {});
        expect(valid).toMatchObject({
            valid: true,
        });

        const invalid = await validate('invalid', {});
        expect(invalid).toMatchObject({
            error: 'validation.async',
        });
    });

    it('should forward extra validation properties', async () => {
        const enrichedValidator = new Validator<boolean>({
            rule: value => ({ valid: value, extra: 'foo' }),
            hint: 'extra',
        });

        const validate = enrichedValidator.create(i18n.t);

        const valid = await validate(true, {});
        expect(valid).toMatchObject({
            valid: true,
            extra: 'foo',
        });

        const invalid = await validate(false, {});
        expect(invalid).toMatchObject({
            valid: false,
            error: 'validation.extra',
            extra: 'foo',
        });
    });
});

describe('CompoundValidator', () => {
    it('should compound multiple validators', async () => {
        const minLengthValidator = new Validator<string>({
            rule: value => value.length >= 1,
            hint: 'minLength',
            parameters: { min: 1 },
        });

        const maxLengthValidator = new Validator<string>({
            rule: value => value.length <= 5,
            hint: 'maxLength',
            parameters: { max: 5 },
        });

        const compoundValidator = minLengthValidator.and(maxLengthValidator);
        const validate = compoundValidator.create(i18n.t);

        const valid = await validate('valid', {});
        expect(valid).toMatchObject({
            valid: true,
        });

        const tooShort = await validate('', {});
        expect(tooShort).toMatchObject({
            valid: false,
            error: 'Min length is 1',
        });

        const tooLong = await validate('invalid', {});
        expect(tooLong).toMatchObject({
            valid: false,
            error: 'Max length is 5',
        });
    });
});

describe('helpers', () => {
    describe('isValidatorError', () => {
        it('should match ValidatorError', () => {
            expect(isValidatorError({ valid: false, error: 'validation.error' })).toBeTruthy();
            expect(isValidatorError({ valid: true })).toBeFalsy();
        });
    });

    describe('isValidatorSuccess', () => {
        it('should match ValidatorSuccess', () => {
            expect(isValidatorSuccess({ valid: false, error: 'validation.error' })).toBeFalsy();
            expect(isValidatorSuccess({ valid: true })).toBeTruthy();
        });
    });
});

describe('built-in validators', () => {
    describe('empty', () => {
        it('should be falsy if undefined', async () => {
            const obtained = await empty.create(i18n.t)(undefined, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be falsy if null', async () => {
            const obtained = await empty.create(i18n.t)(null, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be falsy if empty string', async () => {
            const obtained = await empty.create(i18n.t)('', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });
    });

    describe('required', () => {
        it('should be invalid if undefined', async () => {
            const obtained = await required.create(i18n.t)(undefined, {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.required',
            });
        });

        it('should be invalid if null', async () => {
            const obtained = await required.create(i18n.t)(null, {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.required',
            });
        });

        it('should be invalid if empty string', async () => {
            const obtained = await required.create(i18n.t)('', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.required',
            });
        });

        it('should be falsy if non-empty string', async () => {
            const obtained = await required.create(i18n.t)('abc', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be invalid if NaN', async () => {
            const obtained = await required.create(i18n.t)(NaN, {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.required',
            });
        });

        it('should be falsy if number', async () => {
            const obtained = await required.create(i18n.t)(42, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be invalid if empty array', async () => {
            const obtained = await required.create(i18n.t)([], {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.required',
            });
        });

        it('should be falsy if non-empty array', async () => {
            const obtained = await required.create(i18n.t)(['foo'], {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be falsy if true', async () => {
            const obtained = await required.create(i18n.t)(true, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be falsy if false', async () => {
            const obtained = await required.create(i18n.t)(false, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });
    });

    describe('checked', () => {
        it('should be falsy if true', async () => {
            const obtained = await checked.create(i18n.t)(true, {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be invalid if false', async () => {
            const obtained = await checked.create(i18n.t)(false, {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.checked',
            });
        });

        it("should be falsy if 'true'", async () => {
            const obtained = await checked.create(i18n.t)('true', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be invalid if 'false'", async () => {
            const obtained = await checked.create(i18n.t)('false', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.checked',
            });
        });
    });

    describe('email', () => {
        it('should be falsy if valid email', async () => {
            const obtained = await email.create(i18n.t)('alice.do@reach5.co', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it('should be invalid if invalid email', async () => {
            const obtained = await email.create(i18n.t)('alicereach5.co', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.email',
            });
        });
    });

    describe('integer', () => {
        it("should be falsy if '0'", async () => {
            const obtained = await integer.create(i18n.t)('0', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be falsy if '42'", async () => {
            const obtained = await integer.create(i18n.t)('42', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be falsy if '12.3'", async () => {
            const obtained = await integer.create(i18n.t)('12.3', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.integer',
            });
        });

        it("should be invalid if 'invalid'", async () => {
            const obtained = await integer.create(i18n.t)('invalid', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.integer',
            });
        });
    });

    describe('float', () => {
        it("should be falsy if '0'", async () => {
            const obtained = await float.create(i18n.t)('0', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be falsy if '42'", async () => {
            const obtained = await float.create(i18n.t)('42', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be falsy if '12.3'", async () => {
            const obtained = await float.create(i18n.t)('12.3', {});
            expect(obtained).toMatchObject({
                valid: true,
            });
        });

        it("should be invalid if 'invalid'", async () => {
            const obtained = await float.create(i18n.t)('invalid', {});
            expect(obtained).toMatchObject({
                valid: false,
                error: 'validation.float',
            });
        });
    });
});
