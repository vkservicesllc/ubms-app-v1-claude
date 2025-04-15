import dotenv from 'dotenv'
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto'

dotenv.config({ path: '../../../.env' })


const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex')


export function encrypt(text) {
    const iv = randomBytes(12) // 12-byte IV for AES-GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv)

    const encryptedText = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const authTag = cipher.getAuthTag()

    // Combine IV, ciphertext, and auth tag into one string (base64 encoding)
    return Buffer.concat([iv, encryptedText, authTag]).toString('base64')
}


export function decrypt(encryptedString) {
    const encryptedBuffer = Buffer.from(encryptedString, 'base64')

    // Split the buffer back into IV, ciphertext, and auth tag
    const iv = encryptedBuffer.slice(0, 12) // 12 bytes for IV
    const authTag = encryptedBuffer.slice(-16) // 16 bytes for the auth tag
    const ciphertext = encryptedBuffer.slice(12, -16) // Rest is ciphertext

    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    const decryptedText = Buffer.concat([decipher.update(ciphertext), decipher.final()])

    return decryptedText.toString('utf8')
}