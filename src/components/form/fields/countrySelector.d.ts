import { FC } from 'react';

export interface CountrySelectorProps {
    key?: string;
    value: string;
    onChange: (value: string) => void;
}

const CountrySelector: FC<CountrySelectorProps>;

export default CountrySelector;
