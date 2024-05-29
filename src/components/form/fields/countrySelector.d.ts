import { FC } from 'react';

interface CountrySelectorProps {
    value: string;
    onChange: (value: string) => void;
}

const countrySelector: FC<CountrySelectorProps>;

export default countrySelector;