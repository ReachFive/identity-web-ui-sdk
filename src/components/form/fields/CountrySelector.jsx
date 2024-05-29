import React from 'react';
import Select from 'react-select';
import countries from 'i18n-iso-countries';
//import english from 'i18n-iso-countries/langs/en.json';
import french from 'i18n-iso-countries/langs/fr.json';


countries.registerLocale(french);

const countryOptions = Object.entries(countries.getNames('en')).map(([code, name]) => ({ value: code, label: name }));

const countrySelector = ({ value, onChange }) => (
    <Select
        value={countryOptions.find(option => option.value === value)}
        onChange={option => onChange(option.value)}
        options={countryOptions}
    />
);

export default countrySelector;