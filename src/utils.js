export function filter (items, predicate) {
  const result = []
  for (let i = 0; i < items.length; i++)
    if (predicate(items[i], i))
      result.push(items[i])
  return result
}

export function until (items, predicate, addLast) {
  const result = []
  for (let i = 0; i < items.length; i++) {
    if (predicate(items[i], i)) {
      if (addLast) {
        result.push(items[i])
        return result
      }
    } else {
      result.push(items[i])
    }
  }
  return result
}

export function keys (object, keys) {
  return keys.reduce((obj, key)=> {
    obj[key] = object[key]
    return obj
  }, {})
}
