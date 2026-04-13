import React from 'react';

import { Input } from '@/components/ui/input';

import { usePhoneNumberInput } from './PhoneNumberInputContext';

type PhoneNumberInputWithoutCountryProps = React.ComponentProps<'input'>;

const PhoneNumberInputWithoutCountry = React.forwardRef<
    HTMLInputElement,
    PhoneNumberInputWithoutCountryProps
>(function PhoneNumberInputWithoutCountry(props, ref) {
    const { inputValue, handleInputChange, handleInputBlur } = usePhoneNumberInput();

    return (
        <Input
            type="tel"
            ref={ref}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            value={inputValue}
            {...props}
        />
    );
});
PhoneNumberInputWithoutCountry.displayName = 'PhoneNumberInputWithoutCountry';

export { PhoneNumberInputWithoutCountry };
