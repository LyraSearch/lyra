import * as ERRORS from "./errors";
import { Tokenizer, tokenize } from "./tokenizer";
import { getNanosecondsTime, uniqueId, reservedPropertyNames } from "./utils";
import { Language, SUPPORTED_LANGUAGES } from "./tokenizer/languages";
import type { ResolveSchema, SearchProperties } from "./types";
import { availableStemmers, Stemmer, stemmers } from "./tokenizer/stemmer";
import { create as createNode, Node } from "./prefix-tree/node";
import { find as trieFind, insert as trieInsert, removeDocumentByWord, Nodes } from "./prefix-tree/trie";
import { trackInsertion } from "./insertion-checker";
import { availableStopWords, stopWords } from "./tokenizer/stop-words";

type Index = Record<string, Node>;

export { formatNanoseconds } from "./utils";
export { tokenize } from "./tokenizer";

export type PropertyType = "string" | "number" | "boolean";

export type PropertiesSchema = {
  [key: string]: PropertyType | PropertiesSchema;
};

export interface AfterInsertHook {
  <S extends PropertiesSchema = PropertiesSchema>(this: Lyra<S>, id: string): Promise<void> | void;
}

const SUPPORTED_HOOKS = ["afterInsert"];

type Hooks = {
  afterInsert?: AfterInsertHook | AfterInsertHook[];
};

export type TokenizerConfig = {
  enableStemming?: boolean;
  enableStopWords?: boolean;
  customStopWords?: ((stopWords: string[]) => string[]) | string[];
  stemmingFn?: Stemmer;
  tokenizerFn?: Tokenizer;
};

export type TokenizerConfigExec = {
  enableStemming: boolean;
  enableStopWords: boolean;
  customStopWords: string[];
  stemmingFn?: Stemmer;
  tokenizerFn: Tokenizer;
};

export type Configuration<S extends PropertiesSchema> = {
  /**
   * The structure of the document to be inserted into the database.
   */
  schema: S;
  /**
   * The default language analyzer to use.
   */
  defaultLanguage?: Language;
  edge?: boolean;
  hooks?: Hooks;
  tokenizer?: TokenizerConfig;
};

export type Data<S extends PropertiesSchema> = {
  docs: Record<string, ResolveSchema<S> | undefined>;
  index: Index;
  nodes: Nodes;
  schema: S;
};

export interface Lyra<S extends PropertiesSchema> extends Data<S> {
  defaultLanguage: Language;
  schema: S;
  edge: boolean;
  hooks: Hooks;
  tokenizer?: TokenizerConfig;
}

export type InsertConfig = {
  language: Language;
};

export type InsertBatchConfig = InsertConfig & {
  batchSize?: number;
};

export type SearchParams<S extends PropertiesSchema> = {
  /**
   * The word to search.
   */
  term: string;
  /**
   * The properties of the document to search in.
   */
  properties?: "*" | SearchProperties<S>[];
  /**
   * The number of matched documents to return.
   */
  limit?: number;
  /**
   * The number of matched documents to skip.
   */
  offset?: number;
  /**
   * Whether to match the term exactly.
   */
  exact?: boolean;
  /**
   * The maximum [levenshtein distance](https://en.wikipedia.org/wiki/Levenshtein_distance)
   * between the term and the searchable property.
   */
  tolerance?: number;
};

export type SearchResult<S extends PropertiesSchema> = {
  /**
   * The number of all the matched documents.
   */
  count: number;
  /**
   * An array of matched documents taking `limit` and `offset` into account.
   */
  hits: RetrievedDoc<S>[];
  /**
   * The time taken to search.
   */
  elapsed: bigint;
};

export type RetrievedDoc<S extends PropertiesSchema> = ResolveSchema<S> & {
  /**
   * The id of the document.
   */
  id: string;
};

