import { DateTime } from 'luxon'

import dateField from './dateField'
import { Validator } from '../../../core/validation';

export const ageLimitValidator = (min = 6, max = 129) =>  new Validator({
    rule: (value) => {
        const age = DateTime.now().diff(value.raw, 'years').years
        return min < age && age < max
    },
    hint: 'birthdate.yearLimit',
    parameters: { min, max }
})

export default function birthdateField(props, config) {
    return dateField({
        ...props,
        validator: ageLimitValidator(props.min, props.max)
    }, config)
}
