'use strict';

/**
 * Crypto utilities for Instagram-FCA
 * Handles encryption, device ID generation, and security
 *
 * @author Gtajisan <ffjisan804@gmail.com>
 * @github https://github.com/Gtajisan
 */

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate device ID from seed
 * @param {string} seed - Seed value (usually username)
 * @returns {string} Device ID
 */
function generateDeviceId(seed) {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  return `android-${hash.substring(0, 16)}`;
}

/**
 * Generate UUID
 * @returns {string} UUID
 */
function generateUUID() {
  return uuidv4();
}

/**
 * Generate phone ID
 * @returns {string} Phone ID (UUID format)
 */
function generatePhoneId() {
  return uuidv4();
}

/**
 * Generate advertising ID
 * @returns {string} Advertising ID (UUID format)
 */
function generateAdvertisingId() {
  return uuidv4();
}

/**
 * Generate jazoest parameter
 * @param {string} phoneId - Phone ID
 * @returns {string} Jazoest value
 */
function generateJazoest(phoneId) {
  let sum = 0;
  for (let i = 0; i < phoneId.length; i++) {
    sum += phoneId.charCodeAt(i);
  }
  return `2${sum}`;
}

/**
 * Generate signed body for API requests
 * @param {Object} data - Request data
 * @returns {string} Signed body
 */
function generateSignedBody(data) {
  const jsonData = JSON.stringify(data);
  const signature = crypto
    .createHmac('sha256', 'c36436a942ea1dbb40d7f2d7d45280a620d991ce8c62fb4ce600f0a048c32c11')
    .update(jsonData)
    .digest('hex');

  return `${signature}.${jsonData}`;
}

/**
 * Encrypt password for Instagram login
 * @param {string} password - Plain password
 * @param {string} [publicKeyId] - Public key ID
 * @param {string} [publicKey] - Public key
 * @returns {string} Encrypted password
 */
function encryptPassword(password, publicKeyId, publicKey) {
  // Instagram uses RSA encryption for passwords
  // For now, use the simple format (version 0)
  const timestamp = Math.floor(Date.now() / 1000);

  if (!publicKey || !publicKeyId) {
    // Simple format without encryption
    return `#PWD_INSTAGRAM:0:${timestamp}:${password}`;
  }

  try {
    // RSA encryption (version 4)
    const key = crypto.createPublicKey({
      key: Buffer.from(publicKey, 'base64'),
      format: 'der',
      type: 'spki'
    });

    const randomKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);

    // Encrypt password with AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', randomKey, iv);
    let encryptedPassword = cipher.update(password, 'utf8');
    encryptedPassword = Buffer.concat([encryptedPassword, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Encrypt AES key with RSA
    const encryptedKey = crypto.publicEncrypt(
      { key, padding: crypto.constants.RSA_PKCS1_PADDING },
      randomKey
    );

    // Combine all parts
    const sizeBuffer = Buffer.alloc(2);
    sizeBuffer.writeInt16LE(encryptedKey.length);

    const combined = Buffer.concat([
      Buffer.from([1, parseInt(publicKeyId)]),
      iv,
      sizeBuffer,
      encryptedKey,
      authTag,
      encryptedPassword
    ]);

    return `#PWD_INSTAGRAM:4:${timestamp}:${combined.toString('base64')}`;
  } catch (error) {
    // Fallback to simple format
    return `#PWD_INSTAGRAM:0:${timestamp}:${password}`;
  }
}

/**
 * Generate random hex string
 * @param {number} length - Length of hex string
 * @returns {string} Random hex string
 */
function randomHex(length = 32) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').substring(0, length);
}

/**
 * Generate HMAC signature
 * @param {string} data - Data to sign
 * @param {string} key - Secret key
 * @returns {string} HMAC signature
 */
function hmacSign(data, key) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Generate MD5 hash
 * @param {string} data - Data to hash
 * @returns {string} MD5 hash
 */
function md5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Generate SHA256 hash
 * @param {string} data - Data to hash
 * @returns {string} SHA256 hash
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  generateDeviceId,
  generateUUID,
  generatePhoneId,
  generateAdvertisingId,
  generateJazoest,
  generateSignedBody,
  encryptPassword,
  randomHex,
  hmacSign,
  md5,
  sha256
};