function validateHooks(hooks?: Hooks): void | never {
  if (hooks) {
    if (typeof hooks !== "object") {
      throw new Error(ERRORS.INVALID_HOOKS_OBJECT());
    }

    const invalidHooks = Object.keys(hooks).filter(hook => !SUPPORTED_HOOKS.includes(hook));
    if (invalidHooks.length) {
      throw new Error(ERRORS.NON_SUPPORTED_HOOKS(invalidHooks));
    }
  }
}

async function hookRunner<S extends PropertiesSchema>(
  this: Lyra<S>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  funcs: Function | Function[],
  ...args: unknown[]
): Promise<void> {
  const hooks = Array.isArray(funcs) ? funcs : [funcs];
  for (const hook of hooks) {
    await hook.apply(this, args);
  }
}

function buildIndex<S extends PropertiesSchema>(lyra: Lyra<S>, schema: S, prefix = "") {
  for (const prop of Object.keys(schema)) {
    if (reservedPropertyNames.includes(prop)) {
      throw new Error(ERRORS.RESERVED_PROPERTY_NAME(prop));
    }

    const propType = typeof prop;
    const isNested = typeof schema[prop] === "object";

    if (propType !== "string") throw new Error(ERRORS.INVALID_SCHEMA_TYPE(propType));

    const propName = `${prefix}${prop}`;

    if (isNested) {
      buildIndex(lyra, schema[prop] as S, `${propName}.`);
    } else {
      lyra.index[propName] = createNode();
    }
  }
}

function recursiveCheckDocSchema<S extends PropertiesSchema>(
  newDoc: ResolveSchema<S>,
  schema: PropertiesSchema,
): boolean {
  for (const key in newDoc) {
    if (!(key in schema)) {
      return false;
    }

    const propType = typeof newDoc[key];

    if (propType === "object") {
      recursiveCheckDocSchema(newDoc[key] as ResolveSchema<S>, schema);
    } else {
      if (typeof newDoc[key] !== schema[key]) {
        return false;
      }
    }
  }

  return true;
}

function recursiveTrieInsertion<S extends PropertiesSchema>(
  index: Index,
  nodes: Nodes,
  doc: ResolveSchema<S>,
  id: string,
  config: InsertConfig,
  prefix = "",
  tokenizerConfig: TokenizerConfigExec,
) {
  for (const key of Object.keys(doc)) {
    const isNested = typeof doc[key] === "object";
    const propName = `${prefix}${key}`;
    if (isNested) {
      recursiveTrieInsertion(index, nodes, doc[key] as ResolveSchema<S>, id, config, propName + ".", tokenizerConfig);

      return;
    }

    if (typeof doc[key] === "string") {
      // Use propName here because if doc is a nested object
      // We will get the wrong index
      const requestedTrie = index[propName];
      const tokens = tokenizerConfig.tokenizerFn(doc[key] as string, config.language, false, tokenizerConfig);

      for (const token of tokens) {
        trieInsert(nodes, requestedTrie, token, id);
      }
    }
  }
}

function getIndices<S extends PropertiesSchema>(lyra: Lyra<S>, indices: SearchParams<S>["properties"]): string[] {
  const knownIndices = Object.keys(lyra.index);

  if (!indices) {
    return knownIndices;
  }

  if (typeof indices === "string") {
    if (indices === "*") {
      return knownIndices;
    } else {
      throw new Error(ERRORS.INVALID_PROPERTY(indices, knownIndices));
    }
  }

  for (const index of indices as string[]) {
    if (!knownIndices.includes(index)) {
      throw new Error(ERRORS.INVALID_PROPERTY(index, knownIndices));
    }
  }

  return indices as string[];
}

function getDocumentIDsFromSearch<S extends PropertiesSchema>(
  lyra: Lyra<S>,
  params: SearchParams<S> & { index: string },
): string[] {
  const idx = lyra.index[params.index];

  const searchResult = trieFind(lyra.nodes, idx, {
    term: params.term,
    exact: params.exact,
    tolerance: params.tolerance,
  });
  const ids = new Set<string>();

  for (const key in searchResult) {
    for (const id of searchResult[key]) {
      ids.add(id);
    }
  }

  return Array.from(ids);
}

