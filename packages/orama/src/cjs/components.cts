import type {
  formatElapsedTime as esmFormatElapsedTime,
  getDocumentIndexId as esmGetDocumentIndexId,
  validateSchema as esmValidateSchema,
  getDefaultComponents as esmGetDefaultComponents,
  documentsStore as esmdocumentsStore,
  index as esmIndex,
  tokenizer as esmTokenizer,
} from '../components.js'

export interface OramaComponents {
  formatElapsedTime: typeof esmFormatElapsedTime
  getDocumentIndexId: typeof esmGetDocumentIndexId
  validateSchema: typeof esmValidateSchema
  getDefaultComponents: typeof esmGetDefaultComponents
  documentsStore: typeof esmdocumentsStore
  index: typeof esmIndex
  tokenizer: typeof esmTokenizer
}

export type RequireCallback = (err: Error | undefined, components?: OramaComponents) => void

export function requireOramaComponents(callback: RequireCallback): void {
  import('../components.js')
    .then((loaded: OramaComponents) => setTimeout(() => callback(undefined, loaded), 1))
    .catch((error: Error) => setTimeout(() => callback(error), 1))
}
