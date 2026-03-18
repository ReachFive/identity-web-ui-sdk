import React from 'react';

import { AsYouType, CountryCode } from 'libphonenumber-js/min';

import { InputField } from './input';

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
                    handleFormatInput();
                } else {
                    // Reset the formatter, but do not reformat.
                    // Doing so now will cause the user to lose their cursor position
                    // Wait until blur or append to reformat.
                    formatter.reset();
                    formatter.input(newValue);
                }

                const number = formatter.getNumber();
                const e164 = number?.number ?? '';
                const value = number?.isPossible() ? e164 : newValue;
                onChange?.({ target: { value } } as React.ChangeEvent<HTMLInputElement>);
            },
            [inputValue, formatter, onChange]
        );

        const handleFormatInput = React.useCallback(() => {
            const number = formatter.getNumber();
            if (withPhoneNumber && number?.isPossible()) {
                if (number?.country && number.country !== country) {
                    setCountry(number.country);
                }
                const nextValue = formatter.getChars();
                formatter.reset();
                setInputValue(formatter.input(nextValue));
            }
        }, [formatter]);

        const handleInputBlur = React.useCallback(() => {
            onBlur?.({ target: { value: inputValue } } as React.FocusEvent<HTMLInputElement>);
            handleFormatInput();
        }, [handleFormatInput, onBlur]);

        // Sync display when value prop changes externally (form reset, etc.)
        React.useLayoutEffect(() => {
            const e164 = formatter.getNumber()?.number ?? '';
            if (e164 !== value) {
                formatter.reset();
                if (value) {
                    formatter.input(value);
                }
                handleFormatInput();
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
