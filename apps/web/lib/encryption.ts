import crypto from 'crypto';


const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;


if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}

// Validate it's a string (TypeScript guard)
if (typeof ENCRYPTION_KEY !== 'string') {
  throw new Error('ENCRYPTION_KEY must be a string');
}

// Convert hex string to buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex');

if (keyBuffer.length !== 32) {
  throw new Error('ENCRYPTION_KEY must be a 32-byte (64 character) hex string');
}

/**
 * Encrypts a password using AES-256-GCM
 * @param password Plain text password
 * @returns Encrypted password with IV and auth tag (format: iv:authTag:encrypted)
 */
export function encryptPassword(password: string): string {
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  // Encrypt the password
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a password encrypted with encryptPassword
 * @param encryptedPassword Encrypted password string (format: iv:authTag:encrypted)
 * @returns Plain text password
 */
export function decryptPassword(encryptedPassword: string): string {
  try {
    // Split the encrypted string
    const parts = encryptedPassword.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted password format');
    }
    const iv = Buffer.from(parts[0]!, 'hex');
    const authTag = Buffer.from(parts[1]!, 'hex');
    const encrypted = parts[2]!;

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting password:', error);
    throw new Error('Failed to decrypt password');
  }
}
