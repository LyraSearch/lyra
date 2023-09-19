import { syncBoundedLevenshtein } from '../components/levenshtein.js'
import { InternalDocumentID } from '../components/internal-document-id-store.js'
import { getOwnProperty } from '../utils.js'

export class Node {
  constructor(key: string, subWord: string, end: boolean) {
    this.k = key
    this.s = subWord
    this.e = end
  }

  // Node key
  public k: string
  // Node subword
  public s: string
  // Node children
  public c: Record<string, Node> = {}
  // Node documents
  public d: InternalDocumentID[] = []
  // Node end
  public e: boolean
  // Node word
  public w = ''

  public toJSON(): object {
    return {
      w: this.w,
      s: this.s,
      c: this.c,
      d: this.d,
      e: this.e,
    }
  }
}

type FindParams = {
  term: string
  exact?: boolean
  tolerance?: number
}

type FindResult = Record<string, InternalDocumentID[]>

function updateParent(node: Node, parent: Node): void {
  node.w = parent.w + node.s
}

function addDocument(node: Node, docID: InternalDocumentID): void {
  node.d.push(docID)
}

function removeDocument(node: Node, docID: InternalDocumentID): boolean {
  const index = node.d.indexOf(docID)

  /* c8 ignore next 3 */
  if (index === -1) {
    return false
  }

  node.d.splice(index, 1)

  return true
}

function findAllWords(node: Node, output: FindResult, term: string, exact?: boolean, tolerance?: number) {
  if (node.e) {
    const { w, d: docIDs } = node

    if (exact && w !== term) {
      return {}
    }

    // always check in own property to prevent access to inherited properties
    // fix https://github.com/OramaSearch/orama/issues/137
    if (!getOwnProperty(output, w)) {
      if (tolerance) {
        // computing the absolute difference of letters between the term and the word
        const difference = Math.abs(term.length - w.length)

        // if the tolerance is set, check whether the edit distance is within tolerance.
        // In that case, we don't need to add the word to the output
        if (difference <= tolerance && syncBoundedLevenshtein(term, w, tolerance).isBounded) {
          output[w] = []
        }
      } else {
        // prevent default tolerance not set
        output[w] = []
      }
    }

    // check if _output[w] exists and then add the doc to it
    // always check in own property to prevent access to inherited properties
    // fix https://github.com/OramaSearch/orama/issues/137
    if (getOwnProperty(output, w) && docIDs.length) {
      const docs = new Set(output[w])

      const docIDsLength = docIDs.length
      for (let i = 0; i < docIDsLength; i++) {
        docs.add(docIDs[i])
      }
      output[w] = Array.from(docs)
    }
  }

  // recursively search the children
  for (const character of Object.keys(node.c)) {
    findAllWords(node.c[character], output, term, exact, tolerance)
  }
  return output
}

function getCommonPrefix(a: string, b: string) {
  let commonPrefix = ''
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) {
      return commonPrefix
    }
    commonPrefix += a[i]
  }
  return commonPrefix
}

export function create(end = false, subWord = '', key = ''): Node {
  return new Node(key, subWord, end)
}

