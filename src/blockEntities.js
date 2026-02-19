import getElementHTML from './util/getElementHTML.js'
import getElementTagLength from './util/getElementTagLength.js'
import rangeSort from './util/rangeSort.js'
import updateMutation from './util/updateMutation.js'

const converter = (_entity = {}, originalText = '') => originalText

export default (block, entityMap, entityConverter = converter) => {
  let resultText = [...block.text]

  let getEntityHTML = entityConverter

  if (entityConverter.__isMiddleware) {
    getEntityHTML = entityConverter(converter)
  }

  if (Object.hasOwn(block, 'entityRanges') && block.entityRanges.length > 0) {
    let entities = block.entityRanges.sort(rangeSort)

    let styles = block.inlineStyleRanges

    for (let index = 0; index < entities.length; index += 1) {
      const entityRange = entities[index]
      const entity = entityMap[entityRange.key]

      const originalText = resultText
        .slice(entityRange.offset, entityRange.offset + entityRange.length)
        .join('')

      const entityHTML = getEntityHTML(entity, originalText)
      const elementHTML = getElementHTML(entityHTML, originalText)
      let converted
      if (!!elementHTML || elementHTML === '') {
        converted = [...elementHTML]
      } else {
        converted = originalText
      }

      const prefixLength = getElementTagLength(entityHTML, 'start')
      const suffixLength = getElementTagLength(entityHTML, 'end')

      const updateLaterMutation = (mutation, mutationIndex) => {
        if (mutationIndex > index || Object.hasOwn(mutation, 'style')) {
          return updateMutation(
            mutation,
            entityRange.offset,
            entityRange.length,
            converted.length,
            prefixLength,
            suffixLength
          )
        }

        return mutation
      }

      const updateLaterMutations = (mutationList) =>
        mutationList.reduce((acc, mutation, mutationIndex) => {
          const updatedMutation = updateLaterMutation(mutation, mutationIndex)
          if (Array.isArray(updatedMutation)) {
            return acc.concat(updatedMutation)
          }

          return acc.concat([updatedMutation])
        }, [])

      entities = updateLaterMutations(entities)
      styles = updateLaterMutations(styles)

      resultText = [
        ...resultText.slice(0, entityRange.offset),
        ...converted,
        ...resultText.slice(entityRange.offset + entityRange.length),
      ]
    }

    return {
      ...block,
      text: resultText.join(''),
      inlineStyleRanges: styles,
      entityRanges: entities,
    }
  }

  return block
}
