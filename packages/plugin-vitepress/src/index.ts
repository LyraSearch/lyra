import type { Plugin } from 'vite'
import type { SiteConfig } from 'vitepress'
import MarkdownIt from 'markdown-it'
import { JSDOM } from 'jsdom'
import { presets } from '@orama/searchbox'
import { AnySchema, create, insertMultiple, OramaPlugin } from '@orama/orama'
import { persist } from '@orama/plugin-data-persistence'
import { pluginPT15 } from '@orama/plugin-pt15'
import { pluginQPS } from '@orama/plugin-qps'
import { ComponentLibrary } from '@orama/vue-components'
import slugify from 'slugify'
import { readFileSync } from 'fs'

type ScoringAlgorithm = 'bm25' | 'qps' | 'pt15'

type OramaPluginOptions = {
  scoringAlgorithm?: ScoringAlgorithm
  analytics?: {
    enabled: boolean
    apiKey: string
    indexId: string
  }
}

type OramaSchema = {
  title: string
  content: string
  path: string
  category: string
  section: string
}

type ParserResult = {
  title: string
  header: string
  content: string
  path: string
}

const md = new MarkdownIt({
  html: true
})

function createOramaContentLoader(paths: string[], root: string, base: string, scoringAlgorithm: ScoringAlgorithm) {
  if (!['bm25', 'qps', 'pt15'].includes(scoringAlgorithm)) {
    throw new Error('Invalid scoring algorithm. Expected one of: bm25, qps, pt15. Got: ' + scoringAlgorithm)
  }

  const plugins: OramaPlugin[] = []

  if (scoringAlgorithm === 'pt15') {
    plugins.push(pluginPT15())
  }
  
  if (scoringAlgorithm === 'qps') {
    plugins.push(pluginQPS())
  }

  const contents = paths
    .map((file) => ({
      path: file.replace(root, '').replace('.md', ''),
      html: md.render(readFileSync(file, 'utf-8'), '')
    }))
    .map(parseHTMLContent)
    .flatMap((data) => formatForOrama(data, base))

  const db = create({
    schema: presets.docs.schema as AnySchema,
    plugins,
  })

  insertMultiple(db, contents)

  return persist(db, 'json', 'browser')
}

function parseHTMLContent({ html, path }: { html: string; path: string }): Array<ParserResult> {
  const dom = new JSDOM(html)
  const document = dom.window.document

  const sections: Array<ParserResult> = []

  const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  headers.forEach((header) => {
    const sectionTitle = header.textContent!.trim()
    const headerTag = header.tagName.toLowerCase()
    let sectionContent = ''

    let sibling = header.nextElementSibling
    while (sibling && !['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(sibling.tagName)) {
      sectionContent += sibling.textContent!.trim() + '\n'
      sibling = sibling.nextElementSibling
    }

    sections.push({
      title: sectionTitle,
      header: headerTag,
      content: sectionContent,
      path
    })
  })

  return sections
}

function formatForOrama(data: Array<ParserResult>, base: string): Array<OramaSchema> {
  try {
    const firstH1Header = data.find((section) => section.header === 'h1')

    return data.map((res) => ({
      title: res.title,
      content: res.content,
      section: (firstH1Header?.title || '').replace(/\s$/, ''),
      path: base + res?.path + '#' + slugify.default(res.title, { lower: true }),
      category: ''
    }))
  } catch (error) {
    console.error(error)
    return []
  }
}

function removeTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function OramaPlugin(pluginOptions: OramaPluginOptions = { scoringAlgorithm: 'pt15' }): Plugin {
  let resolveConfig: any
  const virtualModuleId = 'virtual:search-data'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'oramasearch',
    enforce: 'pre',

    configResolved(config: any) {
      if (resolveConfig) {
        return
      }
      resolveConfig = config

      const vitepressConfig: SiteConfig = config.vitepress
      if (!vitepressConfig) {
        return
      }

      const selfBuildEnd = vitepressConfig.buildEnd

      vitepressConfig.buildEnd = (siteConfig: any) => {
        selfBuildEnd?.(siteConfig)
        siteConfig = Object.assign(siteConfig || {})
        pluginSiteConfig?.buildEnd?.(siteConfig)
      }

      const selfTransformHead = vitepressConfig.transformHead

      vitepressConfig.transformHead = async (ctx) => {
        const selfHead = (await Promise.resolve(selfTransformHead?.(ctx))) || []
        const pluginHead = (await Promise.resolve(pluginSiteConfig?.transformHead?.(ctx))) || []
        return selfHead.concat(pluginHead)
      }
    },
   
    config: () => ({
      resolve: {
        alias: {
          './VPNavBarSearch.vue': new URL('./Search.vue', import.meta.url).pathname
        }
      }
    }),

    async resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },

    async load(this, id) {
      if (id !== resolvedVirtualModuleId) return

      const root = resolveConfig.vitepress.srcDir || resolveConfig.vitepress.root
      const base = removeTrailingSlash(resolveConfig.vitepress.userConfig?.base ?? '')
      const pages = resolveConfig.vitepress.pages.map((page: string) => `${root}/${page}`)

      return `
        const data = ${JSON.stringify(await createOramaContentLoader(pages, root, base, pluginOptions.scoringAlgorithm!))};
        const analytics = ${JSON.stringify(pluginOptions.analytics)};
        const scoringAlgorithm = '${pluginOptions.scoringAlgorithm}';
        export default { data, analytics };
      `
    }
  }
}

const pluginSiteConfig: Partial<SiteConfig> = {
  buildEnd() {},
  transformHead() {
    return []
  }
}
