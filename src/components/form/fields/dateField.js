import validator from 'validator';

import { formatISO8601Date } from '../../../helpers/utils';
import { Validator } from '../../../core/validation';

import { simpleField } from './simpleField';

const formatDate = formValue => {
    if (formValue && formValue.length) {
        const [month, day, year] = formValue.split('/');

        if (year && year.length && month && month.length && day && day.length) {
            return formatISO8601Date(year, month, day);
        }
    }

    return null;
};

export default function dateField(config) {
    return simpleField({
        placeholder: 'mm/dd/yyyy',
        ...config,
        type: 'text',
        format: {
            bind(modelValue) {
                if (modelValue && modelValue.length) {
                    const [year = '', month = '', day = ''] = modelValue.split('-');

                    return `${month}/${day}/${year}`;
                }
            },
            unbind: formatDate
        },
        validator: new Validator({
            rule: value => {
                const date = formatDate(value);

                return !date || validator.isISO8601(date);
            },
            hint: 'date'
        })
    });
}
