import { isArrayType } from '../components.js'
import { runMultipleHook, runSingleHook } from '../components/hooks.js'
import { trackInsertion } from '../components/sync-blocking-checker.js'
import { createError } from '../errors.js'
import { Document, Orama } from '../types.js'

export async function insert(orama: Orama, doc: Document, language?: string, skipHooks?: boolean): Promise<string> {
  const errorProperty = await orama.validateSchema(doc, orama.schema)
  if (errorProperty) {
    throw createError('SCHEMA_VALIDATION_FAILURE', errorProperty)
  }
  const { index, docs } = orama.data

  const id = await orama.getDocumentIndexId(doc)

  if (typeof id !== 'string') {
    throw createError('DOCUMENT_ID_MUST_BE_STRING', typeof id)
  }

  if (!(await orama.documentsStore.store(docs, id, doc))) {
    throw createError('DOCUMENT_ALREADY_EXISTS', id)
  }

  const docsCount = await orama.documentsStore.count(docs)

  if (!skipHooks) {
    await runSingleHook(orama.beforeInsert, orama, id, doc)
  }

  const indexableProperties = await orama.index.getSearchableProperties(index)
  const indexablePropertiesWithTypes = await orama.index.getSearchablePropertiesWithTypes(index)
  const values = await orama.getDocumentProperties(doc, indexableProperties)

  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'undefined') {
      continue
    }

    const actualType = typeof value
    const expectedType = indexablePropertiesWithTypes[key]

    if (isArrayType(expectedType) && Array.isArray(value)) {
      continue
    }

    if (actualType !== expectedType) {
      throw createError('INVALID_DOCUMENT_PROPERTY', key, expectedType, actualType)
    }
  }

  for (const prop of indexableProperties) {
    const value = values[prop]
    const expectedType = indexablePropertiesWithTypes[prop]

    if (typeof value === 'undefined') {
      continue
    }

    await orama.index.beforeInsert?.(
      orama.data.index,
      prop,
      id,
      value,
      expectedType,
      language,
      orama.tokenizer,
      docsCount,
    )
    await orama.index.insert(
      orama.index,
      orama.data.index,
      prop,
      id,
      value,
      expectedType,
      language,
      orama.tokenizer,
      docsCount,
    )
    await orama.index.afterInsert?.(
      orama.data.index,
      prop,
      id,
      value,
      expectedType,
      language,
      orama.tokenizer,
      docsCount,
    )
  }

  if (!skipHooks) {
    await runSingleHook(orama.afterInsert, orama, id, doc)
  }

  trackInsertion(orama)

  return id
}

export async function insertMultiple(
  orama: Orama,
  docs: Document[],
  batchSize?: number,
  language?: string,
  skipHooks?: boolean,
): Promise<string[]> {
  if (!batchSize) {
    batchSize = 1000
  }

  if (!skipHooks) {
    await runMultipleHook(orama.beforeMultipleInsert, orama, docs)
  }

  const ids: string[] = []

  await new Promise<void>((resolve, reject) => {
    let i = 0
    async function _insertMultiple() {
      const batch = docs.slice(i * batchSize!, (i + 1) * batchSize!)
      i++

      if (!batch.length) {
        return resolve()
      }

      for (const doc of batch) {
        try {
          const id = await insert(orama, doc, language, skipHooks)
          ids.push(id)
        } catch (err) {
          reject(err)
        }
      }

      setTimeout(_insertMultiple, 0)
    }

    setTimeout(_insertMultiple, 0)
  })

  if (!skipHooks) {
    await runMultipleHook(orama.afterMultipleInsert, orama, docs)
  }

  return ids
}
