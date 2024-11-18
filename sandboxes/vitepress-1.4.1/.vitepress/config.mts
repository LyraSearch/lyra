import { defineConfig } from 'vitepress'
import { OramaPlugin } from '@orama/plugin-vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Vitepress Sandbox",
  description: "A VitePress Site",
  extends: {
    vite: {
      plugins: [OramaPlugin()]
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
