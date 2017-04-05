import React from 'react'
import ReactDOM from 'react-dom'
import ResizeSensor from './resize'

export default class Item extends React.Component {
  constructor (props) {
    super(props)
    this.onResize = ::this.onResize
  }

  measure () {
    const childProps = this.props.children.props
    if (childProps.width && childProps.height) {
      return {width: childProps.width, height: childProps.height}
    }
    if (this.refs.item.measure) {
      return this.refs.item.measure()
    }
    const node = ReactDOM.findDOMNode(this)
    return {
      width: Math.floor(node.offsetWidth),
      height: Math.floor(node.offsetHeight)
    }
  }

  componentDidMount () {
    this.props.onMount(this)
    if (this.props.layout === 'binpack') {
      new ResizeSensor(ReactDOM.findDOMNode(this), this.onResize)
    }
  }

  onResize () {
    if (this.props.onResize) {
      this.props.onResize(this)
    }
    if (this.props.children.onResize) {
      this.props.children.onResize(this)
    }
  }

  componentWillUnmount () {
    this.props.onUnMount(this)
    if (this.props.layout === 'binpack') {
      ResizeSensor.detach(ReactDOM.findDOMNode(this), this.onResize)
    }
  }

  render () {
    const props = Object.assign({}, this.props, {
      visible: !!this.props.rect,
      rect: this.props.rect,
      ref: 'item',
    })
    if (props.rect) {
      let transform = `translate(${props.rect.x}px, ${props.rect.y}px)`
      if (props.style && props.style.transform) {
        transform = transform + ' ' + props.style.transform
      }
      props.style = Object.assign({}, props.style, {
        transform: transform,
        WebkitTransform: transform,
        OTransform: transform,
        MsTransform: transform,
        MozTransform: transform
      }
      )
      if (this.props.layout !== 'binpack') {
        props.style.width = props.rect.width + 'px'
        props.style.height = props.rect.height + 'px'
      }
    }
    return React.cloneElement(props.children, props)
  }
}
