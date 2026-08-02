/**
 * Sorts an array of objects alphabetically by a specific field, supporting Arabic.
 */
/**
 * Sorts an array of objects alphabetically by a specific field or getter function, supporting Arabic.
 */
export const sortAlphabetically = <T>(
    raw: T[] | { items?: T[]; data?: T[] } | null | undefined,
    fieldOrGetter: keyof T | ((item: T) => string | number | null | undefined),
): T[] => {
    let arr: T[];
    if (Array.isArray(raw)) {
        arr = raw;
    } else if (raw && typeof raw === 'object' && 'items' in raw && Array.isArray((raw as { items?: T[] }).items)) {
        arr = (raw as { items: T[] }).items;
    } else if (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data?: T[] }).data)) {
        arr = (raw as { data: T[] }).data;
    } else {
        return [];
    }
    if (!Array.isArray(arr)) return [];
    const result = [...arr];
    result.sort((a, b) => {
        const getVal = (item: T) => {
            const val = typeof fieldOrGetter === 'function'
                ? (fieldOrGetter as (item: T) => string | number | null | undefined)(item)
                : item[fieldOrGetter as keyof T];
            return String(val ?? '');
        };
        return getVal(a).localeCompare(getVal(b), 'ar', { sensitivity: 'base' });
    });
    return result;
};
