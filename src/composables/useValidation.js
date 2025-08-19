export function useValidation() {
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                .replace(/[<>]/g, '')
                .trim()
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateRequired = (value) => {
    return value !== null && value !== undefined && value !== ''
  }

  const validateNumber = (value) => {
    return !isNaN(value) && isFinite(value)
  }

  return {
    sanitizeInput,
    validateEmail,
    validateRequired,
    validateNumber
  }
}