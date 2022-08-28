![Lyra](./misc/lyra-logo.png)

[![Tests](https://github.com/nearform/lyra/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/nearform/lyra/actions/workflows/tests.yml)

Try the [live demo](https://docs.lyrajs.io/demo)

# Installation

You can install Lyra using `npm`, `yarn`, `pnpm`:

```sh
npm i @lyrasearch/lyra
```

```sh
yarn add @lyrasearch/lyra
```

```sh
pnpm add @lyrasearch/lyra
```

# Usage

Lyra is quite simple to use. The first thing to do is to create a new database
instance and set an indexing schema:

```js
import { create, insert, remove, search } from "@lyrasearch/lyra";

const db = create({
  schema: {
    author: "string",
    quote: "string",
  },
});
```

Lyra will only index string properties, but will allow you to set and store
additional data if needed.

Once the db instance is created, you can start adding some documents:

```js
insert(db, {
  quote:
    "It is during our darkest moments that we must focus to see the light.",
  author: "Aristotle",
});

insert(db, {
  quote:
    "If you really look closely, most overnight successes took a long time.",
  author: "Steve Jobs",
});

insert(db, {
  quote:
    "If you are not willing to risk the usual, you will have to settle for the ordinary.",
  author: "Jim Rohn",
});

insert(db, {
  quote: "You miss 100% of the shots you don't take",
  author: "Wayne Gretzky - Michael Scott",
});
```

Please note that the `insert` function is synchronous. If you have a large
number of documents, we highly recommend using the `insertBatch` function
instead, which prevents the event loop from blocking. This operation is
asynchronous and returns a promise:

```js
await insertBatch(db, [
  {
    quote:
      "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
  },
  {
    quote:
      "If you really look closely, most overnight successes took a long time.",
    author: "Steve Jobs",
  },
  {
    quote:
      "If you are not willing to risk the usual, you will have to settle for the ordinary.",
    author: "Jim Rohn",
  },
  {
    quote: "You miss 100% of the shots you don't take",
    author: "Wayne Gretzky - Michael Scott",
  },
]);
```

After the data has been inserted, you can finally start to query the database.

```js
const searchResult = search(db, {
  term: "if",
  properties: "*",
});
```

In the case above, you will be searching for all the documents containing the
word `if`, looking up in every schema property (AKA index):

```js
{
  elapsed: 99, // elapsed time is in microseconds
  hits: [
    {
      id: 'ckAOPGTA5qLXx0MgNr1Zy',
      quote: 'If you really look closely, most overnight successes took a long time.',
      author: 'Steve Jobs'
    },
    {
      id: 'fyl-_1veP78IO-wszP86Z',
      quote: 'If you are not willing to risk the usual, you will have to settle for the ordinary.',
      author: 'Jim Rohn'
    }
  ],
  count: 2
}
```

You can also restrict the lookup to a specific property:

```js
const searchResult = search(db, {
  term: "Michael",
  properties: ["author"],
});
```

Result:

```js
{
  elapsed: 111,
  hits: [
    {
      id: 'L1tpqQxc0c2djrSN2a6TJ',
      quote: "You miss 100% of the shots you don't take",
      author: 'Wayne Gretzky - Michael Scott'
    }
  ],
  count: 1
}
```

If needed, you can also delete a given document by using the `remove` method:

```js
remove(db, "L1tpqQxc0c2djrSN2a6TJ");
```

## Hooks

When dealing with asynchronous operations, hooks are an excelent mechanism to
intercept and perform operations during the workflow.
Lyra supports hooks natively. The `create` function allows you to specific a
sequence of hooks.

```js
import { create } from "@lyrasearch/lyra";

const db = create({
  schema: {},
  hooks: {
    // HERE
  },
});
```

**Important**: The hooks run in the same context as the main function execution.
It means, that if your hook takes X milliseconds to resolve, the Lyra function
will take X + Y (where Y = Lyra operation).

### afterInsert hook

The `afterInsert` hook is called after the insertion of a document into the
database. The `hook` will be called with the `id` of the inserted document.

Example:

```
import { create, insertWithHooks } from "@lyrasearch/lyra";

async function hook1 (id: string): Promise<void> {
  // called before hook2
}

function hook2 (id: string): void {
  // ...
}

const db = create({
  schema: {
    author: "string",
    quote: "string",
  },
  hooks: {
    afterInsert: [hook1, hook2],
  },
});

await insertWithHooks(db, { author: "test", quote: "test" })
```

# License

Lyra is licensed under the [Apache 2.0](/LICENSE.md) license.
