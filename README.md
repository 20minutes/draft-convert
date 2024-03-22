@20minutes/draft-convert
===============

[![Node CI](https://github.com/20minutes/draft-convert/actions/workflows/ci.yml/badge.svg)](https://github.com/20minutes/draft-convert/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@20minutes%2Fdraft-convert.svg)](https://badge.fury.io/js/@20minutes%2Fdraft-convert)
[![npm downloads](https://img.shields.io/npm/dt/@20minutes%2Fdraft-convert.svg?style=flat)](https://www.npmjs.com/package/@20minutes%2Fdraft-convert)

Forked version:
- with deps up to date
- CI on GitHub Actions
- new [`validateHTML`](#validatehtml-option-of-converttohtml) function parameter for `convertToHTML`

For the official readme, [check the official project](https://github.com/HubSpot/draft-convert).

## `validateHTML` (option of `convertToHTML`)

`validateHTML` take the final HTML of the current block as parameter and must return a boolean saying if every thing is ok.

We do have some custom entity/block generation and sometimes, the produced HTML might be wrong. So we validate it using ReactDomServer, like:


```js
import ReactDOMServer from 'react-dom/server'
import { Parser as HtmlToReactParser } from 'html-to-react'

// ...

const html = convertToHTML({
  // ...
  validateHTML: (html) => {
    try {
      const htmlToReactParser = HtmlToReactParser()

      ReactDOMServer.renderToString(htmlToReactParser.parse(html))

      return true
    } catch (e) {
      return false
  }
})(editorState.getCurrentContent());
````
