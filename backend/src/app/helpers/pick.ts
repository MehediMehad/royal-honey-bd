const pick = <T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Partial<T> => {
  const finalObj: Partial<T> = {};
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      finalObj[key] = (typeof value === 'string' ? value.trim() : value) as T[K];
    }
  }
  return finalObj;
};

export default pick;

