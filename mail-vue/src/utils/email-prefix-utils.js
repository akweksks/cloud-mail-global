const LETTERS = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const ALNUM = LETTERS + DIGITS

const FIRST_NAMES = [
  'alex', 'emma', 'liam', 'noah', 'mia', 'sofia', 'lucas', 'hana',
  'yuki', 'amir', 'arjun', 'diego', 'nora', 'omar', 'lina', 'sara',
  'ivan', 'andre', 'mei', 'kai', 'zara', 'maya', 'elena', 'anika',
  'leo', 'samir', 'aisha', 'mila', 'chen', 'min', 'luca', 'naomi'
]

const LAST_NAMES = [
  'smith', 'kim', 'garcia', 'chen', 'patel', 'brown', 'lee', 'wang',
  'martin', 'rossi', 'silva', 'nguyen', 'tanaka', 'singh', 'khan',
  'anderson', 'lopez', 'zhang', 'mori', 'costa', 'muller', 'dubois'
]

function randomInt(max) {
  if (max <= 0) return 0
  const cryptoObj = globalThis.crypto
  if (cryptoObj?.getRandomValues) {
    const values = new Uint32Array(1)
    cryptoObj.getRandomValues(values)
    return values[0] % max
  }
  return Math.floor(Math.random() * max)
}

function pick(source) {
  return source[randomInt(source.length)]
}

function randomChars(source, length) {
  return Array.from({length}, () => pick(source)).join('')
}

function shuffle(value) {
  const chars = value.split('')
  for (let index = chars.length - 1; index > 0; index--) {
    const target = randomInt(index + 1)
    ;[chars[index], chars[target]] = [chars[target], chars[index]]
  }
  return chars.join('')
}

function normalizeLength(minLength) {
  const parsed = Number(minLength)
  if (!Number.isFinite(parsed)) return 8
  return Math.max(3, Math.min(32, Math.floor(parsed)))
}

function sanitizePrefix(value) {
  return String(value || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function ensureMinLength(value, minLength) {
  const safeValue = sanitizePrefix(value)
  if (safeValue.length >= minLength) return safeValue
  return safeValue + randomChars(ALNUM, minLength - safeValue.length)
}

function generateAlnumPrefix(minLength) {
  const length = Math.max(minLength, 8) + randomInt(5)
  const value = randomChars(LETTERS, 1) + randomChars(DIGITS, 1) + randomChars(ALNUM, length - 2)
  return shuffle(value)
}

function generateNamePrefix(minLength) {
  return ensureMinLength(`${pick(FIRST_NAMES)}${pick(LAST_NAMES)}`, minLength)
}

function generateNameNumberPrefix(minLength) {
  const digitLength = 2 + randomInt(3)
  return ensureMinLength(`${pick(FIRST_NAMES)}${pick(LAST_NAMES)}${randomChars(DIGITS, digitLength)}`, minLength)
}

export function generateEmailPrefix(mode, minLength) {
  const targetLength = normalizeLength(minLength)
  const generators = {
    alnum: generateAlnumPrefix,
    name: generateNamePrefix,
    nameNumber: generateNameNumberPrefix
  }
  const generator = generators[mode] || generateAlnumPrefix
  return sanitizePrefix(generator(targetLength))
}
