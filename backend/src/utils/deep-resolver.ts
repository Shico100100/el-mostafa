async function deepResolvePromises(
  input: unknown,
  seen = new WeakSet<object>(),
): Promise<unknown> {
  if (input instanceof Promise) {
    return await input;
  }

  if (input === null || typeof input !== 'object') {
    return input;
  }

  if (input instanceof Date) {
    return input;
  }

  if (seen.has(input)) {
    return '[Circular]';
  }
  seen.add(input);

  if (Array.isArray(input)) {
    const resolvedArray: unknown[] = await Promise.all(
      (input as unknown[]).map((item) => deepResolvePromises(item, seen)),
    );
    return resolvedArray;
  }

  const keys = Object.keys(input as Record<string, unknown>);
  const resolvedObject: Record<string, unknown> = {};

  for (const key of keys) {
    resolvedObject[key] = await deepResolvePromises(
      (input as Record<string, unknown>)[key],
      seen,
    );
  }

  return resolvedObject;
}

export default deepResolvePromises;
