export type LastUpdateFilterValue = '1d' | '3d' | '1w' | 'all'

const filterDays: Record<Exclude<LastUpdateFilterValue, 'all'>, number> = {
  '1d': 1,
  '3d': 3,
  '1w': 7
}

function updatedAtTime(updatedAt?: string): number {
  if (!updatedAt) {
    return 0
  }

  const time = new Date(updatedAt).getTime()
  return Number.isNaN(time) ? 0 : time
}

export function filterByLastUpdate<T extends { updatedAt?: string }>(
  items: T[],
  filter: LastUpdateFilterValue
): T[] {
  const sortedItems = [...items].sort(
    (left, right) => updatedAtTime(right.updatedAt) - updatedAtTime(left.updatedAt)
  )

  if (filter === 'all') {
    return sortedItems
  }

  const minTime = Date.now() - filterDays[filter] * 24 * 60 * 60 * 1000

  return sortedItems.filter((item) => updatedAtTime(item.updatedAt) >= minTime)
}
