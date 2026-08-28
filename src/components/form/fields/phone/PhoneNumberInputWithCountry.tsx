import React from 'react';

import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { hasFlag } from 'country-flag-icons';
import * as Flags from 'country-flag-icons/react/3x2';
import { CountryCode, getCountries, getCountryCallingCode } from 'libphonenumber-js/min';
import { ChevronDown, GlobeIcon } from 'lucide-react';

import { usePhoneNumberInput } from '@/components/form/fields/phone/PhoneNumberInputContext';
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
                    size="xs"
                    disabled={props.disabled ?? props.readOnly}
                >
                    <CountryFlag country={country} className="!w-auto" />
                    <ChevronDown className="h-4 w-4 opacity-50" />
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
    ...props
}: React.HTMLAttributes<SVGElement> & {
    country: CountryCode;
    title?: string;
}) {
    const Flag = hasFlag(country) ? Flags[country] : null;
    return Flag ? <Flag title={title ?? country} {...props} /> : <GlobeIcon {...props} />;
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
