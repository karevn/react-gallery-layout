import binpack from 'binpack-2d'
import layouts from 'card-layouts'

function getGap (gap, width) {
  if (Number.isInteger(gap)) {
    return gap
  }
  if (gap && typeof gap === 'string' && /%$/.test(gap)) {
    return width / 100 * parseInt(gap)
  }
  if (gap && typeof gap === 'string') {
    return parseInt(gap)
  }
  return gap
}

export default function pack (options) {
  options.gap = getGap(options.gap, options.width)
  if (options.layout === 'binpack' || !options.layout) {
    return binpack({width: options.width, height: Infinity}, options.items, options.gap)
  } else {
    return layouts[options.layout](options)
  }
}
