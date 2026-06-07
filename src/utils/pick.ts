/**
 * Create an object composed of the picked object properties
 * @param {Object} object - The object to pick properties from
 * @param {Array} keys - The array of keys to pick from the object
 * @returns {Object} - A new object with only the picked properties
 */
function pick<T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Pick<T, K> {
  const pickedObject: Partial<T> = {};

  for (const key of keys) {
    if (key in object) {
      pickedObject[key] = object[key];
    }
  }

  return pickedObject as Pick<T, K>;
}

export default pick;
