---
outline: deep
---

# Webhook

Webhooks provide an effective means of interacting with your Orama index.

They allow you to update, insert, and remove data from your index seamlessly. The system then queues these changes until you request a redeploy.

This guide will show you how to utilize the Webhook data source for deploying and managing an index on Orama Cloud.

## Creating an index with Webhook as a data source

Firstly, create a new index using "Webhook" as a data source. You can find it under "custom data sources."

After creating it, you will need to construct the searchable properties schema. Remember, only include the properties you plan to use for searching or filtering.

If you have questions about optimizing your Orama schema and its impact on search performance, refer to [this blog post](https://oramasearch.com/blog/optimizing-orama-schema-optimization) on schema optimization.

For this guide, we will use a very simple schema, which consists of two simple properties: `"name"` (of type `string`) and `"age"` (of type `number`).

We will also enable [automatic embeddings generation](/cloud/orama-ai/automatic-embeddings-generation), so that we can perform vector and hybrid search on this index:

<ZoomImg
  src='/cloud/guides/webhook/schema.png'
  alt='Webhook index schema'
/>

After we completed this step, we can save the configuration by clicking on "Save".

This will bring us to the following screen, where we can find some instructions on how to deploy and update an index via webhooks:

<ZoomImg
  src='/cloud/guides/webhook/instruction.png'
  alt='Webhook instructions'
/>

From here, we can choose two different ways of updating an index.

To run the following APIs, get an Orama API Key in the [developers tools section](https://cloud.oramasearch.com/developer-tools) of the dashboard.

## Inserting a snapshot

A snapshot is a complete override of a given index. It means you bulk upload a number of documents, which entirely sobstitute the live index all at once.

For example, if you want your live index to only contains the two following documents:

```json
[
  {
    "id": "1",
    "name": "John Doe",
    "age": 30,
  },
  {
    "id": "2",
    "name": "Jane Doe",
    "age": 25
  }
]
```

You can use the **snapshot** API to bulk update the live index:

:::code-group

```bash [cURL]
curl https://api.oramasearch.com/api/v1/webhooks/$INDEX_ID/snapshot \
  -H "authorization: Bearer $PRIVATE_API_KEY" ]
  -d '[ { "id": "1", "name": "John Doe", "age": 30 }, { "id": "2", "name": "Jane Doe", "age": 25 } ]'
```

```js [JavaScript]
fetch(`https://api.oramasearch.com/api/v1/webhooks/${INDEX_ID}/snapshot`, {
  method: 'POST',
  headers: {
    'authorization': `Bearer ${PRIVATE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify([
    { id: 1, name: 'John Doe', age: 30 },
    { id: 2, name: 'Jane Doe', age: 25 }
  ])
})
```

:::

## Updating, removing, inserting elements in a live index

While the **snapshot** API is convenient for replacing a live index with a new one, there may be instances where you only want to update one or more documents, or perhaps insert and delete others.

This is where the **notify** API becomes really convenient.

Let's say you want to add a new document:

```json
{
  "id": "3",
  "name": "Rick Morty",
  "age": 80
}
```

you can use the **notify** API to put that operation in queue for the next deployment:

:::code-group

```bash [cURL]
curl https://api.oramasearch.com/api/v1/webhooks/$INDEX_ID/notify \
  -H "authorization: Bearer $PRIVATE_API_KEY" \
  -d '{ "upsert": [{ "id": "3", "name": "Rick Morty", "age": 80 }] }'
```

```js [JavaScript]
fetch(`https://api.oramasearch.com/api/v1/webhooks/${INDEX_ID}/notify`, {
  method: 'POST',
  headers: {
    'authorization': `Bearer ${PRIVATE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    upsert: [{ id: '3', name: 'Rick Morty', age: 80 }]
  })
})
```

:::

as you can see, you'll need to pass an array of objects to an `upsert` operation (will do that based on the `id` field). If Orama find that document, it will update it, otherwise it will insert a new one.

You can always remove an existing document by using the `remove` operation. For example, this is how you can remove the document with id `"2"`:

:::code-group

```bash [cURL]
curl https://api.oramasearch.com/api/v1/webhooks/$INDEX_ID/notify \
  -H "authorization: Bearer $PRIVATE_API_KEY" \
  -d '{ "remove": ["2"] }'
```

```js [JavaScript]
fetch(`https://api.oramasearch.com/api/v1/webhooks/${INDEX_ID}/notify`, {
  method: 'POST',
  headers: {
    'authorization': `Bearer ${PRIVATE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    remove: ['2']
  })
})
```

:::

## Deploying the index

After you have inserted a snapshot or put a number of insert, remove, or update operations in the queue, you have to deploy a new version of the index.

You can easily do that via the deploy API:

:::code-group

```bash [cURL]
curl https://api.oramasearch.com/api/v1/webhooks/$INDEX_ID/deploy \
  -X POST \
  -H "Authorization: Bearer $PRIVATE_API_KEY"
```

```js [JavaScript]
fetch(`https://api.oramasearch.com/api/v1/webhooks/${INDEX_ID}/deploy`, {
  method: 'POST',
  headers: {
    'authorization': `Bearer ${PRIVATE_API_KEY}`,
    'Content-Type': 'application/json'
  }
})
```

:::

This will trigger a new deployment and will make the new index available worldwide in just a few minutes.