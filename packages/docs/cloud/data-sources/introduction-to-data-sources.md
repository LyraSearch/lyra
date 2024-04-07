# Introduction to Data Sources

One important concept to understand when working with Orama, is the concept of **data source**.

A data source, as the name suggests, refers to the original source from which data is derived. This could be a database, a web service, a JSON file, or any other platform that generates and stores data.

Orama offers built-in integrations with Shopify, Docusaurus, and Elasticpath, and continues to expand its native integrations to additional platforms.

If you're interested in integrating Orama into a project, but your data source isn't included in the list of native integrations, don't fret! You can always utilize the WebHook and REST APIs to supply Orama with your own data.

## Choosing the right data source

Connecting to a native data source is straightforward. For instance, connecting to Shopify only involves a few steps (you can find the full documentation [here](/cloud/data-sources/native-integrations/shopify)). Likewise, connecting to a custom data source is also quite simple.

Thanks to our powerful dashboard, you can easily import any JSON or CSV file and index it immediately. This feature is particularly useful when you want to test an Orama index with a database dump or a spreadsheet export.

If you want to learn more about importing JSON and CSV files, read the dedicated guide [here](https://www.notion.so/Introduction-to-data-sources-f337ecfcb7644de591e3fbdd730e7882?pvs=21).

If you need to regularly update the Orama index for production-grade workflows, or on a demand basis, we highly recommend considering the [WebHook data source](https://www.notion.so/Introduction-to-data-sources-f337ecfcb7644de591e3fbdd730e7882?pvs=21).

This is the datasource that powers big, traffic-intense websites such as https://nodejs.org, https://jsr.io, and https://docs.solidjs.com.

By utilizing this data source, you can decide when to redeploy the index or only update a segment of it.

Typically, you might set up a cron job to periodically update the index based on your needs. However, with our WebHook APIs, you also have the option to trigger updates on demand.

If you still have doubts about the right data source for you after reading this guide, join our Community Slack channel at [https://orama.to/slack](https://orama.to/slack). We'd be happy to help you and your team get started with Orama.