/**
 * Creates a new database.
 * @param properties Options to initialize the database with.
 * @example
 * // Create a database that stores documents containing 'author' and 'quote' fields.
 * const db = create({
 *   schema: {
 *     author: 'string',
 *     quote: 'string'
 *   },
 *   hooks: {
 *     afterInsert: [afterInsertHook],
 *   }
 * });
 */
export function create<S extends PropertiesSchema>(properties: Configuration<S>): Lyra<S> {
  const defaultLanguage = (properties?.defaultLanguage?.toLowerCase() as Language) ?? "english";

  if (!SUPPORTED_LANGUAGES.includes(defaultLanguage)) {
    throw new Error(ERRORS.LANGUAGE_NOT_SUPPORTED(defaultLanguage));
  }

  validateHooks(properties.hooks);

  const instance: Lyra<S> = {
    defaultLanguage,
    schema: properties.schema,
    docs: {},
    nodes: {},
    index: {},
    hooks: properties.hooks || {},
    edge: properties.edge ?? false,
    tokenizer: defaultTokenizerConfig(defaultLanguage, properties.tokenizer!),
  };

  buildIndex(instance, properties.schema);
  return instance;
}

/**
 * Inserts a document into a database.
 * @param lyra The database to insert document into.
 * @param doc The document to insert.
 * @param config Optional parameter for overriding default configuration.
 * @returns An object containing id of the inserted document.
 * @example
 * const { id } = insert(db, {
 *   quote: 'You miss 100% of the shots you don\'t take',
 *   author: 'Wayne Gretzky - Michael Scott'
 * });
 */
export function insert<S extends PropertiesSchema>(
  lyra: Lyra<S>,
  doc: ResolveSchema<S>,
  config?: InsertConfig,
): { id: string } {
  config = { language: lyra.defaultLanguage, ...config };
  const id = uniqueId();

  if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw new Error(ERRORS.LANGUAGE_NOT_SUPPORTED(config.language));
  }

  if (!recursiveCheckDocSchema(doc, lyra.schema)) {
    throw new Error(ERRORS.INVALID_DOC_SCHEMA(lyra.schema, doc));
  }

  lyra.docs[id] = doc;
  recursiveTrieInsertion(lyra.index, lyra.nodes, doc, id, config, undefined, lyra.tokenizer as TokenizerConfigExec);
  trackInsertion(lyra);

  return { id };
}

/**
 * Inserts a document into a database.
 * @param lyra The database to insert document into.
 * @param doc The document to insert.
 * @param config Optional parameter for overriding default configuration.
 * @returns A Promise object containing id of the inserted document.
 * @example
 * const { id } = insert(db, {
 *   quote: 'You miss 100% of the shots you don\'t take',
 *   author: 'Wayne Gretzky - Michael Scott'
 * });
 */
export async function insertWithHooks<S extends PropertiesSchema>(
  lyra: Lyra<S>,
  doc: ResolveSchema<S>,
  config?: InsertConfig,
): Promise<{ id: string }> {
  config = { language: lyra.defaultLanguage, ...config };
  const id = uniqueId();

  if (!SUPPORTED_LANGUAGES.includes(config.language)) {
    throw new Error(ERRORS.LANGUAGE_NOT_SUPPORTED(config.language));
  }

  if (!recursiveCheckDocSchema(doc, lyra.schema)) {
    throw new Error(ERRORS.INVALID_DOC_SCHEMA(lyra.schema, doc));
  }

  lyra.docs[id] = doc;
  recursiveTrieInsertion(lyra.index, lyra.nodes, doc, id, config, undefined, lyra.tokenizer as TokenizerConfigExec);
  trackInsertion(lyra);
  if (lyra.hooks.afterInsert) {
    await hookRunner.call(lyra, lyra.hooks.afterInsert, id);
  }

  return { id };
}

