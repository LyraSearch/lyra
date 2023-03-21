export type Node<K, V> = {
  key: K
  value: V
  left: Node<K, V> | null
  right: Node<K, V> | null
  height: number
}

const BALANCE_STATE = {
  UNBALANCED_RIGHT: 1,
  SLIGHTLY_UNBALANCED_RIGHT: 2,
  BALANCED: 3,
  SLIGHTLY_UNBALANCED_LEFT: 4,
  UNBALANCED_LEFT: 5,
}

function getBalanceFactor<K, V>(node: Node<K, V>): number {
  const heightDifference = getHeight(node.left) - getHeight(node.right)

  switch (heightDifference) {
    case -2:
      return BALANCE_STATE.UNBALANCED_RIGHT
    case -1:
      return BALANCE_STATE.SLIGHTLY_UNBALANCED_RIGHT
    case 1:
      return BALANCE_STATE.SLIGHTLY_UNBALANCED_LEFT
    case 2:
      return BALANCE_STATE.UNBALANCED_LEFT
    default:
      return BALANCE_STATE.BALANCED
  }
}

function getHeight<K, V>(node: Node<K, V> | null): number {
  return node ? node.height : -1
}

function rotateLeft<K, V>(node: Node<K, V>): Node<K, V> {
  const right = node.right as Node<K, V>
  node.right = right.left
  right.left = node
  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1
  right.height = Math.max(getHeight(right.left), getHeight(right.right)) + 1
  return right
}

function rotateRight<K, V>(node: Node<K, V>): Node<K, V> {
  const left = node.left as Node<K, V>
  node.left = left.right
  left.right = node
  node.height = Math.max(getHeight(node.left), getHeight(node.right)) + 1
  left.height = Math.max(getHeight(left.left), getHeight(left.right)) + 1
  return left
}

function findMin<K, V>(node: Node<K, V>): Node<K, V> {
  return node.left ? findMin(node.left) : node
}

export function contains<K, V>(node: Node<K, V>, key: K): boolean {
  return !!find(node, key)
}

export function getSize<K, V>(node: Node<K, V> | null): number {
  if (!node) {
    return 0
  }

  return 1 + getSize(node.left) + getSize(node.right)
}

export function isBalanced<K, V>(node: Node<K, V> | null): boolean {
  if (!node) {
    return true
  }

  const heightDiff = Math.abs(getHeight(node.left) - getHeight(node.right))
  return heightDiff <= 1 && isBalanced(node.left) && isBalanced(node.right)
}

