import { DateTime } from 'luxon'

import dateField from './dateField'
import { Validator } from '../../../core/validation';
import { Config } from '../../../types';

export const ageLimitValidator = (min = 6, max = 129) => new Validator<DateTime>({
    rule: (value) => {
        const age = DateTime.now().diff(value, 'years').years
        return min < age && age < max
    },
    hint: 'birthdate.yearLimit',
    parameters: { min, max }
})

export default function birthdateField(
    { min, max, label = 'birthdate', ...props }: Parameters<typeof dateField>[0] & { min?: number, max?: number },
    config: Config
) {
    return dateField({
        ...props,
        label: label,
        validator: ageLimitValidator(min, max)
    }, config)
}
