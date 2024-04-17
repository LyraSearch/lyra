# Custom Search Priority

Custom search priority is a merchandising feature that lets you control which search results should be boosted or penalized during a search. This can be especially useful for e-commerce sites. For instance, when a user searches for "t-shirt", you might want to prioritize a new item over an older one.

Orama enables you to arbitrarily penalize or boost specific items to provide custom sorting rules during search via a feature called **Custom Search Priority**.

## How does this work

Sorting elements efficiently can be challenging. When conducting a search, Orama sorts your results by score, using an optimized sorting algorithm. This algorithm considers the TF-IDF and BM25 scores for each search result.

The **Custom Search Property** feature allows you to hook into this process, by assigning what we call an _**Orama Multiplier Coefficient**_ to all the documents that should be either boosted or penalized.

Let's take the following documents as an example:

```json
[
  {
    "name": "2024 Red Jacket",
    "description": "The new 2024 red jacket from our beautiful brand.",
    "price": 74.99
  },
  {
    "name": "2023 Red Jacket",
    "description": "The old 2023 red jacket from our beautiful brand.",
    "price": 74.99
  }
]
```

Imagine needing to implement a search function for an e-commerce site, where you want to prioritize the product "2024 Red Jacket" when a user searches for "red jacket." Since it's part of the new collection, it would be logical to display it among the initial search results, wouldn't it?

To do that, you will need to set a new _omc property in your documents, as follows:

```json
[
  {
    "name": "2024 Red Jacket",
    "description": "The new 2024 red jacket from our beautiful brand.",
    "price": 74.99,
    "_omc": 2 // [!code ++]
  },
  {
    "name": "2023 Red Jacket",
    "description": "The old 2023 red jacket from our beautiful brand.",
    "price": 74.99,
    "_omc": 0.5 // [!code ++]
  }
]
```

In this specific case, we're adding `2` as an `omc` (Orama Multiplier Coefficient) to the first document, and `0.5` to the second document.

Orama will utilize these numbers during the sorting process. So, when it's time to sort the final results list, the score will be multiplied by the `omc` set in the document.

For example, when a user searches for "red jacket", and these two documents each have a score of `4.9`, the first document's score will be multiplied by `2`, yielding a total score of `9.8`. The second document's score, however, will be multiplied by `0.5`, resulting in a final score of `2.45`.

::: warning
Please note that `_omc` is a reserved property in the Orama schema, and you don't need to manually define it. \
If Orama finds it inside your document, it will use it for scoring your document at sort-time. \
If `_omc` is not found, no multiplier coefficent will be used for that document.
:::

## Production usage examples

We just explored how the new Orama feature can be utilized to penalize or boost individual documents in e-commerce settings, but its potential applications extend far beyond that.

For instance, on a documentation website, you could assign a low `omc` value to documents referencing older versions. This ensures that more updated versions appear first during a search.

An intriguing example is the **JSR** (**JavaScript Registry**), a fresh alternative to the **NPM** JavaScript package registry. It's powered by both **Deno** and **Orama**!

<ZoomImg
  src='/cloud/guides/custom-search-priority/deno-jsr-orama.png'
  alt='An example package on JSR with a 100% quality score'
/>

Each package has a score that signifies its overall quality, determined by various factors such as documentation and runtime compatibility.

**JSR** utilizes the **Custom Search Priority** feature to order matching documents by their scores, thereby enabling users to see the highest quality results first.
