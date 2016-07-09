require('./sass/index.sass')

import React from 'react'
import ReactDOM from 'react-dom'
import Item from './src/item'
import pack from './src/pack'
import {keys, filter, until} from './src/utils'
import throttle from 'throttle-debounce/throttle'

function measure (component) {
  const node = ReactDOM.findDOMNode(component)
  return {
    width: Math.floor(node.offsetWidth),
    height: Math.floor(node.offsetHeight)
  }
}

function getHeight (rects) {
  return rects.reduce(((height, rect) => {
    if (rect.y == undefined)
      return height
    return Math.max(height, rect.y + rect.height)
  }), 0)
}

function getWidth (rects) {
  return rects.reduce(((width, rect)=> {
     if (rect.x == undefined)
      return width
    return Math.max(width, rect.x + rect.width)
  }), 0)
}

export default class Gallery extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      size: null,
      sizes: {},
      children: [],
      mounted: false
    }
    this.resetSizes = throttle(props.throttle, ::this.resetSizes)
    this.onItemMount = ::this.onItemMount
    this.onItemUnMount = ::this.onItemUnMount
    this.onItemChange = ::this.onItemChange
  }

  componentDidMount () {
    window.addEventListener('resize', this.resetSizes)
    this.resetSizes()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resetSizes)
  }

  hasChanges (sizes, oldSizes) {
    const oldKeys = Object.keys(oldSizes)
    const keys = Object.keys(sizes)
    if (oldKeys.length != keys.length)
      return true
    for (let i = 0; i < keys.length; i++) {
      const oldSize = oldSizes[oldKeys[i]]
      const size = sizes[keys[i]]
      if (size.width != oldSize.width || size.height != oldSize.height) {
        return true
      }
    }
    return false
  }

  resetSizes () {
    const sizes = this.state.children.reduce((sizes, item) => {
      const size = measure(item)
      sizes[item.props['gallery-key']] = size
      return sizes
    }, {})
    const size = measure(this)
    const hasChanges = !this.state.size || this.state.size.width !== size.width || this.state.size.height !== size.height || this.hasChanges(sizes, this.state.sizes)
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
    children.push(item)

    if (this.state.mounted) {
      sizes[item.props['gallery-key']] = measure(item)
      this.setState({sizes: sizes})
    }

  }

  onItemUnMount (item) {
    delete this.state.sizes[item.props['gallery-key']]
    const children = this.state.children
    children.splice(children.indexOf(item), 1)
    this.setState({sizes: this.state.sizes, children: children})
  }

  render (){
    let propsClone = Object.assign({
      component: 'ul',
      className: 'react-gallery'
    }, this.props)
    let {component, wrapper, gap, columns, center, onLayout, throttle, ...props} = propsClone
    var visible, rects, options
    if (this.state.size) {
      visible = until(props.children, (child) => child.state && child.state.wait)
      rects = visible.map((item, index)=> {
        return this.state.sizes[item.key] || {width: 0, height: 0}
      })
      options = Object.assign({}, {
          width: this.state.size.width,
          height: Infinity,
          items: rects,
          gap: gap,
          columns: columns
        }, keys(props, ['size'])
      )
      rects = pack(options)
      if (this.props.centered) {
        const width = getWidth(rects)
        const offset = (this.state.size.width - width) / 2
        rects.forEach((rect)=> {rect.x += offset})
      }
    } else {
      visible = []
      rects = []
    }
    let height = getHeight(rects)
    return React.createElement(wrapper || component, Object.assign(props, {style: {height: height}}),
      visible.map((child, index)=> {
        return (
          <Item key={child.key}
            gallery-key={child.key}
            rect={rects[index]}
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
  throttle: 100
}
