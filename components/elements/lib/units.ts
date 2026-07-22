// Shared conversion helpers used both by the DOM text-node converter and the
// Chart.js tick-label plugin. Kept in one place so both entry points agree on
// exactly which strings count as "binary unit output" and how they're rewritten.

const BINARY_UNITS = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
const DECIMAL_UNITS = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

// Space between the number and unit is optional: Pterodactyl's bytesToString()
// always includes one ("512.00 MiB"), but some chart tick labels concatenate
// the unit directly onto the number ("512MiB").
const BINARY_MATCH = new RegExp(`(\\d+(?:\\.\\d+)?)\\s?(${BINARY_UNITS.slice(1).join('|')})\\b`, 'g');

// Mirrors Pterodactyl's bytesToString(), but with a decimal (1000) divisor and labels.
function bytesToDecimalString(bytes: number, decimals = 2): string {
    if (bytes < 1) return '0 Bytes';

    const k = 1000;
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), DECIMAL_UNITS.length - 1);
    const value = Number((bytes / Math.pow(k, i)).toFixed(Math.max(0, Math.floor(decimals))));

    return `${value} ${DECIMAL_UNITS[i]}`;
}

// Converts an already-rounded binary-unit match (e.g. "512.00 MiB") back to a raw byte count
// and reformats it in decimal units. Since the source value was already rounded, the recovered
// byte count is an approximation of the true value - fine for a display-only conversion.
function convertMatch(rawValue: string, unit: string): string {
    const unitIndex = BINARY_UNITS.indexOf(unit);
    const bytes = parseFloat(rawValue) * Math.pow(1024, unitIndex);

    return bytesToDecimalString(bytes);
}

// Converted output never contains the binary "i" suffix again, so running this
// on its own result a second time is a no-op - safe to call from anywhere,
// any number of times, without tracking what's already been processed.
function convertBinaryUnitsInText(text: string): string {
    BINARY_MATCH.lastIndex = 0;
    if (!BINARY_MATCH.test(text)) return text;

    BINARY_MATCH.lastIndex = 0;
    return text.replace(BINARY_MATCH, (_match, value: string, unit: string) => convertMatch(value, unit));
}

export { convertBinaryUnitsInText, bytesToDecimalString };
