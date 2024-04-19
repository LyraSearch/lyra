---
outline: deep
---

# Vue SDK

Orama Cloud provides an official Vue SDK to help you integrate your Orama indexes into your Vue application.

## Installation

You can install the SDK using `npm`, `yarn`, `pnpm`, `bun`, or any other package manager of your choice:

```bash copy
npm i @oramacloud/client
```

When developing using Deno, you can import the SDK using the `npm` namespace:

```typescript copy
import { useSearch } from "npm:@oramacloud/client/vue";
```

This SDK aims to be 100% compatible with every JavaScript environment, including Node.js, Deno, Bun, and browsers.

## Usage

This SDK exports a composable you can use to search your index by passing it any params you want for your search and also your OramaClient instance.

As a first step please create a an OramaClient instance. Let's make one in a file called `orama.js`:

```js
import { OramaClient } from "@oramacloud/client";

export const client = new OramaClient({
  endpoint: "",
  api_key: "",
});
```

After completing this step, you are ready to use the `useSearch` composable anywhere in your application to interact with the Orama Cloud API.

You can always find your public API key and endpoint in the Orama Dashboard. Here is an example of what it looks like:

<ZoomImg
  src='/cloud/guides/javascript-sdk/orama-api-key.png'
  alt='Orama Index Dashboard'
/>

Remember, the API key and endpoint are public, so you can include them in your frontend application.

## API

The SDK provides a composable to interact with the Orama Cloud API. Here is a list of all the methods available:

### Performing a full-text search query

The vue composable wraps the [open source search method](/open-source/usage/search/introduction), maintaining backward compatibility with the Open Source API.

```vue
<script setup>
import { client } from "./orama";
import { useSearch } from "@oramacloud/client/vue";

const { results } = useSearch({
  client,
  term: "guitar",
});
</script>

<template>
  <div v-for="result in results?.hits">
    <pre>{{ result }}</pre>
  </div>
</template>
```

## Performing vector search

You can perform a vector search using the `useSearch` hook by changing the mode, for example:

```vue
<script setup>
import { client } from "./orama";
import { useSearch } from "@oramacloud/client/vue";

const { results } = useSearch({
  client,
  term: "Super Mario videogame",
  mode: "vector",
  similarity: 0.8, // Minimum similarity, between 0 and 1. Default is 0.8 (80% similar).
  limit: 5, // How many results to return. Default is 10.
});
</script>

<template>
  <div v-for="result in results?.hits">
    <pre>{{ result }}</pre>
  </div>
</template>
```

You can read the full documentation on vector search using the JavaScript API [here](/cloud/performing-search/vector-search) and remember that anything you can pass to `client.search` you can also pass to `useSearch`.
