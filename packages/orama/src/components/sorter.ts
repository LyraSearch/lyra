import { createError } from '../errors.js'
import { ISorter, OpaqueSorter, Orama, Schema, SorterConfig, SorterParams, SortType, SortValue } from '../types.js'

interface PropertySort<K> {
  docs: Record<string, number>
  orderedDocs: [string, K][]
  type: SortType;
  language?: string;
  sorted: boolean;
}

export interface Sorter extends OpaqueSorter {
  enabled: boolean
  sortableProperties: string[]
  sortablePropertiesWithTypes: Record<string, SortType>
  sorts: Record<string, PropertySort<number | string | boolean>>
}

export type DefaultSorter = ISorter<Sorter>

function innerCreate(schema: Schema, sortableDeniedProperties: string[], prefix: string): Sorter {
  const sorter: Sorter = {
    enabled: true,
    sortableProperties: [],
    sortablePropertiesWithTypes: {},
    sorts: {},
  }

  for (const [prop, type] of Object.entries(schema)) {
    const typeActualType = typeof type
    const path = `${prefix}${prefix ? '.' : ''}${prop}`

    if (sortableDeniedProperties.includes(path)) {
      continue
    }

    if (typeActualType === 'object' && !Array.isArray(type)) {
      // Nested
      const ret = innerCreate(type as Schema, sortableDeniedProperties, path)
      sorter.sortableProperties.push(...ret.sortableProperties)
      sorter.sorts = {
        ...sorter.sorts,
        ...ret.sorts,
      }
      sorter.sortablePropertiesWithTypes = {
        ...sorter.sortablePropertiesWithTypes,
        ...ret.sortablePropertiesWithTypes,
      }
      continue
    }

    switch (type) {
      case 'boolean':
      case 'number':
      case 'string':
        sorter.sortableProperties.push(path)
        sorter.sortablePropertiesWithTypes[path] = type
        sorter.sorts[path] = {
          docs: {},
          orderedDocs: [],
          type: type,
          sorted: true,
        }
        break
      case 'boolean[]':
      case 'number[]':
      case 'string[]':
        // We don't allow to sort by arrays
        continue
      default:
        throw createError('INVALID_SORT_SCHEMA_TYPE', Array.isArray(type) ? 'array' : (type as unknown as string), path)
    }
  }

  return sorter
}

async function create(_: Orama, schema: Schema, config?: SorterConfig): Promise<Sorter> {
  const isSortEnabled = config?.enabled !== false
  if (!isSortEnabled) {
    return {
      disabled: true,
    } as unknown as Sorter
  }
  return innerCreate(schema, (config || {}).unsortableProperties || [], '')
}

async function insert(
  sorter: Sorter,
  prop: string,
  id: string,
  value: SortValue,
  schemaType: SortType,
  language: string | undefined,
): Promise<void> {
  if (!sorter.enabled) {
    return
  }
  const s = sorter.sorts[prop]

  s.language = language;
  s.sorted = false;
  s.docs[id] = s.orderedDocs.length;
  s.orderedDocs.push([id, value]);
}

function ensureIsSorted(sorter: Sorter): void {
  const props = Object.keys(sorter.sorts);

  for (const prop of props) {
    ensurePropertyIsSorted(sorter, prop);
  }
}

function stringSort(language: string | undefined, value: [string, SortValue], d: [string, SortValue]): number {
  return (value[1] as string).localeCompare(d[1] as string, language)
}

function numberSort(value: [string, SortValue], d: [string, SortValue]): number {
  return (value[1] as number) - (d[1] as number)
}

function booleanSort(value: [string, SortValue], d: [string, SortValue]): number {
  return d[1] as boolean ? -1 : 1
}

