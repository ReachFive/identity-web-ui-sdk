import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const intlDateFormat = (
    locale: ConstructorParameters<typeof Intl.DateTimeFormat>[0]
): string =>
    new Intl.DateTimeFormat(locale)
        .formatToParts()
        .map(part => {
            switch (part.type) {
                case 'day':
                    return 'dd';
                case 'month':
                    return 'mm';
                case 'year':
                    return 'yyyy';
                case 'literal':
                    return part.value;
                default:
                    return '';
            }
        })
        .join('');
