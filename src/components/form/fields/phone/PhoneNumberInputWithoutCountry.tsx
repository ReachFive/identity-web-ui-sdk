import React from 'react';

import { usePhoneNumberInput } from '@/components/form/fields/phone/PhoneNumberInputContext';
import { Input } from '@/components/ui/input';

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
