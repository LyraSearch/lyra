import { useEffect, useState } from 'react'
import { OramaSearchBox, OramaSearchButton } from '@orama/react-components'

function useCmdK(callback) {
  const [isCmdKPressed, setIsCmdKPressed] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsCmdKPressed(true)
        if (callback && typeof callback === 'function') {
          callback()
        }
      }
    };

    const handleKeyUp = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        setIsCmdKPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [callback])

  return isCmdKPressed
}

export function Search() {
  const [theme, setTheme] = useState()
  const [currentCategory, setCurrentCategory] = useState(null)
  // TODO: Remove when fully integrated
  const [isOpen, setIsOpen] = useState(false)

  function getCurrentCategory() {
    const url = new URL(window.location.href).pathname

    if (url.startsWith('/cloud')) return 'Cloud'
    if (url.startsWith('/open-source')) return 'Open Source'

    return null
  }

  function initSearchBox() {
    try {
      setTheme(document.documentElement.dataset.theme)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    initSearchBox()
  }, [])

  useEffect(() => {
    function callback(mutationList) {
      for (const mutation of mutationList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          setTheme(document.documentElement.dataset.theme)
        }
      }
    }

    const observer = new MutationObserver(callback)
    observer.observe(document.documentElement, { attributes: true })

    const category = getCurrentCategory()
    setCurrentCategory(category)

    return () => {
      observer.disconnect()
    }
  }, [])

  useCmdK(() => {
    if (!isOpen) {
      setIsOpen(true)
    }
  })

  const oramaWhere = currentCategory
    ? {
        category: {
          eq: currentCategory
        }
      }
    : {}

  const facetProperty = ['Cloud', 'Open Source'].includes(currentCategory) ? 'section' : 'category'

  if (!theme) return null

  return (
    <>
      <OramaSearchBox
        id="orama-ui-searchbox"
        onSearchboxClosed={() => {
          setIsOpen(false)
        }}
        index={{
          api_key: 'NKiqTJnwnKsQCdxN7RyOBJgeoW5hJ594',
          endpoint: 'https://cloud.orama.run/v1/indexes/orama-docs-bzo330'
        }}
        resultsMap={{
          description: 'content'
        }}
        searchParams={{
          where: oramaWhere
        }}
        facetProperty={facetProperty}
        colorScheme={theme}
        open={isOpen}
      />

      <OramaSearchButton
        id="orama-ui-searchbox-button"
        colorScheme={theme}
        onClick={() => {
          setIsOpen(true)
        }}
      >
        Search
      </OramaSearchButton>
    </>
  )
}
