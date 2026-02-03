export function toCamelCase(str: string): string {
    return str
        .replace(/[-_]+(.)?/g, (_, chr) => chr ? chr.toUpperCase() : '')
        .replace(/^[A-Z]/, chr => chr.toLowerCase());
}
