const PROFILE_STORAGE_KEY = 'bisinif_profile'
const PROJECT_STATE_STORAGE_KEY = 'bisinif_project_state'
const WELCOME_FLAG_KEY = 'bisinif_welcomed'

const LEGACY_KEYS = {
  profile: 'netanaliz_profile',
  project: 'netanaliz_project_state',
  welcome: 'netanaliz_welcomed'
}

// --------------------------------------------------------------------------
// MIGRATION LAYER (Idempotent)
// Eski 'netanaliz' verilerini yeni 'bisinif' anahtarlarına taşı
// --------------------------------------------------------------------------
const migrateLegacyData = () => {
  try {
    // 1. Profile Migration
    if (!localStorage.getItem(PROFILE_STORAGE_KEY)) {
      const legacyProfile = localStorage.getItem(LEGACY_KEYS.profile)
      if (legacyProfile) {
        localStorage.setItem(PROFILE_STORAGE_KEY, legacyProfile)
        console.log('[Migration] Profile data migrated to BiSınıf format.')
      }
    }

    // 2. Project State Migration
    if (!localStorage.getItem(PROJECT_STATE_STORAGE_KEY)) {
      const legacyProject = localStorage.getItem(LEGACY_KEYS.project)
      if (legacyProject) {
        localStorage.setItem(PROJECT_STATE_STORAGE_KEY, legacyProject)
        console.log('[Migration] Project state migrated to BiSınıf format.')
      }
    }

    // 3. Welcome Flag Migration
    if (localStorage.getItem(WELCOME_FLAG_KEY) !== 'true') {
      const legacyWelcome = localStorage.getItem(LEGACY_KEYS.welcome)
      if (legacyWelcome === 'true') {
        localStorage.setItem(WELCOME_FLAG_KEY, 'true')
        console.log('[Migration] Welcome flag migrated.')
      }
    }
  } catch (err) {
    console.warn('[Migration] Failed to migrate legacy data:', err)
  }
}

// Execute migration immediately on load
migrateLegacyData()

const PROFILE_VERSION = 1
const PROJECT_STATE_VERSION = 1

export const STORAGE_KEYS = {
  profile: PROFILE_STORAGE_KEY,
  project: PROJECT_STATE_STORAGE_KEY,
}

export const loadWithMeta = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return { data: null, hadError: false }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || !parsed.data) {
      localStorage.removeItem(key)
      return { data: null, hadError: true }
    }
    return { data: parsed.data, hadError: false }
  } catch (error) {
    try {
      localStorage.removeItem(key)
    } catch (removeError) {
      console.warn('localStorage silme hatası:', removeError)
    }
    return { data: null, hadError: true }
  }
}

export const loadProfileMeta = () => loadWithMeta(STORAGE_KEYS.profile)
export const loadProjectMeta = () => loadWithMeta(STORAGE_KEYS.project)

const readStorage = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch (error) {
    console.warn('localStorage okuma hatası:', error)
    return null
  }
}

const writeStorage = (key, payload) => {
  try {
    localStorage.setItem(key, JSON.stringify(payload))
    return true
  } catch (error) {
    console.warn('localStorage yazma hatası:', error)
    return false
  }
}

export const loadProfile = () => {
  const payload = readStorage(PROFILE_STORAGE_KEY)
  if (!payload || payload.version !== PROFILE_VERSION) return null
  return payload.data || null
}

export const saveProfile = (data) => {
  return writeStorage(PROFILE_STORAGE_KEY, {
    version: PROFILE_VERSION,
    savedAt: new Date().toISOString(),
    data,
  })
}

export const loadProjectState = () => {
  const payload = readStorage(PROJECT_STATE_STORAGE_KEY)
  if (!payload || payload.version !== PROJECT_STATE_VERSION) return null
  return payload.data || null
}

export const saveProjectState = (data) => {
  return writeStorage(PROJECT_STATE_STORAGE_KEY, {
    version: PROJECT_STATE_VERSION,
    savedAt: new Date().toISOString(),
    data,
  })
}

export const clearProjectState = () => {
  try {
    localStorage.removeItem(PROJECT_STATE_STORAGE_KEY)
  } catch (error) {
    console.warn('localStorage silme hatası:', error)
  }
}

export const loadWelcomeFlag = () => {
  try {
    return localStorage.getItem(WELCOME_FLAG_KEY) === 'true'
  } catch (error) {
    console.warn('localStorage okuma hatası:', error)
    return false
  }
}

export const saveWelcomeFlag = () => {
  try {
    localStorage.setItem(WELCOME_FLAG_KEY, 'true')
  } catch (error) {
    console.warn('localStorage yazma hatası:', error)
  }
}
