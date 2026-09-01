import React from 'react';

import { AsYouType, CountryCode } from 'libphonenumber-js/min';

import { InputField } from '@/components/form/fields/input';

/**
 * `AsYouType` silently discards every character it cannot read as part of a phone number, so an
 * email or a custom identifier reaches it as its digits alone: `ccu123456789@yopmail.com` is seen
 * as `123456789`, a perfectly possible French number. Acting on that would replace what the user
 * is typing with the phone number the formatter believes it found, hence: the formatter's output
 * is only trusted while the raw input still looks like a phone number — digits and the separators
 * a phone number may carry, nothing else.
 */
const PHONE_NUMBER_SHAPE = /^[+\d\s().\-/]*$/;

type IdentifierFieldProps = React.ComponentPropsWithoutRef<typeof InputField> & {
    defaultCountry?: CountryCode;
    value?: string;
    withPhoneNumber?: boolean;
};

const IdentifierField = React.forwardRef<HTMLInputElement, IdentifierFieldProps>(
    function IdentifierField(
        { defaultCountry = 'FR', withPhoneNumber, onChange, onBlur, value = '', ...props },
        ref
    ) {
        const [country, setCountry] = React.useState(defaultCountry);
        const [inputValue, setInputValue] = React.useState(typeof value === 'string' ? value : '');

        const formatter = React.useMemo(() => new AsYouType(country), []);

        const isPhoneNumber = React.useCallback(
            (rawValue: string) => Boolean(withPhoneNumber) && PHONE_NUMBER_SHAPE.test(rawValue),
            [withPhoneNumber]
        );

        const handleFormatInput = React.useCallback(
            (rawValue: string) => {
                if (!isPhoneNumber(rawValue)) return;
                const number = formatter.getNumber();
                if (number?.isPossible()) {
                    if (number.country && number.country !== country) {
                        setCountry(number.country);
                    }
                    const nextValue = formatter.getChars();
                    formatter.reset();
                    setInputValue(formatter.input(nextValue));
                }
            },
            [formatter, isPhoneNumber, country]
        );

        const handleChange: React.ChangeEventHandler<HTMLInputElement> = React.useCallback(
            e => {
                const newValue = e.target.value;

                if (inputValue === newValue) return;

                setInputValue(newValue);

                const isAppend =
                    newValue.length > inputValue.length && newValue.startsWith(inputValue);

                if (isAppend) {
                    const appended = newValue.slice(inputValue.length);
                    formatter.input(appended);
                    handleFormatInput(newValue);
                } else {
                    // Reset the formatter, but do not reformat.
                    // Doing so now will cause the user to lose their cursor position
                    // Wait until blur or append to reformat.
                    formatter.reset();
                    formatter.input(newValue);
                }

                const number = isPhoneNumber(newValue) ? formatter.getNumber() : undefined;
                const e164 = number?.number ?? '';
                const value = number?.isPossible() ? e164 : newValue;
                onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
            },
            [inputValue, formatter, handleFormatInput, isPhoneNumber, onChange]
        );

        const handleInputBlur = React.useCallback(() => {
            onBlur?.({ target: { value: inputValue } } as React.FocusEvent<HTMLInputElement>);
            handleFormatInput(inputValue);
        }, [inputValue, handleFormatInput, onBlur]);

        // Sync display when value prop changes externally (form reset, etc.)
        React.useLayoutEffect(() => {
            const e164 = formatter.getNumber()?.number ?? '';
            if (e164 !== value) {
                formatter.reset();
                if (value) {
                    formatter.input(value);
                }
                handleFormatInput(value);
            }
        }, [value]);

        return (
            <InputField
                ref={ref}
                type="text"
                value={inputValue}
                onChange={handleChange}
                onBlur={handleInputBlur}
                {...props}
            />
        );
    }
);
IdentifierField.displayName = 'IdentifierField';

export { IdentifierField };
