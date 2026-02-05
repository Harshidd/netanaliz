import { storageBatcher } from '../utils/performanceUtils'
import { KEY_MAP } from '../backup/backupKeys'

// Use KEY_MAP as SSOT - no hardcoded keys
export const STORAGE_KEYS = {
    profiles: KEY_MAP.PROFILES,
    conflicts: KEY_MAP.CONFLICTS,
    meta: KEY_MAP.META,
    roster: KEY_MAP.ROSTER,
    rosterMeta: KEY_MAP.ROSTER_META
}

const readStorage = (key, defaultValue) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) return defaultValue
        return JSON.parse(raw)
    } catch (error) {
        console.warn(`[ClassStorage] Failed to read ${key}:`, error)
        return defaultValue
    }
}

const writeStorage = (key, value, immediate = false) => {
    try {
        if (immediate) {
            storageBatcher.writeNow(key, value)
        } else {
            storageBatcher.scheduleWrite(key, value)
        }
        return true
    } catch (error) {
        console.warn(`[ClassStorage] Failed to write ${key}:`, error)
        return false
    }
}

export const loadProfiles = () => readStorage(STORAGE_KEYS.profiles, {})
export const saveProfiles = (profiles, immediate = false) => writeStorage(STORAGE_KEYS.profiles, profiles, immediate)

export const loadConflicts = () => readStorage(STORAGE_KEYS.conflicts, [])
export const saveConflicts = (conflicts, immediate = false) => writeStorage(STORAGE_KEYS.conflicts, conflicts, immediate)

export const loadMeta = () => readStorage(STORAGE_KEYS.meta, {})
export const saveMeta = (meta, immediate = false) => writeStorage(STORAGE_KEYS.meta, meta, immediate)

export const loadRoster = () => readStorage(STORAGE_KEYS.roster, [])
export const saveRoster = (roster, immediate = false) => writeStorage(STORAGE_KEYS.roster, roster, immediate)

export const loadRosterMeta = () => readStorage(STORAGE_KEYS.rosterMeta, {})
export const saveRosterMeta = (meta, immediate = false) => writeStorage(STORAGE_KEYS.rosterMeta, meta, immediate)
