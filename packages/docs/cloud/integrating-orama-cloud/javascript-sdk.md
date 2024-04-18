---
outline: deep
---

# JavaScript SDK

Orama Cloud provides an official JavaScript SDK to help you integrate your Orama indexes into your JavaScript application.

## Installation

You can install the SDK using `npm`, `yarn`, `pnpm`, `bun`, or any other package manager of your choice:

```bash copy
npm i @oramacloud/client
```

When developing using Deno, you can import the SDK using the `npm` namespace:

```typescript copy
import { OramaClient } from "npm:@oramacloud/client";
```

This SDK aims to be 100% compatible with every JavaScript environment, including Node.js, Deno, Bun, and browsers.

## Usage

The SDK provides an `OramaClient` class that you can use to interact with the Orama Cloud API.

From there, you can connect to the Orama Cloud API and start making requests:

```typescript copy
import { OramaClient } from "@oramacloud/client";

const client = new OramaClient({
  endpoint: "",
  api_key: "",
});
```

You can always find your public API key and endpoint in the Orama Dashboard. Here is an example of what it looks like:

<ZoomImg
  src='/cloud/guides/javascript-sdk/orama-api-key.png'
  alt='Orama Index Dashboard'
/>

Remember, the API key and endpoint are public, so you can safely include them in your frontend application.

## API

The SDK provides a very simple API to interact with the Orama Cloud API. Here is a list of all the methods available:

### Performing a full-text search query

The Orama Cloud SDK wraps the [open source search method](/open-source/usage/search/introduction), maintaining backward compatibility with the Open Source API.

```typescript copy
import { OramaClient } from "@oramacloud/client";

const client = new OramaClient({
  endpoint: "",
  api_key: "",
});

const results = await client.search({
  term: "red shoes",
  where: {
    price: {
      gt: 99.99,
    },
  },
});
```

## Performing full-text search

You can perform full-text search on Orama Cloud by using the Orama Client SDK. Read the full documentation [here](/cloud/performing-search/full-text-search).

## Performing vector search

You can perform vector search on Orama Cloud by using the Orama Client SDK. Read the full documentation [here](/cloud/performing-search/vector-search).
