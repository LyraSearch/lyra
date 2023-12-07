---
outline: deep
---

# Performing full-text search on Orama Cloud

After deploying your index, Orama will distribute it to over 300 global points of presence across more than 100 countries worldwide. This will guarantee the lowest possible latency for any search query, at any scale.

At the time of this writing, you can execute search queries using our official JavaScript SDK.

This SDK manages connection, cache, telemetry, and type-safety for all your search operations. It is the official method for communicating with Orama Cloud.

::: tip Installing the Orama SDK
You can find the guide on installing the SDK [here](/cloud/integrating-orama-cloud/javascript-sdk).
:::

Make sure you have the Orama SDK installed to start performing full-text search at the edge!

## Full-text search with Orama Cloud

Once you have your SDK installed, you can use it in every JavaScript runtime (browser, server, mobile apps, etc.).

The client exposes a simple `search` method that can be used to query the index:

```typescript copy
import { OramaClient } from '@oramacloud/client'

const client = new OramaClient({
  endpoint: '',
  api_key: ''
})

const results = await client.search({
  term: 'red shoes',
  where: {
    price: {
      gt: 99.99
    }
  }
})
```

The `search` method exposes the same interface you're used to implement with OSS Orama. That means that you can perform full-text query, group, sort, filter, run preflight requests, adjust the threshold, run pagination, etc.
