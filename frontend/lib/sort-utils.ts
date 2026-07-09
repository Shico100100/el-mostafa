/**
 * Sorts an array of objects alphabetically by a specific field, supporting Arabic.
 */
/**
 * Sorts an array of objects alphabetically by a specific field or getter function, supporting Arabic.
 */
export const sortAlphabetically = <T>(
    raw: unknown,
    fieldOrGetter: keyof T | ((item: T) => string | number | null | undefined),
): T[] => {
    let arr: unknown[];
    if (Array.isArray(raw)) {
        arr = raw;
    } else if (raw && typeof raw === 'object') {
        const r = raw as Record<string, unknown>;
        arr = (r.items || r.data || []) as unknown[];
    } else {
        return [];
    }
    if (!Array.isArray(arr)) return [];
    const result: T[] = [];
    for (let i = 0; i < arr.length; i++) result.push(arr[i]);
    result.sort((a, b) => {
        const valA = typeof fieldOrGetter === 'function'
            ? String((fieldOrGetter as (item: T) => string | number | null | undefined)(a) ?? '')
            : String(a[fieldOrGetter as keyof T] ?? '');
        const valB = typeof fieldOrGetter === 'function'
            ? String((fieldOrGetter as (item: T) => string | number | null | undefined)(b) ?? '')
            : String(b[fieldOrGetter as keyof T] ?? '');
        return valA.localeCompare(valB, 'ar', { sensitivity: 'base' });
    });
    return result;
};
