import invariant from 'invariant'
import React from 'react'
import splitReactElement from './splitReactElement.js'

export default function getNestedBlockTags(blockHTML, depth) {
  invariant(
    blockHTML !== null && blockHTML !== undefined,
    'Expected block HTML value to be non-null'
  )

  if (typeof blockHTML.nest === 'function') {
    const { start, end } = splitReactElement(blockHTML.nest(depth))

    return { ...blockHTML, nestStart: start, nestEnd: end }
  }

  if (React.isValidElement(blockHTML.nest)) {
    const { start, end } = splitReactElement(blockHTML.nest)

    return { ...blockHTML, nestStart: start, nestEnd: end }
  }

  invariant(
    Object.hasOwn(blockHTML, 'nestStart') && Object.hasOwn(blockHTML, 'nestEnd'),
    'convertToHTML: received block information without either a ReactElement or an object with start/end tags'
  )

  return blockHTML
}
