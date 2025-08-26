// Cache regex per performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const HTML_REGEX = /[<>]/g

export function useValidation() {
  const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input
    return input.replace(SCRIPT_REGEX, '')
                .replace(HTML_REGEX, '')
                .trim()
  }

  const validateEmail = (email) => {
    if (typeof email !== 'string') return false
    return EMAIL_REGEX.test(email)
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