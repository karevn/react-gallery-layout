require('./sass/index.sass')

import React from 'react'
import ReactDOM from 'react-dom'
import Item from './src/item'
import pack from './src/pack'

import throttle from 'throttle-debounce/throttle'

import ResizeSensor from './src/resize'

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
  return rects.reduce((width, rect) => {
    if (rect.x === undefined) {
      return width
    }
    return Math.max(width, rect.x + rect.width)
  }, 0)
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
    const sizes = Object.keys(this.state.children).reduce((sizes, key) => {
      const size = measure(this.state.children[key])
      sizes[key] = size
      return sizes
    }, {})
    const size = measure(this)
    const hasChanges = !this.state.size ||
      this.state.size.width !== size.width ||
      this.state.size.height !== size.height ||
      this.hasChanges(sizes, this.state.sizes)
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
    let propsClone = Object.assign({
      wrapper: 'ul',
      className: 'react-gallery'
    }, this.props)
    // eslint-disable-next-line no-unused-vars
    let {component, wrapper, columns, center, onLayout, onResize, throttle,
      gap, layout, rowHeight, columnWidth, centered, ...props} = propsClone
    var visible, rects, options
    if (this.state.size) {
      visible = props.children
      rects = visible.map((item, index) => {
        return this.state.sizes[item.key] || {width: 0, height: 0}
      })
      let height = Infinity
      if (layout === 'rows') {
        height = propsClone.rowHeight
      }
      options = {
        width: this.state.size.width,
        height: height,
        items: rects,
        gap: gap || 0,
        columns: columns,
        layout: layout,
        size: {
          height: rowHeight,
          width: columnWidth
        }
      }
      rects = pack(options)
      if (centered) {
        const width = getWidth(rects)
        const offset = (this.state.size.width - width) / 2
        rects.forEach(rect => { rect.x += offset })
      }
    } else {
      visible = props.children
      rects = []
    }
    if (component) {
      props.component = component
    }
    let height = getHeight(rects)
    return React.createElement(wrapper || component,
      Object.assign({}, props, {style: {height: height}}),
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
