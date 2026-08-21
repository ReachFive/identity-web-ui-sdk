import React from 'react';

import { AsYouType, CountryCode, Metadata, PhoneNumber } from 'libphonenumber-js/min';

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

/**
 * `Metadata` exposes the countries sharing a calling code, the first one being
 * its main country (+1 → US, +44 → GB). Nothing in the public API does, hence
 * the cast and the optional call: were the method to go away, callers just fall
 * back to keeping the country currently selected.
 */
type CallingCodeMetadata = Metadata & {
    getCountryCodesForCallingCode?: (callingCode: string) => CountryCode[] | undefined;
};

const countriesForCallingCode = (callingCode: string): CountryCode[] =>
    (new Metadata() as CallingCodeMetadata).getCountryCodesForCallingCode?.(callingCode) ?? [];

/**
 * Country to select for the number being entered, or `undefined` when it cannot
 * be told yet.
 *
 * A `PhoneNumber` only carries a `country` once it is valid for exactly one of
 * them, which never happens while the number is incomplete — nor for a number
 * whose prefix is simply unassigned. Its calling code is known much earlier, so
 * it drives the selection too: the country already selected is kept whenever it
 * shares that calling code (someone who picked Canada and types a +1 number
 * keeps Canada), and the calling code's main country is used otherwise.
 */
const resolveCountry = (
    number: PhoneNumber | undefined,
    callingCode: string | undefined,
    selectedCountry: CountryCode
): CountryCode | undefined => {
    if (!callingCode) return number?.country;

    const countries = countriesForCallingCode(callingCode);
    if (countries.includes(selectedCountry)) return selectedCountry;

    return number?.country ?? countries[0];
};

/**
 * Extract the national (significant) number out of a — possibly partially
 * formatted — input value, so it can be re-formatted against another country.
 * Returns an empty string when the value holds no national digit yet.
 */
const getNationalNumber = (value: string, country: CountryCode): string => {
    const formatter = new AsYouType(country);
    formatter.input(value);
    return formatter.getNumber()?.nationalNumber ?? '';
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

    // The as-you-type formatter is held in a ref rather than derived from `country`
    // so that handlers captured by an earlier render always operate on the formatter
    // of the currently selected country. Selecting a country restores focus to the
    // dropdown trigger, which fires the input's blur handler from the previous
    // render: with a per-render formatter, that blur would resurrect the number of
    // the previously selected country.
    const formatterRef = React.useRef<AsYouType | null>(null);
    const getFormatter = React.useCallback(() => {
        formatterRef.current ??= new AsYouType(defaultCountry);
        return formatterRef.current;
    }, [defaultCountry]);

    const onInputChange = React.useCallback(
        (newValue: string) => {
            if (inputValue === newValue) return;

            const formatter = getFormatter();

            // The as-you-type formatter only works with append-only inputs.
            // Changes other than append require a reset.
            const isAppend = newValue.length > inputValue.length && newValue.startsWith(inputValue);

            if (isAppend) {
                const appended = newValue.slice(inputValue.length);
                setInputValue(formatter.input(appended));

                if (allowInternational) {
                    const nextCountry = resolveCountry(
                        formatter.getNumber(),
                        formatter.getCallingCode(),
                        country
                    );
                    if (nextCountry && nextCountry !== country) {
                        setCountry(nextCountry);
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

            // On a similar vein, a change other than an append neither reformats the
            // input nor updates the country, so that the cursor position does not get
            // lost. Both happen on blur instead.
            return;
        },
        [country, getFormatter, inputValue, allowInternational, onChange]
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

            // Keep the national (significant) number already entered and re-format it
            // against the newly selected country instead of discarding it.
            const nationalNumber = getNationalNumber(inputValue, country);
            const formatter = new AsYouType(newCountry);
            const asYouTypeValue = formatter.input(nationalNumber);
            const number = formatter.getNumber();

            formatterRef.current = formatter;
            setCountry(newCountry);
            setInputValue(number ? number.formatInternational() : asYouTypeValue);
            // Let the consumer re-validate the number against the new country.
            onChange(number?.number ?? '');

            innerInputRef?.current?.focus();
        },
        [country, inputValue, onChange]
    );

    const handleFormatInput = React.useCallback(() => {
        const formatter = getFormatter();
        const number = formatter.getNumber();
        const e164 = number?.number ?? '';

        // Trigger on change again in case formatted number changes.
        // This can happen in the following scenario:
        // 1. `onInputChange` gets called when user types for example "65aabvcd123"
        // 2. `formatter.getNumber().number` will transform that into "65" and cut out the remaining characters since the remaining string is not a valid number
        // 3. Will need to call onChange on this new number.
        onChange(e164);

        // Update the country if the number belongs to a different one. Done before
        // the number gets reformatted, as that resets the formatter.
        if (allowInternational) {
            const nextCountry = resolveCountry(number, formatter.getCallingCode(), country);
            if (nextCountry && nextCountry !== country) {
                setCountry(nextCountry);
            }
        }

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
        } else {
            // Format the phone number
            setInputValue(formatter.input(''));
        }
    }, [country, getFormatter, allowInternational, onChange]);

    const handleInputBlur = React.useCallback(() => {
        onBlur?.();
        handleFormatInput();
    }, [handleFormatInput, onBlur]);

    // useLayoutEffect used instead of useEffect so this only runs after
    // the render cycle has been completed.
    // This allows the cursor position to be updated after formatting the input
    // without "jumping" to the end of the input string and disrupting the user.
    React.useLayoutEffect(() => {
        const formatter = getFormatter();
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
        getFormatter,
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
