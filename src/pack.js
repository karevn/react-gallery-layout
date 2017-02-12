import binpack from 'binpack-2d'
import {rows, columns, grid} from 'card-layouts'
const layouts = {rows, columns, grid}

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
const runBinpack = options =>
  binpack({width: options.width, height: Infinity},
    options.items, options.gap, options.rtl)
const isBinpack = layout => layout === 'binpack' || !layout
export default function pack (options) {
  options.gap = getGap(options.gap, options.width)
  return isBinpack(options.layout)
    ? runBinpack(options)
    : layouts[options.layout](options)
}
