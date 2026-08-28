import { ClassValue, clsx } from 'clsx';
import {
    addAlphaToHex,
    convert,
    darken,
    isValidColor,
    lighten,
    luminance,
    parseCSS,
    transparentize,
} from 'colorizr';
import { twMerge } from 'tailwind-merge';

import { logError } from '@/helpers/logger';

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

/**
 * Whether `colorizr` is able to parse `color`.
 *
 * Every `colorizr` entry point throws on input it cannot parse — including keywords that are
 * perfectly valid in CSS, such as `transparent`, `currentColor`, `inherit` and `var(--x)`.
 * Theme colors come from SDK consumers and are read on every render, so the helpers below
 * degrade instead of letting a single unsupported value take the whole widget down.
 */
function isParseableColor(color: string): boolean {
    return typeof color === 'string' && isValidColor(color);
}

/**
 * Values already reported by {@link warnUnparseableColor}. These helpers run on every render,
 * so without this the console would be flooded with the same message.
 */
const reportedColors = new Set<string>();

function warnUnparseableColor(color: string, consequence: string): void {
    if (reportedColors.has(color)) return;
    reportedColors.add(color);
    logError(
        `Unsupported theme color ${JSON.stringify(color)}: expected a color notation such as ` +
            `#rrggbb, rgb(), hsl() or a named color. ${consequence}`
    );
}

/**
 * Converts a color to the bare `h s% l%` triple expected by the Tailwind theme tokens
 * (which wrap it as `hsl(var(--token))`).
 *
 * Any alpha channel is dropped on purpose: one of those tokens supplies its own alpha
 * (`hsl(var(--accent) / .5)`), and a triple that already carried one would make it invalid.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @returns the HSL components, without the surrounding `hsl(…)`; an unsupported value is
 *          returned unchanged, which makes the declaration that consumes it invalid — and so
 *          ignored by the browser — rather than throwing.
 */
export function colorToHSL(color: string): string {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'The color is left as-is and will likely be ignored.');
        return color;
    }
    const { h, s, l } = parseCSS(color, 'hsl');
    return `${h} ${s}% ${l}%`;
}

/** Default shift applied by {@link shadeColor}, in HSL lightness points. */
const SHADE_AMOUNT = 10;

/**
 * HSL lightness below which {@link shadeColor} shifts upwards instead of downwards.
 * Fixed rather than derived from the shift amount, so a large `amount` cannot flip a mid-tone
 * color into being lightened.
 */
const SHADE_DIRECTION_PIVOT = 15;

/**
 * Shifts a color towards a darker shade, or towards a lighter one when the color is already
 * too dark to be visibly darkened (a black button, for instance).
 *
 * The alpha channel is preserved: a semi-transparent input yields an equally transparent
 * output, so shading a hairline border does not turn it into a solid rule.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @param amount shift in HSL lightness points
 * @returns the shifted color, as a hex string (8-digit when the input was semi-transparent);
 *          an unsupported value is returned unchanged, so the color simply does not shift
 */
export function shadeColor(color: string, amount: number = SHADE_AMOUNT): string {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'It will not be shaded on hover.');
        return color;
    }
    const { l, alpha } = parseCSS(color, 'hsl');
    // Below the pivot, darkening would clamp to black and barely be noticeable.
    const shaded =
        l < SHADE_DIRECTION_PIVOT ? lighten(color, amount, 'hex') : darken(color, amount, 'hex');
    // `lighten` and `darken` always return an opaque color, so the alpha has to be re-applied.
    return alpha === undefined || alpha === 1 ? shaded : addAlphaToHex(shaded, alpha);
}

/**
 * Relative luminance above which a color reads as "light".
 * WCAG 2.x pivot: the luminance for which the contrast ratio against both black and white is equal.
 */
const LIGHTNESS_THRESHOLD = 0.179;

/**
 * Picks one of two values depending on how light the reference color is.
 *
 * Uses the WCAG relative luminance rather than the raw HSL lightness, so perceptually dark
 * colors with a high lightness channel (pure blue, for instance) are still treated as dark.
 *
 * @param color reference color: any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @param onDark value returned when `color` is dark (e.g. white)
 * @param onLight value returned when `color` is light (e.g. black)
 * @returns `onDark` or `onLight`; `onDark` when the color is not supported, since a widget
 *          renders on a light background by default
 *
 * @example
 * pickByLightness('#000000', '#ffffff', '#000000') // → '#ffffff'
 * pickByLightness('#ffffff', '#ffffff', '#000000') // → '#000000'
 */
export function pickByLightness<T>(color: string, onDark: T, onLight: T): T {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'The value picked for contrast against it may be wrong.');
        return onDark;
    }
    return luminance(color) > LIGHTNESS_THRESHOLD ? onLight : onDark;
}

/**
 * Normalises a color to a lowercase hex string, so two notations of the same color compare equal.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @returns the color as lowercase hex, or `color` lowercased when it is not supported
 */
export function toHexColor(color: string): string {
    if (!isParseableColor(color)) return color.toLowerCase();
    return convert(color, 'hex').toLowerCase();
}

/**
 * Lightens a color by `amount` HSL lightness points.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @param amount shift in HSL lightness points (0–100)
 * @returns the lightened color as a hex string, or `color` unchanged when it is not supported
 */
export function lightenColor(color: string, amount: number): string {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'It will not be lightened.');
        return color;
    }
    return lighten(color, amount, 'hex');
}

/**
 * Darkens a color by `amount` HSL lightness points.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @param amount shift in HSL lightness points (0–100)
 * @returns the darkened color as a hex string, or `color` unchanged when it is not supported
 */
export function darkenColor(color: string, amount: number): string {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'It will not be darkened.');
        return color;
    }
    return darken(color, amount, 'hex');
}

/**
 * Makes a color more transparent by subtracting `amount` from its alpha channel.
 *
 * @param color any CSS color (hex, `rgb()`, `hsl()`, named, …)
 * @param amount alpha to subtract, between 0 and 1
 * @returns the faded color as an 8-digit hex string, or `color` unchanged when it is not supported
 */
export function fadeColor(color: string, amount: number): string {
    if (!isParseableColor(color)) {
        warnUnparseableColor(color, 'It will not be faded.');
        return color;
    }
    return transparentize(color, amount);
}
