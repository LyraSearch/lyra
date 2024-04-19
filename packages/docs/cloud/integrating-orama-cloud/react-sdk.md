---
outline: deep
---

# React SDK

Orama Cloud provides an official React SDK to help you integrate your Orama indexes into your React application.

## Installation

You can install the SDK using `npm`, `yarn`, `pnpm`, `bun`, or any other package manager of your choice:

```bash copy
npm i @oramacloud/client
```

When developing using Deno, you can import the SDK using the `npm` namespace:

```typescript copy
import { OramaCloud } from "npm:@oramacloud/client/react";
```

This SDK aims to be 100% compatible with every JavaScript environment, including Node.js, Deno, Bun, and browsers.

## Usage

This SDK exports two main functions, a Provider component and a hook you can use to search your index.

As a first step please add the Provider component at the top of your React tree:

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { OramaCloud } from "@oramacloud/client/react";

ReactDOM.createRoot(document.getElementById("root")).render(
  <OramaCloud endpoint="<your-endpoint>" apiKey="<your-apikey>">
    <App />
  </OramaCloud>
);
```

After completing this step, you can use the `useSearch` hook anywhere in your application to interact with the Orama Cloud API.

You can always find your public API key and endpoint in the Orama Dashboard. Here is an example of what it looks like:

<ZoomImg
  src='/cloud/guides/javascript-sdk/orama-api-key.png'
  alt='Orama Index Dashboard'
/>

Remember, the API key and endpoint are public, so you can safely include them in your frontend application.

## API

The SDK provides a hook to interact with the Orama Cloud API. Here is a list of all the methods available:

### Performing a full-text search query

The react hooks wraps the [open source search method](/open-source/usage/search/introduction), maintaining backward compatibility with the Open Source API.

```tsx copy
import { useSearch } from "@oramacloud/client/react";

function Search() {
  const { results, error } = useSearch({
    term: "red leather shoes",
    limit: 5,
  });

  return (
    <>
      {results.hits.map((hit) => (
        <div key={hit.id}>
          <pre> {JSON.stringify(hit.document, null, 2)} </pre>
        </div>
      ))}
    </>
  );
}
```

## Performing vector search

You can perform a vector search using the `useSearch` hook by changing the mode, for example:

```tsx copy
import { useSearch } from "@oramacloud/client/react";

function Search() {
  const { results, error } = useSearch({
    term: "Super Mario videogame",
    mode: "vector",
    similarity: 0.8, // Minimum similarity, between 0 and 1. Default is 0.8 (80% similar).
    limit: 5, // How many results to return. Default is 10.
  });

  return (
    <>
      {results.hits.map((hit) => (
        <div key={hit.id}>
          <pre> {JSON.stringify(hit.document, null, 2)} </pre>
        </div>
      ))}
    </>
  );
}
```

You can read the full documentation on vector search using the JavaScript API [here](/cloud/performing-search/vector-search) and remember that anything you can pass to `client.search` you can also pass to `useSearch`.
