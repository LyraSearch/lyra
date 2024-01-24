---
outline: deep
---

# Plugin Secure Proxy

When running a [vector](/open-source/usage/search/vector-search.html) or [hybrid](/open-source/usage/search/hybrid-search.html) search with Orama (or any other vector database), there is a process called **inference**.

This term refers to the process of using a trained machine learning model to make predictions on new, unseen data. In the context of a vector or hybrid search, this could involve using the model to transform raw data into a vector representation that can then be used in the search process.

A very popular model is OpenAI's [`text-embedding-ada-002`](https://platform.openai.com/docs/guides/embeddings/what-are-embeddings). This model takes a string of maximum `8191` tokens, and returns a vector of `1536` elements, to be used to perform vector search.

When running vector or hybrid search on the front-end, you'll encounter a problem: the need to call the OpenAI API, which exposes your API Key to the end user. If a malicious user gets a hold of this information, they could generate their own embeddings, or even use other OpenAI API offerings - all at your expense. It's important to remember that these APIs are not inexpensive!

Because Orama is a vector database that operates client-side, we offer a secure proxy. This allows you to safely and easily call OpenAI, and soon other services, directly from a browser or any other unsecured source.

## Enabling the secure proxy

The **Orama Secure Proxy** is available with the free plan of Orama Cloud. Before you start, make sure to [create a free account](https://cloud.oramasearch.com) (no credit card required).

Navigating to [https://cloud.oramasearch.com/secure-proxy](https://cloud.oramasearch.com/secure-proxy), you will notice that you'll need to import an OpenAI API Key before you start. This is required for other services too (such as the [automatic embeddings generation](/cloud/orama-ai/automatic-embeddings-generation.html)). Orama will encrypt this information in a secure vault and will never be able to retrieve it again in plaintext.

<ZoomImg
  src='/plugins/secure-proxy/initial-screen.png'
  alt='Initial screen of Orama Secure Proxy'
/>

By going to [https://cloud.oramasearch.com/developer-tools](https://cloud.oramasearch.com/developer-tools), you'll be able to insert a new OpenAI API key. Remember, you will never be able to retrieve it again in plaintext.

<ZoomImg
  src='/plugins/secure-proxy/openai-key-popup.png'
  alt='OpenAI API Key popup'
/>

If you go back to [https://cloud.oramasearch.com/secure-proxy](https://cloud.oramasearch.com/secure-proxy), you will see that you can now enable the Orama Secure Proxy.

<ZoomImg
  src='/plugins/secure-proxy/activate.png'
  alt='Enable Orama Secure Proxy'
/>

After activating the Proxy, you will be presented with the following screen. The **Secure Proxy Public Key** is a **public** API key that you can include in any of your public-facing API requests.

For security reasons, you can regenerate it at any moment. If needed, you can always shut down the secure proxy by just switching the "disable secure proxy" switch.

<ZoomImg
  src='/plugins/secure-proxy/proxy-key.png'
  alt='Orama Secure Proxy Key'
/>

## Configuring the secure proxy

Once the Orama Secure Proxy is enabled, you can finally configure it. Configurations are real-time, and any change is propagated immediately.

<ZoomImg
  src='/plugins/secure-proxy/configuration.png'
  alt='Orama Secure Proxy Configuration'
/>

### Authorized domains

Configuring the secure proxy is pretty straightforward. First of all, you have to explicit all the domains that are authorized to perform an API call to the proxy.

For example, if you only want to authorize API calls coming from `https://oramasearch.com`, write `oramasearch.com` and press enter.

Regular expressions are supported, so that you can test the proxy on dynamic environments such as Vercel or Netlify, where URLs are automatically generated based on branch name. Use them wisely!

### User-level rate limiter

After each connection to the secure proxy, Orama will identify the user and will perform rate limiting based on the data you're expressing in the "User rate limit" field.

With the default configuration, users will be able to perform at most 10 requests every 60 seconds. After performing 10 requests, the system will block any further request.

### System-level rate limiter

The Orama Secure Proxy will perform a second type of rate limiting operation, based on the number of total requests from any number of users in a given time window.

With this configuration, you can tell the secure proxy to stop proxying to OpenAI after a given number of requests has occurred within a specific timespan.

With the default configuration, the users can perform at most 100 requests every 60 seconds.

Make sure to configure these limits accordingly to your traffic patterns!

### Encrypting chat messages and prompts

By selecting the "Encrypt chat messages" option, the Secure Proxy will provide end-to-end encryption for all your messages. This feature helps to protect your custom prompts, which are part of your intellectual property.

## Using the Secure Proxy

The Secure Proxy can be used in two ways:

1. Using the `@orama/plugin-secure-proxy` npm package (see [the official plugin documentation](/open-source/plugins/plugin-secure-proxy.html) for details). This will allow you to perform hybrid and vector search with your Orama OSS instance with very little configuration.
2. Using the `@oramacloud/client` npm package.

By utilizing the `@oramacloud/client` npm package, you can generate embeddings and interact with OpenAI's GPT browser models without exposing your OpenAI API key or prompts to your users.

### Generating embeddings

To generate text embeddings, simply import the OramaProxy class, initialize it, and call the generateEmbeddings method:

```js
import { OramaProxy } from '@oramacloud/client'

const proxy = new OramaProxy({
  api_key: '<YOUR API KEY>'
})

const embeddings = await proxy.generateEmbeddings(
  'Red leather shoes',
  'orama/gte-small' // Specify the model you want to use
)

console.log(embeddings)
// [-0.019633075, -0.00820422, -0.013555876, -0.011825735, 0.006641511, -0.012948156, ...]
```

Available models are:

- `orama/gte-small`
- `openai/text-embedding-ada-002`

More models and providers will come soon.

### Performing chat completion requests

Thanks to the Orama Secure Proxy, you can execute chat completion requests directly from your browsers.

You can accomplish this in two ways: either store the entire response in a single variable, or stream the response from OpenAI using asynchronous iterators.

**Using a single variable**:

```js
import { OramaProxy } from '@oramacloud/client' 

const proxy = new OramaProxy({
  api_key: '<YOUR API KEY>'
})

const chatParams = {
  model 'openai/gpt-4',
  messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
}

const response = await proxy.chat(chatParams)
console.log(response)

// "Michael Scott is a fictional character from the television show "The Office" (US version) ..."
```

**Using async iterators**:

```js
import { OramaProxy } from '@oramacloud/client' 

const proxy = new OramaProxy({
  api_key: 'zrqplaxa-H46c3f-D9vk8Fg_eJlomMP3'
})

const chatParams = {
  model 'openai/gpt-4',
  messages: [{ role: 'user', content: 'Who is Michael Scott?' }]
}

for await (const message of proxy.chatStream(chatParams)) {
  console.log(message)
}

// Michael
// Scott is
// a fictional
//  character from the
//  television show 
// "The
// Office" (US
// version)
// ...
```

In both cases, the available models are:

- `openai/gpt-4-1106-preview`
- `openai/gpt-4`
- `openai/gpt-3.5-turbo`
- `openai/gpt-3.5-turbo-16k`