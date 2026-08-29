const QUEUE_KEY = 'soc_offline_queue'

export function getOfflineQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveOfflineReport(payload) {
  const queue = getOfflineQueue()
  queue.push({ id: crypto.randomUUID(), savedAt: new Date().toISOString(), payload })
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  return queue.length
}

export function clearOfflineItem(id) {
  const queue = getOfflineQueue().filter((item) => item.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export async function flushOfflineQueue(submitFn) {
  if (!isOnline()) return 0
  const queue = getOfflineQueue()
  if (!queue.length) return 0

  let sent = 0
  for (const item of queue) {
    try {
      await submitFn(item.payload)
      clearOfflineItem(item.id)
      sent++
    } catch {
      break
    }
  }
  return sent
}
