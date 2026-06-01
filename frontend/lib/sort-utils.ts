/**
 * Sorts an array of objects alphabetically by a specific field, supporting Arabic.
 */
/**
 * Sorts an array of objects alphabetically by a specific field or getter function, supporting Arabic.
 */
export const sortAlphabetically = <T>(
    array: T[],
    fieldOrGetter: keyof T | ((item: T) => string | number | null | undefined),
): T[] => {
    return [...array].sort((a, b) => {
        const valA = typeof fieldOrGetter === 'function'
            ? String(fieldOrGetter(a) || '')
            : String(a[fieldOrGetter] || '');
        const valB = typeof fieldOrGetter === 'function'
            ? String(fieldOrGetter(b) || '')
            : String(b[fieldOrGetter] || '');
        return valA.localeCompare(valB, 'ar', { sensitivity: 'base' });
    });
};