function ensurePropertyIsSorted(sorter: Sorter, prop: string): void {
  const s = sorter.sorts[prop];

  if (s.sorted) {
    return;
  }

  let predicate: (value: [string, SortValue], d: [string, SortValue]) => number
  switch (s.type) {
    case 'string':
      predicate = stringSort.bind(null, s.language)
      break
    case 'number':
      predicate = numberSort.bind(null)
      break
    case 'boolean':
      predicate = booleanSort.bind(null)
      break
  }

  s.orderedDocs.sort(predicate);

  // Increment position for the greather documents
  const orderedDocsLength = s.orderedDocs.length;
  for (let i = 0; i < orderedDocsLength; i++) {
    const docId = s.orderedDocs[i][0]
    s.docs[docId] = i;
  }

  s.sorted = true;
}

async function remove(sorter: Sorter, prop: string, id: string) {
  if (!sorter.enabled) {
    return
  }
  const s = sorter.sorts[prop] as PropertySort<SortValue>

  const index = s.docs[id]
  delete s.docs[id]

  // Decrement position for the greater documents
  const orderedDocsLength = s.orderedDocs.length
  for (let i = index + 1; i < orderedDocsLength; i++) {
    const docId = s.orderedDocs[i][0]
    s.docs[docId]--
  }

  s.orderedDocs.splice(index, 1)
}

async function sortBy(sorter: Sorter, docIds: [string, number][], by: SorterParams): Promise<[string, number][]> {
  if (!sorter.enabled) {
    throw createError('SORT_DISABLED')
  }

  const property = by.property
  const isDesc = by.order === 'DESC'

  const s = sorter.sorts[property]
  if (!s) {
    throw createError('UNABLE_TO_SORT_ON_UNKNOWN_FIELD', property, sorter.sortableProperties.join(', '))
  }

  ensurePropertyIsSorted(sorter, property);

  docIds.sort((a, b) => {
    // This sort algorithm works leveraging on
    // that s.docs is a map of docId -> position
    // If a document is not indexed, it will be not present in the map
    const indexOfA = s.docs[a[0]]
    const indexOfB = s.docs[b[0]]
    const isAIndexed = typeof indexOfA !== 'undefined'
    const isBIndexed = typeof indexOfB !== 'undefined'

    if (!isAIndexed && !isBIndexed) {
      return 0
    }
    // unindexed documents are always at the end
    if (!isAIndexed) {
      return 1
    }
    if (!isBIndexed) {
      return -1
    }

    return isDesc ? indexOfB - indexOfA : indexOfA - indexOfB
  })

  return docIds
}

async function getSortableProperties(sorter: Sorter): Promise<string[]> {
  if (!sorter.enabled) {
    return []
  }

  return sorter.sortableProperties
}

async function getSortablePropertiesWithTypes(sorter: Sorter): Promise<Record<string, SortType>> {
  if (!sorter.enabled) {
    return {}
  }

  return sorter.sortablePropertiesWithTypes
}

export async function load<R = unknown>(raw: R): Promise<Sorter> {
  const rawDocument = raw as Sorter
  if (!rawDocument.enabled) {
    return {
      enabled: false,
    } as unknown as Sorter
  }

  return {
    sortableProperties: rawDocument.sortableProperties,
    sortablePropertiesWithTypes: rawDocument.sortablePropertiesWithTypes,
    sorts: rawDocument.sorts,
    enabled: true,
  }
}

export async function save<R = unknown>(sorter: Sorter): Promise<R> {
  if (!sorter.enabled) {
    return {
      enabled: false,
    } as unknown as R
  }

  return {
    sortableProperties: sorter.sortableProperties,
    sortablePropertiesWithTypes: sorter.sortablePropertiesWithTypes,
    sorts: sorter.sorts,
    enabled: sorter.enabled,
  } as R
}

export async function createSorter(): Promise<DefaultSorter> {
  return {
    create,
    insert,
    remove,
    save,
    load,
    sortBy,
    getSortableProperties,
    getSortablePropertiesWithTypes,
    ensureIsSorted,
    ensurePropertyIsSorted,
  }
}
