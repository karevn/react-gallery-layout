import './sass/index.sass'

import React from 'react'
import ReactDOM from 'react-dom'
import Item from './src/item'
import pack from './src/pack'

const throttle = require('throttle-debounce/throttle')

import ResizeSensor from './src/resize'

const add = a => b => a + b
const sub = a => b => a - b
function array(thing) {
  const length = thing.length
  const result = []
  for(let i = 0; i < thing.length; i++) {
    result.push(thing[i])
  }
  return result
}
function measure (component) {
  if (component.measure) {
    return component.measure()
  }
  const node = ReactDOM.findDOMNode(component)
  return {
    width: Math.floor(node.offsetWidth),
    height: Math.floor(node.offsetHeight)
  }
}

function getHeight (rects) {
  return rects.reduce((height, rect) => {
    if (rect.y === undefined) {
      return height
    }
    return Math.max(height, rect.y + rect.height)
  }, 0)
}

function getWidth (rects) {
  const max = rects.reduce((width, rect) => {
    if (rect.x === undefined) {
      return width
    }
    return Math.max(width, rect.x + rect.width)
  }, 0);
  return max - rects.reduce((width, rect) => {
    if (rect.x === undefined) {
      return width
    }
    return Math.min(width, rect.x)
  }, max)
}

export default class Gallery extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      size: null,
      sizes: {},
      children: {},
      mounted: false,
      shouldReactResize: false
    }
    this.resetSizes = throttle(props.throttle, ::this.resetSizes)
    this.onItemMount = ::this.onItemMount
    this.onItemUnMount = ::this.onItemUnMount
    this.onItemChange = ::this.onItemChange
    this.onResize = ::this.onResize
    this.watchResize = ::this.watchResize
  }

  componentDidMount () {
    this.setState({
      size: measure(this),
      mounted: true
    }, this.watchResize)
  }

  watchResize () {
    // eslint-disable-next-line no-new
    new ResizeSensor(ReactDOM.findDOMNode(this), this.onResize)
  }

  onResize () {
    if (this.state.shouldReactResize) {
      if (this.props.onResize) {
        this.props.onResize(this)
      }
      this.resetSizes()
    }
    this.setState({shouldReactResize: true})
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.shouldReactResize === true && !this.state.shouldReactResize) {
      return false
    }
    return true
  }

  componentWillUnmount () {
    ResizeSensor.detach(this.el, this.onResize)
  }

  hasChanges (sizes, oldSizes) {
    const oldKeys = Object.keys(oldSizes)
    const keys = Object.keys(sizes)
    if (oldKeys.length !== keys.length) {
      return true
    }
    for (let i = 0; i < keys.length; i++) {
      const oldSize = oldSizes[oldKeys[i]]
      const size = sizes[keys[i]]
      if (size.width !== oldSize.width || size.height !== oldSize.height) {
        return true
      }
    }
    return false
  }
  resetSizes () {
    const state = this.state
    const sizes = Object.keys(state.children).reduce((sizes, key) => {
      const size = measure(state.children[key])
      sizes[key] = size
      return sizes
    }, {})
    const size = measure(this)
    const hasChanges = !state.size ||
      state.size.width !== size.width ||
      state.size.height !== size.height ||
      this.hasChanges(sizes, state.sizes)
    if (hasChanges) {
      this.setState({
        sizes: sizes,
        size: size,
        mounted: true
      }, () => {
        if (this.props.onLayout) {
          this.props.onLayout(this)
        }
      })
    } else if (!this.state.mounted) {
      this.setState({mounted: true})
    }
  }

  onItemChange (item) {
    const sizes = this.state.sizes
    sizes[item] = measure(item)
    this.setState({sizes: sizes})
  }

  onItemMount (item) {
    const sizes = this.state.sizes
    const children = this.state.children
    children[item.props['gallery-key']] = item
    sizes[item.props['gallery-key']] = measure(item)
    this.setState({sizes: sizes})
  }

  onItemUnMount (item) {
    delete this.state.sizes[item.props['gallery-key']]
    const children = this.state.children
    delete children[item.props['gallery-key']]
    this.setState({sizes: this.state.sizes, children: children})
  }

  render () {
    const state = this.state
    let propsClone = Object.assign({
      wrapper: 'ul',
      className: 'react-gallery'
    }, this.props)
    // eslint-disable-next-line no-unused-vars
    let {component, wrapper, columns, center, onLayout, onResize, throttle,
      gap, layout, rowHeight, columnWidth, centered, rtl, ...props} = propsClone
    var visible, rects, options
    if (this.props.children) {
      if (state.size) {
        visible = array(props.children)
        rects = visible.map((item, index) => {
          return state.sizes[item.key] || {width: 0, height: 0}
        })
        let height = Infinity
        if (layout === 'rows') {
          height = propsClone.rowHeight
        }
        options = {
          width: state.size.width,
          height: height,
          items: rects,
          gap: gap || 0,
          columns: columns,
          layout: layout,
          size: {
            height: rowHeight,
            width: columnWidth
          },
          rtl: rtl
        }
        rects = pack(options)
        if (centered) {
          const width = getWidth(rects)
          const offset = (state.size.width - width) / 2
          const f = rtl ? sub(offset) : add(offset)
          rects.forEach(rect => { rect.x = f(rect.x) })
        }
      } else {
        visible = array(props.children)
        rects = []
      }
    } else {
      visible = []
      rects = []
    }
    if (component) {
      props.component = component
    }
    const height = getHeight(rects)
    return React.createElement(wrapper || component,
      Object.assign({}, props, {style: {height}}),
      visible.map((child, index) => {
        return (
          <Item key={child.key}
            gallery-key={child.key}
            rect={rects[index]}
            layout={layout}
            onMount={this.onItemMount}
            onUnMount={this.onItemUnMount}
            onResize={this.resetSizes}>
            {child}
          </Item>
        )
      }
      )
    )
  }
}

Gallery.defaultProps = {
  throttle: 50,
  layout: 'binpack'
}

export {ResizeSensor}
