import React from 'react';

import { AsYouType, CountryCode } from 'libphonenumber-js/min';

type PhoneNumberInputContextProps = {
    allowInternational?: boolean;
    defaultCountry: CountryCode;
    defaultValue: string;
    onBlur?: () => void;
    onChange: (val: string | undefined) => void;
};

type PhoneNumberInputContextValue = {
    inputValue: string;
    country: CountryCode;
    innerInputRef: React.MutableRefObject<HTMLInputElement | null>;
    handleInputChange: React.ChangeEventHandler<HTMLInputElement>;
    handleInputBlur: () => void;
    handleCountryChange: (newCountry: CountryCode) => void;
};

const PhoneNumberInputContext = React.createContext<PhoneNumberInputContextValue | undefined>(
    undefined
);

export type PhoneNumberInputProviderProps = React.PropsWithChildren<PhoneNumberInputContextProps>;

/**
 * Provider component that makes context object available to any
 * child component that calls `usePhoneNumberInput()`.
 */
export const PhoneNumberInputProvider = ({
    children,
    ...contextProps
}: PhoneNumberInputProviderProps): JSX.Element => {
    const context = useProvidePhoneNumberInput(contextProps);

    return (
        <PhoneNumberInputContext.Provider value={context}>
            {children}
        </PhoneNumberInputContext.Provider>
    );
};

/**
 * Hook for components nested in PhoneNumberProvider component to get the
 * current context object.
 */
export const usePhoneNumberInput = (): PhoneNumberInputContextValue => {
    const context = React.useContext(PhoneNumberInputContext);
    if (!context) {
        throw new Error(`usePhoneNumber must be used within a PhoneNumberProvider component`);
    }
    return context;
};

const useProvidePhoneNumberInput = ({
    defaultValue,
    defaultCountry,
    allowInternational,
    onChange,
    onBlur,
    ...props
}: PhoneNumberInputContextProps): PhoneNumberInputContextValue => {
    // Internal states of the component.
    const [inputValue, setInputValue] = React.useState(defaultValue);
    const [country, setCountry] = React.useState(defaultCountry);

    // Refs of the phone number input so focus can be passed to the input when
    // the selected country changes.
    const innerInputRef = React.useRef<HTMLInputElement | null>(null);

    const formatter = React.useMemo(() => new AsYouType(country), [country]);

    const onInputChange = React.useCallback(
        (newValue: string) => {
            if (inputValue === newValue) return;

            // The as-you-type formatter only works with append-only inputs.
            // Changes other than append require a reset.
            const isAppend = newValue.length > inputValue.length && newValue.startsWith(inputValue);

            if (isAppend) {
                const appended = newValue.slice(inputValue.length);
                setInputValue(formatter.input(appended));

                if (allowInternational) {
                    const number = formatter.getNumber();
                    if (number?.country && number.country !== country) {
                        setCountry(number.country);
                    }
                }
            } else {
                // Reset the formatter, but do not reformat.
                // Doing so now will cause the user to lose their cursor position
                // Wait until blur or append to reformat.
                formatter.reset();
                formatter.input(newValue);
                setInputValue(newValue);
            }

            const e164 = formatter.getNumber()?.number ?? '';
            onChange(e164);

            // On a similar vein, do not set country even if the country has changed
            // so that the cursor position does not get lost.
            // Change country on blur instead.
            return;
        },
        [country, formatter, inputValue, allowInternational, onChange]
    );

    const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = React.useCallback(
        e => {
            let newValue = e.target.value;
            if (!allowInternational) {
                // Remove all non-numeric, non-space characters so country cannot be
                // changed.
                newValue = newValue.replace(/[^\d ]/g, '');
            }
            onInputChange(newValue);
        },
        [allowInternational, onInputChange]
    );

    const handleCountryChange = React.useCallback(
        (newCountry: CountryCode) => {
            if (country === newCountry) return;
            onInputChange('');
            setCountry(newCountry);
            innerInputRef?.current?.focus();
        },
        [country, onInputChange]
    );

    const handleFormatInput = React.useCallback(() => {
        const number = formatter.getNumber();
        const e164 = number?.number ?? '';

        // Trigger on change again in case formatted number changes.
        // This can happen in the following scenario:
        // 1. `onInputChange` gets called when user types for example "65aabvcd123"
        // 2. `formatter.getNumber().number` will transform that into "65" and cut out the remaining characters since the remaining string is not a valid number
        // 3. Will need to call onChange on this new number.
        onChange(e164);
        // Check and update possibility
        const possible = number?.isPossible();

        if (number && possible) {
            // Reformat the phone number as international if international numbers
            // are enabled.
            formatter.reset();
            const nextValue = allowInternational
                ? number.formatInternational()
                : number.formatNational();
            setInputValue(formatter.input(nextValue));
            // Update the country if the parsed number belongs to a different
            // country.
            if (allowInternational && number?.country && number.country !== country) {
                setCountry(number.country);
            }
        } else {
            // Format the phone number
            setInputValue(formatter.input(''));
        }
    }, [country, formatter, allowInternational, onChange]);

    const handleInputBlur = React.useCallback(() => {
        onBlur?.();
        handleFormatInput();
    }, [handleFormatInput, onBlur]);

    // useLayoutEffect used instead of useEffect so this only runs after
    // the render cycle has been completed.
    // This allows the cursor position to be updated after formatting the input
    // without "jumping" to the end of the input string and disrupting the user.
    React.useLayoutEffect(() => {
        const e164 = formatter.getNumber()?.number ?? '';

        if (e164 !== defaultValue) {
            // Override the phone number if the field has a number and its e164
            // representation does not match the prop value.
            formatter.reset();
            if (defaultValue) {
                formatter.input(defaultValue);
            }
            handleFormatInput();
        }
    }, [
        defaultValue,
        formatter,
        inputValue,
        onChange,
        country,
        allowInternational,
        handleFormatInput,
    ]);

    return {
        inputValue,
        country,
        innerInputRef,
        handleInputChange,
        handleInputBlur,
        handleCountryChange,
        ...props,
    };
};
