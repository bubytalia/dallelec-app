// Utility per crittografia lato client di dati sensibili
export class EncryptionService {
  static async generateKey() {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptData(data, key) {
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(JSON.stringify(data))
    )

    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    }
  }

  static async decryptData(encryptedData, key) {
    const decoder = new TextDecoder()
    const iv = new Uint8Array(encryptedData.iv)
    const encrypted = new Uint8Array(encryptedData.encrypted)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    return JSON.parse(decoder.decode(decrypted))
  }

  // Hash per password (non reversibile)
  static async hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hash = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hash))
  }

  // Genera token sicuro
  static generateSecureToken(length = 32) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Sanitizza dati sensibili per log
  static sanitizeForLog(data) {
    const sensitive = ['password', 'token', 'key', 'secret', 'email']
    const sanitized = { ...data }
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '***REDACTED***'
      }
    })
    
    return sanitized
  }
}