export function insert(root: Node, word: string, docId: InternalDocumentID) {
  for (let i = 0; i < word.length; i++) {
    const currentCharacter = word[i]
    const wordAtIndex = word.substring(i)
    const rootChildCurrentChar = root.c[currentCharacter]

    if (rootChildCurrentChar) {
      const edgeLabel = rootChildCurrentChar.s
      const edgeLabelLength = edgeLabel.length

      const commonPrefix = getCommonPrefix(edgeLabel, wordAtIndex)
      const commonPrefixLength = commonPrefix.length

      // the wordAtIndex matches exactly with an existing child node
      if (edgeLabel === wordAtIndex) {
        addDocument(rootChildCurrentChar, docId)
        rootChildCurrentChar.e = true
        return
      }

      const edgeLabelAtCommonPrefix = edgeLabel[commonPrefixLength]
      // the wordAtIndex is completely contained in the child node subword
      if (commonPrefixLength < edgeLabelLength && commonPrefixLength === wordAtIndex.length) {
        const newNode = create(true, wordAtIndex, currentCharacter) // Create a new node with end set to true
        newNode.c[edgeLabelAtCommonPrefix] = rootChildCurrentChar

        const newNodeChild = newNode.c[edgeLabelAtCommonPrefix]
        newNodeChild.s = edgeLabel.substring(commonPrefixLength)
        newNodeChild.k = edgeLabelAtCommonPrefix

        root.c[currentCharacter] = newNode

        updateParent(newNode, root)
        updateParent(newNodeChild, newNode)
        addDocument(newNode, docId)
        return
      }

      // the wordAtIndex is partially contained in the child node subword
      if (commonPrefixLength < edgeLabelLength && commonPrefixLength < wordAtIndex.length) {
        const inbetweenNode = create(false, commonPrefix, currentCharacter)
        inbetweenNode.c[edgeLabelAtCommonPrefix] = rootChildCurrentChar
        root.c[currentCharacter] = inbetweenNode

        const inbetweenNodeChild = inbetweenNode.c[edgeLabelAtCommonPrefix]
        inbetweenNodeChild.s = edgeLabel.substring(commonPrefixLength)
        inbetweenNodeChild.k = edgeLabelAtCommonPrefix

        const wordAtCommonPrefix = wordAtIndex[commonPrefixLength]
        const newNode = create(true, word.substring(i + commonPrefixLength), wordAtCommonPrefix)
        addDocument(newNode, docId)

        inbetweenNode.c[wordAtCommonPrefix] = newNode

        updateParent(inbetweenNode, root)
        updateParent(newNode, inbetweenNode)
        updateParent(inbetweenNodeChild, inbetweenNode)
        return
      }

      // skip to the next divergent character
      i += edgeLabelLength - 1
      // navigate in the child node
      root = rootChildCurrentChar
    } else {
      // if the node for the current character doesn't exist create new node
      const newNode = create(true, wordAtIndex, currentCharacter)
      addDocument(newNode, docId)

      root.c[currentCharacter] = newNode
      updateParent(newNode, root)
      return
    }
  }
}

export function find(root: Node, { term, exact, tolerance }: FindParams): FindResult {
  // find the closest node to the term
  for (let i = 0; i < term.length; i++) {
    const character = term[i]
    if (character in root.c) {
      const rootChildCurrentChar = root.c[character]
      const edgeLabel = rootChildCurrentChar.s
      const termSubstring = term.substring(i)

      // find the common prefix between two words ex: prime and primate = prim
      const commonPrefix = getCommonPrefix(edgeLabel, termSubstring)
      const commonPrefixLength = commonPrefix.length
      // if the common prefix length is equal to edgeLabel length (the node subword) it means they are a match
      // if the common prefix is equal to the term means it is contained in the node
      if (commonPrefixLength !== edgeLabel.length && commonPrefixLength !== termSubstring.length) {
        // if tolerance is set we take the current node as the closest
        if (tolerance) break
        return {}
      }

      // skip the subword length and check the next divergent character
      i += rootChildCurrentChar.s.length - 1
      // navigate into the child node
      root = rootChildCurrentChar
    } else {
      return {}
    }
  }

  const output: FindResult = {}
  // found the closest node we recursively search through children
  findAllWords(root, output, term, exact, tolerance)

  return output
}

export function contains(root: Node, term: string): boolean {
  for (let i = 0; i < term.length; i++) {
    const character = term[i]

    if (character in root.c) {
      const rootChildrenChar = root.c[character]
      const edgeLabel = rootChildrenChar.s
      const termSubstring = term.substring(i)
      const commonPrefix = getCommonPrefix(edgeLabel, termSubstring)
      const commonPrefixLength = commonPrefix.length

      if (commonPrefixLength !== edgeLabel.length && commonPrefixLength !== termSubstring.length) {
        return false
      }
      i += rootChildrenChar.s.length - 1
      root = rootChildrenChar
    } else {
      return false
    }
  }
  return true
}

export function removeWord(root: Node, term: string): boolean {
  if (!term) {
    return false
  }

  for (let i = 0; i < term.length; i++) {
    const character = term[i]
    const parent = root
    if (character in root.c) {
      i += root.c[character].s.length - 1
      root = root.c[character]

      if (Object.keys(root.c).length === 0) {
        delete parent.c[root.k]
        return true
      }
    } else {
      return false
    }
  }

  return false
}

export function removeDocumentByWord(root: Node, term: string, docID: InternalDocumentID, exact = true): boolean {
  if (!term) {
    return true
  }

  for (let i = 0; i < term.length; i++) {
    const character = term[i]
    if (character in root.c) {
      const rootChildCurrentChar = root.c[character]
      i += rootChildCurrentChar.s.length - 1
      root = rootChildCurrentChar

      if (exact && root.w !== term) {
        // Do nothing if the exact condition is not met.
      } else {
        removeDocument(root, docID)
      }
    } else {
      return false
    }
  }
  return true
}
