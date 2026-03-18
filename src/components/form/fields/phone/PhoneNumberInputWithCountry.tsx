import React from 'react';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { hasFlag } from 'country-flag-icons';
import * as Flags from 'country-flag-icons/react/3x2';
import { CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js/min';
import { GlobeIcon } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { useConfig } from '@/contexts/config';
import { useI18n } from '@/contexts/i18n';

import { usePhoneNumberInput } from './PhoneNumberInputContext';

type PhoneNumberInputWithCountryProps = React.ComponentProps<'input'>;

const PhoneNumberInputWithCountry = React.forwardRef<
    HTMLInputElement,
    PhoneNumberInputWithCountryProps
>(function PhoneNumberInputWithCountry(props, ref) {
    const { innerInputRef, inputValue, handleInputChange, handleInputBlur } = usePhoneNumberInput();

    React.useImperativeHandle(ref, () => innerInputRef.current!);

    return (
        <InputGroup>
            <InputGroupAddon align="inline-start">
                <CountrySelect disabled={props.disabled} />
            </InputGroupAddon>
            <InputGroupInput
                type="tel"
                ref={innerInputRef}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                value={inputValue}
                {...props}
            />
        </InputGroup>
    );
});
PhoneNumberInputWithCountry.displayName = 'PhoneNumberInputWithCountry';

interface CountrySelectProps {
    disabled?: boolean;
    readOnly?: boolean;
}

const CountrySelect = React.forwardRef<
    React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
    CountrySelectProps
>(function CountrySelect(props, ref) {
    const { locale, language } = useConfig();
    const i18n = useI18n();
    const { country, handleCountryChange } = usePhoneNumberInput();

    const selectOptions = React.useMemo(
        () =>
            getCountries()
                .map(code => ({
                    code,
                    name: getCountryName(code, locale ?? language) ?? code,
                    callingCode: getCallingCode(code),
                }))
                .sort((a, b) => a.name.localeCompare(b.name)),
        []
    );

    return (
        <DropdownMenu>
            <DropdownMenuTrigger data-disabled={props.disabled ?? props.readOnly} ref={ref} asChild>
                <InputGroupButton
                    variant="ghost"
                    aria-label={i18n('address.country')}
                    size="icon-xs"
                    disabled={props.disabled ?? props.readOnly}
                >
                    <CountryFlag country={country} />
                </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuGroup>
                    {selectOptions.map(({ code, name, callingCode }) => (
                        <DropdownMenuItem key={code} onClick={() => handleCountryChange(code)}>
                            <CountryFlag country={code} /> {`${name} (+${callingCode})`}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

const CountryFlag = function CountryFlag({
    country,
    title,
}: {
    country: CountryCode;
    title?: string;
}) {
    const Flag = hasFlag(country) ? Flags[country] : null;
    return Flag ? <Flag title={title ?? country} /> : <GlobeIcon />;
};

function getCallingCode(country: CountryCode) {
    try {
        return getCountryCallingCode(country);
    } catch (_e) {
        return null;
    }
}

function getCountryName(
    country: CountryCode,
    locales: ConstructorParameters<typeof Intl.DisplayNames>[0]
) {
    try {
        const regionNames = new Intl.DisplayNames(locales, { type: 'region' });
        return regionNames.of(country);
    } catch (_e) {
        return null;
    }
}

export { PhoneNumberInputWithCountry };