/**
 * Inserts a large array of documents into a database without blocking the event loop.
 * @param lyra The database to insert document into.
 * @param docs Array of documents to insert.
 * @param config Optional parameter for overriding default configuration.
 * @returns Promise<void>.
 * @example
 * insertBatch(db, [
 *   {
 *     quote: 'You miss 100% of the shots you don\'t take',
 *     author: 'Wayne Gretzky - Michael Scott'
 *   },
 *   {
 *     quote: 'What I cannot createm I do not understand',
 *     author: 'Richard Feynman'
 *   }
 * ]);
 */

export async function insertBatch<S extends PropertiesSchema>(
  lyra: Lyra<S>,
  docs: ResolveSchema<S>[],
  config?: InsertBatchConfig,
): Promise<void> {
  const batchSize = config?.batchSize ?? 1000;

  return new Promise((resolve, reject) => {
    let i = 0;
    async function insertBatch() {
      const batch = docs.slice(i * batchSize, (i + 1) * batchSize);
      i++;

      if (!batch.length) {
        return resolve();
      }

      for (const line of batch) {
        try {
          await insertWithHooks(lyra, line, config);
        } catch (err) {
          reject(err);
        }
      }

      setTimeout(insertBatch, 0);
    }

    setTimeout(insertBatch, 0);
  });
}

/**
 * Removes a document from a database.
 * @param lyra The database to remove the document from.
 * @param docID The id of the document to remove.
 * @example
 * const isDeleted = remove(db, 'L1tpqQxc0c2djrSN2a6TJ');
 */
export function remove<S extends PropertiesSchema>(lyra: Lyra<S>, docID: string): boolean {
  if (!lyra.tokenizer) {
    lyra.tokenizer = defaultTokenizerConfig(lyra.defaultLanguage);
  }

  if (!(docID in lyra.docs)) {
    throw new Error(ERRORS.DOC_ID_DOES_NOT_EXISTS(docID));
  }

  const document = lyra.docs[docID];

  for (const key in document) {
    const propertyType = lyra.schema[key];

    if (propertyType === "string") {
      const idx = lyra.index[key];
      const tokens = lyra.tokenizer.tokenizerFn!(
        document[key] as string,
        lyra.defaultLanguage,
        false,
        lyra.tokenizer!,
      )!;

      for (const token of tokens) {
        if (token && removeDocumentByWord(lyra.nodes, idx, token, docID)) {
          throw new Error(ERRORS.CANT_DELETE_DOCUMENT(docID, key, token));
        }
      }
    }
  }

  lyra.docs[docID] = undefined;

  return true;
}

/**
 * Searches for documents in a database.
 * @param lyra The database to search.
 * @param params The search query.
 * @param language Optional parameter to override the default language analyzer.
 * @example
 * // Search for documents that contain 'Michael' in the 'author' field.
 * const result = search(db, {
 *   term: 'Michael',
 *   properties: ['author']
 * });
 */
export function search<S extends PropertiesSchema>(
  lyra: Lyra<S>,
  params: SearchParams<S>,
  language?: Language,
): SearchResult<S> {
  if (!language) {
    language = lyra.defaultLanguage;
  }

  if (!lyra.tokenizer) {
    lyra.tokenizer = defaultTokenizerConfig(language);
  }

  const tokens = lyra.tokenizer.tokenizerFn!(params.term, language, false, lyra.tokenizer);
  const indices = getIndices(lyra, params.properties);
  const uniqueDocIds = new Set<string>();
  const { limit = 10, offset = 0, exact = false } = params;
  const results: RetrievedDoc<S>[] = Array.from({
    length: limit,
  });

  const timeStart = getNanosecondsTime();

  let i = 0;
  let j = 0;

  for (const term of tokens) {
    for (const index of indices) {
      const documentIDs = getDocumentIDsFromSearch(lyra, { ...params, index, term, exact });

      for (const id of documentIDs) {
        uniqueDocIds.add(id);
      }

      if (i >= limit) {
        break;
      }

      for (const id of uniqueDocIds) {
        if (j < offset) {
          j++;
          continue;
        }

        if (i >= limit) {
          break;
        }

        if (results.findIndex(x => x?.id === id) === -1) {
          const fullDoc = lyra.docs[id]!;
          results[i] = { id, ...fullDoc };
        }
        i++;
      }
    }
  }

  const hits = results.filter(Boolean);

  return {
    elapsed: getNanosecondsTime() - timeStart,
    hits,
    count: uniqueDocIds.size,
  };
}

