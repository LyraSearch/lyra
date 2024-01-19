---
outline: deep
---

# Create a new index

Creating a new index is extremely simple.

If that's your first time creating an index on Orama Cloud, you will see the following screen:

<ZoomImg
  src='/cloud/guides/working-with-indexes/first-time.png'
  alt='First-time welcome screen on Orama Cloud'
/>

Here, you can select the type of index you want to create.

You have the option to import a file (either JSON or CSV), connect to an e-commerce platform (we currently support Shopify and Elasticpath, with more native integrations coming soon), or implement a custom integration by connecting your Orama Index to a REST API or WebHook.

For this guide, we will use a JSON file. You can follow along using [this](/cloud/guides/example-datasets/games.json) dataset.

Click on "Import from files", and complete the next screen as you prefer:

<ZoomImg
  src='/cloud/guides/working-with-indexes/uploading-a-file.png'
  alt='Uploading a file to Orama Cloud'
/>

Once you click on "Create index", Orama will create an empty index for you:

<ZoomImg
  src='/cloud/guides/working-with-indexes/empty-index.png'
  alt='Empty Orama index'
/>

Here you can upload a JSON file, and Orama will show you a preview of the first document found in it.

You can use this information to write the searchable properties schema:

<ZoomImg
  src='/cloud/guides/working-with-indexes/writing-the-schema.png'
  alt='Writing the searchable properties schema'
/>

Remember that you can only perform search and filter through properties that are present in the search schema.

To make Orama faster, read the [Optimizing Orama: Schema Optimization](https://oramasearch.com/blog/optimizing-orama-schema-optimization) article on our blog.

Now you only need to determine if you want to perform vector/hybrid search on your index. If so, you should enable "Automatic Embeddings Generation". Refer to [this guide](/cloud/orama-ai/automatic-embeddings-generation#automatic-embeddings-generation) to learn more about this feature.

<ZoomImg
  src='/cloud/guides/working-with-indexes/automatic-embeddings-generation.png'
  alt='Automatic embeddings generation'
/>

Once you selected the properties to generate the embeddings from, click on "Save and deploy" to release your index.

<ZoomImg
  src='/cloud/guides/working-with-indexes/deploy.png'
  alt='Deploying Orama'
/>

After the deployment process is finished, you'll be able to see an endpoint and a public API key. You can use these two parameters for performing search using the [Orama Client SDK](/cloud/integrating-orama-cloud/javascript-sdk).