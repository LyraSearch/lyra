---
outline: deep
---

# Edit an index

After you [created an index](/cloud/working-with-indexes/create-a-new-index), you can always update it by changing its data, searchable properties, and automatic embeddings generation configuration.

You can't change the datasource of an index after you created it. If you have this need, you should create a new index instead.

In your dashboard homepage, you will see a list of all the indexes you have created:

<ZoomImg
  src='/cloud/guides/working-with-indexes/indexes-list.png'
  alt='Indexes list'
/>

If you want to edit an index, just click on it and you'll land in the following page:

<ZoomImg
  src='/cloud/guides/working-with-indexes/edit.png'
  alt='Edit index'
/>

Here you can click on the edit button on the right side. Orama will enter in edit mode and will let you make changes to your indexes; as an example, let's say we want to remove the `genres` searchable property:

<ZoomImg
  src='/cloud/guides/working-with-indexes/remove-property.png'
  alt='Remove property'
/>

Simply remove the property from the schema, click on "Save and deploy", and you're done!