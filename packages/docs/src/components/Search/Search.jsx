import { useEffect, useState } from 'react'
import { OramaClient } from '@oramacloud/client';
import { OramaSearchBox, OramaSearchButton } from '@orama/react-components'
import { ossSuggestions, cloudSuggestions } from './suggestions';
import { getCurrentCategory, getOramaUserId, searchSessionTracking, userSessionRefresh } from './utils';

const client = new OramaClient({
  api_key: 'NKiqTJnwnKsQCdxN7RyOBJgeoW5hJ594',
  endpoint: 'https://cloud.orama.run/v1/indexes/orama-docs-bzo330'
})  

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
  const [userId, setUserId] = useState(getOramaUserId());

  // TODO: Remove when fully integrated
  const [isOpen, setIsOpen] = useState(false)

  function initSearchBox() {
    try {
      setTheme(document.documentElement.dataset.theme)
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => initSearchBox(), [])

  useEffect(() => searchSessionTracking(client, userId), [userId])

  useEffect(() => {
    const intervalId = setInterval(() => userSessionRefresh(client, userId, setUserId), 5000)
    return () => clearInterval(intervalId)
  }, [userId])
    

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
  const suggestions = currentCategory === 'Open Source' ? ossSuggestions : cloudSuggestions
  
  if (!theme) return null

  return (
    <>
      <OramaSearchBox
        id="orama-ui-searchbox"
        clientInstance={client}
        onSearchboxClosed={() => {
          setIsOpen(false)
        }}
        sourcesMap={{
          description: 'content',
        }}
        resultsMap={{
          description: 'content',
        }}
        searchParams={{
          where: oramaWhere
        }}
        facetProperty={facetProperty}
        colorScheme={theme}
        open={isOpen}
        suggestions={suggestions}
        themeConfig={{
          colors: {
            dark: {
              '--background-color-primary': '#151515'
            }
          }
        }}
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
