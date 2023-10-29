import { useState, useEffect } from 'react'
import { FaSlack } from 'react-icons/fa'
import { OramaSearch } from '@orama/plugin-nextra'
import { useTheme } from 'next-themes'
import { OramaLogo } from './components/Logo'
import { Navigation } from './components/Navigation'

const css = `
li > ul.nx-mt-6 {
  margin-top: 0;
}

li > ul.nx-mt-6 > li:first-child {
  margin-top: 0;
}
`

const useDark = () => {
  const { resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    setIsDark(resolvedTheme === 'dark')
    return () => false
  }, [resolvedTheme])
  return isDark
}

export default {
  project: {
    link: 'https://github.com/oramasearch/orama',
  },
  logo: function Logo() {
    const isDark = useDark()

    return <OramaLogo isDark={isDark} />
  },
  search: {
    component: OramaSearch,
  },
  navbar: {
    component: Navigation,
  },
  chat: {
    link: 'https://orama.to/slack',
    icon: <FaSlack style={{ width: 24, height: 24 }} />,
  },
  footer: {
    text: <p>2023 © OramaSearch Inc.</p>,
  },
  docsRepositoryBase: 'https://github.com/oramasearch/orama/tree/main/packages/docs',
  darkMode: true,
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Orama',
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Orama" />
      <meta property="og:description" content="Search, everywhere." />

      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" content="#000000"></meta>

      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  ),
}
