import { getDefaultComponents } from "../components/defaults.js";
import { createDocumentsStore } from "../components/documents-store.js";
import { COMPLEX_COMPONENTS, SIMPLE_COMPONENTS, SIMPLE_OR_ARRAY_COMPONENTS } from "../components/hooks.js";
import { createIndex } from "../components/index.js";
import { createError } from "../errors.js";
import { createTokenizer } from "../tokenizer/index.js";
import {
  ArrayCallbackComponents,
  Components,
  IDocumentsStore,
  IIndex,
  Lyra,
  OpaqueDocumentStore,
  OpaqueIndex,
  Schema,
  SimpleComponents,
  SimpleOrArrayCallbackComponents,
} from "../types.js";

interface CreateArguments<S extends Schema, I extends OpaqueIndex, D extends OpaqueDocumentStore> {
  schema: Schema;
  language?: string;
  components?: Components<S, I, D>;
}

function validateComponents<S extends Schema, I extends OpaqueIndex, D extends OpaqueDocumentStore>(
  components: Components<S, I, D>,
) {
  const defaultComponents = getDefaultComponents();

  for (const rawKey of SIMPLE_COMPONENTS) {
    const key = rawKey as keyof SimpleComponents;

    if (components[key]) {
      if (typeof components[key] !== "function") {
        throw createError("COMPONENT_MUST_BE_FUNCTION", key);
      }
    } else {
      // @ts-expect-error TSC is unable to resolve this
      components[key] = defaultComponents[key];
    }
  }

  for (const rawKey of SIMPLE_OR_ARRAY_COMPONENTS) {
    const key = rawKey as keyof ArrayCallbackComponents<S, I, D>;

    if (!components[key]) {
      components[key] = [];
    } else if (!Array.isArray(components[key])) {
      // @ts-expect-error TSC is unable to resolve this
      components[key] = [components[key]];
    }

    for (const fn of components[key] as unknown as SimpleOrArrayCallbackComponents<S, I, D>[]) {
      if (typeof fn !== "function") {
        throw createError("COMPONENT_MUST_BE_FUNCTION_OR_ARRAY_FUNCTIONS", key);
      }
    }
  }

  for (const rawKey of Object.keys(components)) {
    if (
      !COMPLEX_COMPONENTS.includes(rawKey) &&
      !SIMPLE_COMPONENTS.includes(rawKey) &&
      !SIMPLE_OR_ARRAY_COMPONENTS.includes(rawKey)
    ) {
      throw createError("UNSUPPORTED_COMPONENT", rawKey);
    }
  }
}

export async function create<S extends Schema, I extends OpaqueIndex, D extends OpaqueDocumentStore>({
  schema,
  language,
  components,
}: CreateArguments<S, I, D>): Promise<Lyra<S, I, D>> {
  if (!components) {
    components = {};
  }

  let tokenizer = components.tokenizer;
  let index = components.index;
  let documentsStore = components.documentsStore;

  if (!tokenizer) {
    // Use the default tokenizer
    tokenizer = await createTokenizer(language ?? "english");
  } else if (language) {
    // Accept language only if a tokenizer is not provided
    throw createError("NO_LANGUAGE_WITH_CUSTOM_TOKENIZER");
  }

  if (!index) {
    index = createIndex() as unknown as IIndex<S, I, D>;
  }

  if (!documentsStore) {
    documentsStore = createDocumentsStore() as unknown as IDocumentsStore<S, I, D>;
  }

  // Validate all other components
  validateComponents<S, I, D>(components);

  // Assign only recognized components and hooks
  const {
    getDocumentProperties,
    getDocumentIndexId,
    validateSchema,
    beforeInsert,
    afterInsert,
    beforeRemove,
    afterRemove,
    beforeMultipleInsert,
    afterMultipleInsert,
    beforeMultipleRemove,
    afterMultipleRemove,
    formatElapsedTime,
  } = components;

  const lyra = {
    data: {},
    schema,
    tokenizer,
    index,
    documentsStore,
    getDocumentProperties,
    getDocumentIndexId,
    validateSchema,
    beforeInsert,
    afterInsert,
    beforeRemove,
    afterRemove,
    beforeMultipleInsert,
    afterMultipleInsert,
    beforeMultipleRemove,
    afterMultipleRemove,
    formatElapsedTime,
  } as Lyra<S, I, D>;

  lyra.data = {
    index: await lyra.index.create(lyra, schema),
    docs: await lyra.documentsStore.create(lyra),
  };

  return lyra;
}