export function rangeSearch<K, V>(node: Node<K, V>, min: K, max: K): V {
  if (!node) {
    return [] as unknown as V
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const result: V[] = []

  function traverse(node: Node<K, V>) {
    if (!node) {
      return
    }

    if (node.key > min) {
      traverse(node.left as Node<K, V>)
    }

    if (node.key >= min && node.key <= max) {
      result.push(...(node.value as V[]))
    }

    if (node.key < max) {
      traverse(node.right as Node<K, V>)
    }
  }

  traverse(node)

  return result as V
}

export function greaterThan<K, V>(node: Node<K, V>, key: K, inclusive = false): V {
  if (!node) {
    return [] as unknown as V
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const result: V[] = []

  function traverse(node: Node<K, V>) {
    if (!node) {
      return
    }

    if (inclusive && node.key >= key) {
      result.push(...(node.value as V[]))
    }

    if (!inclusive && node.key > key) {
      result.push(...(node.value as V[]))
    }

    traverse(node.left as Node<K, V>)
    traverse(node.right as Node<K, V>)
  }

  traverse(node)

  return result as V
}

export function lessThan<K, V>(node: Node<K, V>, key: K, inclusive = false): V {
  if (!node) {
    return [] as unknown as V
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const result: V[] = []

  function traverse(node: Node<K, V>) {
    if (!node) {
      return
    }

    if (inclusive && node.key <= key) {
      result.push(...(node.value as V[]))
    }

    if (!inclusive && node.key < key) {
      result.push(...(node.value as V[]))
    }

    traverse(node.left as Node<K, V>)
    traverse(node.right as Node<K, V>)
  }

  traverse(node)

  return result as V
}

function getNodeByKey<K, V>(node: Node<K, V>, key: K): Node<K, V> | null {
  if (!node) {
    return null
  }

  if (node.key === key) {
    return node
  }

  if (key < node.key) {
    return node.left ? getNodeByKey(node.left, key) : null
  }

  return node.right ? getNodeByKey(node.right, key) : null
}

export function create<K, V>(key: K, value: V): Node<K, V> {
  return {
    key,
    value,
    left: null,
    right: null,
    height: 0,
  }
}

export function insert<K, V>(node: Node<K, V>, key: K, value: V): Node<K, V> {
  if (!node) {
    return create(key, value)
  }

  if (key < node.key) {
    node.left = insert(node.left as Node<K, V>, key, value)
  } else if (key > node.key) {
    node.right = insert(node.right as Node<K, V>, key, value)
  } else {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(node.value as string[]) = (node.value as string[]).concat(value as string)
    return node
  }

  const balanceFactor = getBalanceFactor(node)

  if (balanceFactor === BALANCE_STATE.UNBALANCED_LEFT) {
    if (key < (node.left as Node<K, V>).key) {
      node = rotateRight(node)
    } else {
      node.left = rotateLeft(node.left as Node<K, V>)
      node = rotateRight(node)
    }
  }

  if (balanceFactor === BALANCE_STATE.UNBALANCED_RIGHT) {
    if (key > (node.right as Node<K, V>).key) {
      node = rotateLeft(node)
    } else {
      node.right = rotateRight(node.right as Node<K, V>)
      node = rotateLeft(node)
    }
  }

  return node
}

export function find<K, V>(node: Node<K, V>, key: K): V | null {
  if (!node) {
    return null
  }

  if (node.key === key) {
    return node.value
  }

  if (key < node.key) {
    return node.left ? find(node.left, key) : null
  }

  return node.right ? find(node.right, key) : null
}

export function remove<K, V>(node: Node<K, V>, key: K): Node<K, V> | null {
  if (!node) {
    return null
  }

  if (key < node.key) {
    node.left = remove(node.left as Node<K, V>, key)
  } else if (key > node.key) {
    node.right = remove(node.right as Node<K, V>, key)
  } else {
    if (!node.left && !node.right) {
      return null
    }

    if (!node.left) {
      return node.right as Node<K, V>
    }

    if (!node.right) {
      return node.left as Node<K, V>
    }

    const temp = findMin(node.right as Node<K, V>)
    node.key = temp.key
    node.right = remove(node.right as Node<K, V>, temp.key)
  }

  const balanceFactor = getBalanceFactor(node)

  const leftNode = node.left as Node<K, V>
  const rightNode = node.right as Node<K, V>

  if (balanceFactor === BALANCE_STATE.UNBALANCED_LEFT) {
    if (
      getBalanceFactor(leftNode) === BALANCE_STATE.BALANCED ||
      getBalanceFactor(leftNode) === BALANCE_STATE.SLIGHTLY_UNBALANCED_LEFT
    ) {
      return rotateRight(node)
    }

    if (getBalanceFactor(leftNode) === BALANCE_STATE.SLIGHTLY_UNBALANCED_RIGHT) {
      node.left = rotateLeft(leftNode)
      return rotateRight(node)
    }
  }

  if (balanceFactor === BALANCE_STATE.UNBALANCED_RIGHT) {
    if (
      getBalanceFactor(rightNode) === BALANCE_STATE.BALANCED ||
      getBalanceFactor(rightNode) === BALANCE_STATE.SLIGHTLY_UNBALANCED_RIGHT
    ) {
      return rotateLeft(node)
    }

    if (getBalanceFactor(rightNode) === BALANCE_STATE.SLIGHTLY_UNBALANCED_LEFT) {
      node.right = rotateRight(rightNode)
      return rotateLeft(node)
    }
  }

  return node
}

export function removeDocument<K>(root: Node<K, string[]>, id: string, key: K): void {
  const node = getNodeByKey(root, key)!

  if (node.value.length === 1) {
    remove(root, key)
    return
  }

  node.value.splice(node.value.indexOf(id), 1)
}
