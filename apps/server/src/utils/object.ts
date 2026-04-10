export function deepMerge<T extends Record<string, any>>(target: T, patch: Record<string, any>): T {
  const output = structuredClone(target) as Record<string, any>;

  for (const [key, value] of Object.entries(patch)) {
    if (isObject(value) && isObject(output[key])) {
      output[key] = deepMerge(output[key], value);
      continue;
    }

    output[key] = value;
  }

  return output as T;
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
