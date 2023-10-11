import type { Nullable, GenericSorting } from '../types.js'
import type { InternalDocumentID } from '../components/internal-document-id-store.js'

export interface Point {
  lon: number
  lat: number
}

export interface Node {
  point: Point
  docIDs?: InternalDocumentID[]
  left?: Node
  right?: Node
  parent?: Node
}

export interface RootNode {
  root: Nullable<Node>
}

export type SortGeoPoints = Nullable<GenericSorting>

interface SearchTask {
  node: Nullable<Node>
  depth: number
}

const K = 2 // 2D points
const EARTH_RADIUS = 6371e3 // Earth radius in meters

export function create (): RootNode {
  return { root: null }
}

export function insert (tree: RootNode, point: Point, docIDs: InternalDocumentID[]): void {
  const newNode: Node = { point, docIDs }

  if (tree.root == null) {
    tree.root = newNode
    return
  }

  let node: Nullable<Node> = tree.root
  let depth = 0

  while (node !== null) {
    const axis = depth % K

    if (axis === 0) {
      if (point.lon < node.point.lon) {
        if (node.left == null) {
          node.left = newNode
          return
        }
        node = node.left
      } else {
        if (node.right == null) {
          node.right = newNode
          return
        }
        node = node.right
      }
    } else {
      if (point.lat < node.point.lat) {
        if (node.left == null) {
          node.left = newNode
          return
        }
        node = node.left
      } else {
        if (node.right == null) {
          node.right = newNode
          return
        }
        node = node.right
      }
    }

    depth++
  }
}

export function contains (tree: RootNode, point: Point): boolean {
  let node: Nullable<Node> | undefined = tree.root
  let depth = 0

  while (node) {
    if (node?.point.lon === point.lon && node.point.lat === point.lat) {
      return true
    }

    const axis = depth % K

    // Compare by longitude
    if (axis === 0) {
      if (point.lon < node!.point.lon) {
        node = node?.left
      } else {
        node = node?.right
      }
    // Compare by latitude
    } else {
      if (point.lat < node!.point.lat) {
        node = node?.left
      } else {
        node = node?.right
      }
    }

    depth++
  }

  return false
}

export function searchByRadius (
  node: Nullable<Node>,
  center: Point,
  radius: number,
  inclusive = true,
  sort: SortGeoPoints = null
): Point[] {
  const stack: Array<{ node: Nullable<Node>, depth: number }> = [{ node, depth: 0 }]
  const result: Point[] = []

  while (stack.length > 0) {
    const { node, depth } = stack.pop() as { node: Node, depth: number }
    if (node === null) continue

    const dist = haversineDistance(center, node.point)

    if (inclusive ? dist <= radius : dist > radius) {
      result.push(node.point)
    }

    if (node.left != null && blockIntersectsCircle(node.left, center, radius)) {
      stack.push({ node: node.left, depth: depth + 1 })
    }
    if (node.right != null && blockIntersectsCircle(node.right, center, radius)) {
      stack.push({ node: node.right, depth: depth + 1 })
    }
  }

  if (sort !== null) {
    result.sort((a, b) => {
      const distA = haversineDistance(center, a)
      const distB = haversineDistance(center, b)
      return sort.toLowerCase() === 'asc' ? distA - distB : distB - distA
    })
  }

  return result
}

function closestPointInBlock (node: Node, center: Point): Point {
  let closestLat, closestLon

  if (center.lat < node.point.lat) {
    closestLat = node.point.lat
  } else {
    closestLat = center.lat
  }

  if (center.lon < node.point.lon) {
    closestLon = node.point.lon
  } else {
    closestLon = center.lon
  }

  return { lat: closestLat, lon: closestLon }
}

function blockIntersectsCircle (node: Node, center: Point, radius: number): boolean {
  const closest = closestPointInBlock(node, center)
  const distance = haversineDistance(center, closest)
  return distance <= radius
}

export function searchByPolygon (root: Nullable<Node>, polygon: Point[], inclusive = true): Point[] {
  const stack: SearchTask[] = [{ node: root, depth: 0 }]
  const result: Point[] = []

  while (stack.length > 0) {
    const task = stack.pop()
    if ((task == null) || (task.node == null)) continue

    const { node, depth } = task
    const nextDepth = depth + 1

    if (node.left != null) {
      stack.push({ node: node.left, depth: nextDepth })
    }

    if (node.right != null) {
      stack.push({ node: node.right, depth: nextDepth })
    }

    const isInsidePolygon = isPointInPolygon(polygon, node.point)

    if (isInsidePolygon && inclusive) {
      result.push(node.point)
    } else if (!isInsidePolygon && !inclusive) {
      result.push(node.point)
    }
  }

  return result
}

function isPointInPolygon (polygon: Point[], point: Point): boolean {
  let isInside = false
  const x = point.lon; const y = point.lat
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lon; const yi = polygon[i].lat
    const xj = polygon[j].lon; const yj = polygon[j].lat

    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
    if (intersect) isInside = !isInside
  }

  return isInside
}

function haversineDistance (coord1, coord2): number {
  const lat1 = coord1.lat * (Math.PI / 180)
  const lat2 = coord2.lat * (Math.PI / 180)
  const deltaLat = (coord2.lat - coord1.lat) * (Math.PI / 180)
  const deltaLon = (coord2.lon - coord1.lon) * (Math.PI / 180)

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS * c
}
