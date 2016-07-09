import React from 'react'
import ReactDOM from 'react-dom'
import ResizeSensor from './resize'

export default class Item extends React.Component {
  constructor (props) {
    super(props)
    this.onResize = ::this.onResize
  }

  componentDidMount () {
    this.props.onMount(this)
    new ResizeSensor(ReactDOM.findDOMNode(this), this.onResize)
  }

  onResize () {
    if (this.props.onResize) {
      this.props.onResize(this)
    }
  }
  componentWillUnmount () {
    this.props.onUnMount(this)
    ResizeSensor.detach(ReactDOM.findDOMNode(this), this.onResize)
  }

  render () {
    const props = Object.assign({}, this.props, {
      visible: !!this.props.rect,
    })
    if (props.rect){
      let transform = `translate(${props.rect.x}px, ${props.rect.y}px)`
      if (props.style && props.style.transform) {
        transform = transform + " " + props.style.transform
      }
      props.style = Object.assign({}, props.style, {
        transform: transform,
        WebkitTransform: transform,
        OTransform: transform,
        MsTransform: transform,
        MozTransform: transform
      }
      )
    }
    return React.cloneElement(props.children, props)
  }
}
