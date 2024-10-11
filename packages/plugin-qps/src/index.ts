import type { create, AnyOrama, SearchableType, IIndex, AnyIndexStore, SearchableValue, Tokenizer, OnlyStrings, FlattenSchemaProperty, TokenScore, WhereCondition } from '@orama/orama'
import {
  index as Index, internalDocumentIDStore } from '@orama/orama/components'
import { insertString, QPSIndex, recursiveCreate, searchString } from './algorithm.js';
import { radix } from '@orama/orama/trees';

type InternalDocumentID = internalDocumentIDStore.InternalDocumentID;
type InternalDocumentIDStore = internalDocumentIDStore.InternalDocumentIDStore;

type CreateParams = Parameters<typeof create<AnyOrama, IIndex<QPSIndex>>>[0]
type Component = NonNullable<CreateParams['components']>
type IndexParameter = NonNullable<Component['index']>
type DocumentID = internalDocumentIDStore.DocumentID;


const unusedRadix = new radix.RadixNode('', '', false)
const unusedStats = {
  tokenQuantums: {},
  tokensLength: new Map(),
}

function search<T extends AnyOrama>(index: QPSIndex, term: string, tokenizer: Tokenizer, language: string | undefined, propertiesToSearch: string[], exact: boolean, tolerance: number, boost: Partial<Record<OnlyStrings<FlattenSchemaProperty<T>[]>, number>>): TokenScore[] {
  const all: Map<InternalDocumentID, [number, number]> = new Map()

  const args = {
    tokens: tokenizer.tokenize(term, language),
    radixNode: unusedRadix,
    exact,
    tolerance,
    stats: unusedStats,
    boostPerProp: 0,
    all,
    resultMap: all,
  }

  const propertiesToSearchLength = propertiesToSearch.length
  for (let i = 0; i < propertiesToSearchLength; i++) {
    const prop = propertiesToSearch[i]
    const stats = index.stats[prop]
    const boostPerProp = boost[prop] ?? 1
    args.radixNode = index.indexes[prop].node as radix.RadixNode
    args.stats = stats
    args.boostPerProp = boostPerProp
    searchString(args)
  }

  const g: [number, [number, number]][] = Array.from(all)
  const gLength = g.length
  const res: TokenScore[] = []
  for (let i = 0; i < gLength; i++) {
    const element = g[i]
    const id = element[0]
    const score = element[1][0]

    res.push([id, score])
  }

  return res
}

export function qpsComponents(): {
  index: IndexParameter,
} {
  return {
    index: {
      create: function create<T extends AnyOrama>(orama: T, sharedInternalDocumentStore: T['internalDocumentIDStore'], schema: T['schema']) {
        const indexDatastore: QPSIndex = {
          indexes: {},
          vectorIndexes: {},
          searchableProperties: [],
          searchablePropertiesWithTypes: {},
          stats: {}
        }

        recursiveCreate(indexDatastore, schema, '')

        return indexDatastore
      },
      insert: function insert(
        implementation: IIndex<QPSIndex>,
        indexDatastorage: QPSIndex,
        prop: string,
        id: DocumentID,
        internalId: InternalDocumentID,
        value: SearchableValue,
        schemaType: SearchableType,
        language: string | undefined,
        tokenizer: Tokenizer,
        docsCount: number
      ) {
        if (!(schemaType === 'string' || schemaType === 'string[]')) {
          return Index.insert(implementation as unknown as IIndex<Index.Index>, indexDatastorage as unknown as Index.Index, prop, id, internalId, value, schemaType, language, tokenizer, docsCount)
        }

        if (!indexDatastorage.stats[prop]) {
          indexDatastorage.stats[prop] = {
            tokenQuantums: {},
            tokensLength: new Map()
          }
        }

        const stats = indexDatastorage.stats[prop]
        const radixTree = indexDatastorage.indexes[prop].node as radix.RadixNode

        stats.tokenQuantums[internalId] = {}

        if (Array.isArray(value)) {
          for (const item of value) {
            insertString(
              item as string,
              radixTree,
              stats,
              prop,
              internalId,
              language,
              tokenizer,
            )
          }
        } else {
          insertString(
            value as string,
            radixTree,
            stats,
            prop,
            internalId,
            language,
            tokenizer,
          )
        }
      },
      remove: function remove() {
        throw new Error('Not implemented yet')
      },
      insertDocumentScoreParameters: () => {throw new Error()},
      insertTokenScoreParameters: () => {throw new Error()},
      removeDocumentScoreParameters: () => {throw new Error()},
      removeTokenScoreParameters: () => {throw new Error()},
      calculateResultScores: () => {throw new Error()},
      search,
      searchByWhereClause: function searchByWhereClause<T extends AnyOrama>(index: AnyIndexStore, tokenizer: Tokenizer, filters: Partial<WhereCondition<T['schema']>>, language: string | undefined): InternalDocumentID[] {
        return Index.searchByWhereClause(index as Index.Index, tokenizer, filters, language)
      },
      getSearchableProperties: function getSearchableProperties(index: QPSIndex): string[] {
        return index.searchableProperties
      },
      getSearchablePropertiesWithTypes: function (index: QPSIndex) {
        return index.searchablePropertiesWithTypes
      },
      load: function load<R = unknown>(sharedInternalDocumentStore: InternalDocumentIDStore, raw: R): QPSIndex {
        const dump1 = Index.load(sharedInternalDocumentStore, raw[0])

        const dump2 = raw[1] as {
          radixTrees: [string, boolean, string, unknown][],
          stats: [string, {
            tokenQuantums: [InternalDocumentID, Record<string, number>][],
            tokensLength: [InternalDocumentID, number][]
          }][]
        }

        const indexes = {
          ...dump1.indexes,
          ...Object.fromEntries(dump2.radixTrees.map(([prop, isArray, type, node]) => [prop, { node: radix.RadixNode.fromJSON(node), isArray, type } as Index.Tree]))
        };

        return {
          ...dump1,
          indexes,
          stats: Object.fromEntries(dump2.stats.map(([prop, { tokenQuantums, tokensLength }]) => [prop, {
            tokenQuantums,
            tokensLength: new Map(tokensLength)
          }]))
        } as unknown as QPSIndex
      },
      save: function save<R = unknown>(index: QPSIndex): R {
        const baseIndex = index as unknown as Index.Index
        const nonStringIndexes = Object.entries(baseIndex.indexes).filter(([, { type }]) => type !== 'Radix')
        const dump1 = Index.save({
          ...baseIndex,
          indexes: Object.fromEntries(nonStringIndexes)
        })

        const stringIndexes = Object.entries(baseIndex.indexes).filter(([, { type }]) => type === 'Radix')
        const dump2 = {
          radixTrees: stringIndexes.map(([prop, { node, isArray, type }]) => [prop, isArray, type, node.toJSON()]),
          stats: Object.entries(index.stats).map(([prop, { tokenQuantums, tokensLength }]) => [prop, {
            tokenQuantums,
            tokensLength: Array.from(tokensLength.entries())
          }])
        }

        return [dump1, dump2] as unknown as R
      }
    }
  }
}