export function save<S extends PropertiesSchema>(lyra: Lyra<S>): Data<S> {
  return {
    index: lyra.index,
    docs: lyra.docs,
    nodes: lyra.nodes,
    schema: lyra.schema,
  };
}

export function load<S extends PropertiesSchema>(lyra: Lyra<S>, { index, docs, nodes, schema }: Data<S>) {
  if (!lyra.edge) {
    throw new Error(ERRORS.GETTER_SETTER_WORKS_ON_EDGE_ONLY("load"));
  }

  lyra.index = index;
  lyra.docs = docs;
  lyra.nodes = nodes;
  lyra.schema = schema;
}

export function defaultTokenizerConfig(language: Language, tokenizerConfig: TokenizerConfig = {}): TokenizerConfigExec {
  let defaultStopWords: string[] = [];
  let customStopWords: string[] | undefined;
  let defaultStemmingFn: Stemmer | undefined;
  let defaultTokenizerFn: Tokenizer | undefined;

  // Enable custom tokenizer function
  if (tokenizerConfig?.tokenizerFn) {
    if (typeof tokenizerConfig.tokenizerFn === "function") {
      defaultTokenizerFn = tokenizerConfig.tokenizerFn;
    } else {
      throw Error(ERRORS.INVALID_TOKENIZER_FUNCTION());
    }

    // If there's no custom tokenizer, we can proceed setting custom
    // stemming functions and stop-words.
  } else {
    defaultTokenizerFn = tokenize;

    // Enable custom stemming function
    if (tokenizerConfig?.stemmingFn) {
      if (typeof tokenizerConfig.stemmingFn === "function") {
        defaultStemmingFn = tokenizerConfig.stemmingFn;
      } else {
        throw Error(ERRORS.INVALID_STEMMER_FUNCTION_TYPE());
      }
    } else {
      if (availableStemmers.includes(language)) {
        defaultStemmingFn = stemmers[language]!;
      } else {
        defaultStemmingFn = undefined;
      }
    }

    // Enable default stop-words
    if (availableStopWords.includes(language)) {
      defaultStopWords = stopWords[language]!;
    } else {
      defaultStopWords = [];
    }

    if (tokenizerConfig?.customStopWords) {
      switch (typeof tokenizerConfig.customStopWords) {
        // Execute the custom step-words function.
        // This will pass the default step-words for a given language as a first parameter.
        case "function":
          customStopWords = tokenizerConfig.customStopWords(defaultStopWords);
          break;

        // Check if the custom step-words is an array.
        // If it's an object, throw an exception. If the array contains any non-string value, throw an exception.
        case "object":
          if (Array.isArray(tokenizerConfig.customStopWords)) {
            if ((tokenizerConfig.customStopWords as string[]).some((x: unknown) => typeof x !== "string")) {
              throw Error(ERRORS.CUSTOM_STOP_WORDS_ARRAY_MUST_BE_STRING_ARRAY());
            } else {
              customStopWords = tokenizerConfig.customStopWords as string[];
            }
          } else {
            throw Error(ERRORS.CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY());
          }
          break;

        // By default, throw an exception, as this is a misconfiguration.
        default:
          throw Error(ERRORS.CUSTOM_STOP_WORDS_MUST_BE_FUNCTION_OR_ARRAY());
      }
    }
  }

  return {
    enableStopWords: tokenizerConfig?.enableStopWords ?? true,
    enableStemming: tokenizerConfig?.enableStemming ?? true,
    stemmingFn: defaultStemmingFn,
    customStopWords: customStopWords ?? defaultStopWords,
    tokenizerFn: defaultTokenizerFn,
  };
}
