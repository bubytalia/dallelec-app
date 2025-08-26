import { ref } from 'vue'

const cache = ref(new Map())

export function useCache() {
  const get = (key) => {
    const item = cache.value.get(key)
    if (item && Date.now() - item.timestamp < 300000) { // 5 minuti
      return item.data
    }
    return null
  }

  const set = (key, data) => {
    cache.value.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  return { get, set }
}