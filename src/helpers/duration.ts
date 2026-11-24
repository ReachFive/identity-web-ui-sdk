/** A number of days, spelled out in the given language ("90 days", "90 jours"). */
export function formatDays(days: number, language: string): string {
    return new Intl.NumberFormat(language, {
        style: 'unit',
        unit: 'day',
        unitDisplay: 'long',
    }).format(days);
}
