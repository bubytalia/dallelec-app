import { ref } from 'vue'

const globalError = ref(null)
const isLoading = ref(false)

export function useErrorHandler() {
  const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, encodeURIComponent(error.message))
    globalError.value = {
      message: error.message,
      context,
      timestamp: new Date().toISOString()
    }
  }

  const clearError = () => {
    globalError.value = null
  }

  const setLoading = (loading) => {
    isLoading.value = loading
  }

  const withErrorHandling = async (asyncFn, context = '') => {
    try {
      setLoading(true)
      clearError()
      return await asyncFn()
    } catch (error) {
      handleError(error, context)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    globalError,
    isLoading,
    handleError,
    clearError,
    setLoading,
    withErrorHandling
  }
}