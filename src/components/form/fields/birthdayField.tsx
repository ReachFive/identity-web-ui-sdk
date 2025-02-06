import { differenceInYears, formatISO, isValid, parseISO } from "date-fns"

import dateField from './dateField'
import { Validator } from '../../../core/validation';
import { Config } from '../../../types';
import { isRichFormValue } from "../../../helpers/utils";

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
        format: {
            bind: (value) => {
                const dt = value ? parseISO(value) : undefined
                return dt && isValid(dt) ? { raw: dt } : undefined
            },
            unbind: (value) => {
                return isRichFormValue(value, 'raw') 
                    ? formatISO(value.raw, { representation: 'date' }) 
                    : value 
                        ? formatISO(value, { representation: 'date' })
                        : null
            }
        },
        validator: ageLimitValidator(min, max)
    }, config)
}
