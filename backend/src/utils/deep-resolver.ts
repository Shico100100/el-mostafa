async function deepResolvePromises(input, seen = new WeakSet()) {
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
    const resolvedArray = await Promise.all(
      input.map((item) => deepResolvePromises(item, seen)),
    );
    return resolvedArray;
  }

  const keys = Object.keys(input);
  const resolvedObject = {};

  for (const key of keys) {
    resolvedObject[key] = await deepResolvePromises(input[key], seen);
  }

  return resolvedObject;
}

export default deepResolvePromises;
