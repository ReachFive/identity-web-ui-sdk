import { differenceInYears } from "date-fns"

import dateField from './dateField'
import { Validator } from '../../../core/validation';
import { Config } from '../../../types';

export const ageLimitValidator = (min = 6, max = 129) => new Validator<Date>({
    rule: (value) => {
        const age = differenceInYears(new Date(), value)
        return min <= age && age <= max
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
