import invariant from 'invariant'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import splitReactElement from './splitReactElement.js'

function hasChildren(element) {
  return React.isValidElement(element) && React.Children.count(element.props.children) > 0
}

export default function getBlockTags(blockHTML) {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  )

  if (typeof blockHTML === 'string') {
    return blockHTML
  }

  if (React.isValidElement(blockHTML)) {
    if (hasChildren(blockHTML)) {
      return ReactDOMServer.renderToStaticMarkup(blockHTML)
    }

    return splitReactElement(blockHTML)
  }

  if (Object.hasOwn(blockHTML, 'element') && React.isValidElement(blockHTML.element)) {
    return { ...blockHTML, ...splitReactElement(blockHTML.element) }
  }

  invariant(
    Object.hasOwn(blockHTML, 'start') && Object.hasOwn(blockHTML, 'end'),
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  )

  return blockHTML
}
