export const STORAGE_KEYS = {
    profiles: 'bisinif_class_profiles_v1',
    conflicts: 'bisinif_class_conflicts_v1',
    meta: 'bisinif_class_meta_v1',
    roster: 'bisinif_class_roster_v1',
    rosterMeta: 'bisinif_class_roster_meta_v1'
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

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.warn(`[ClassStorage] Failed to write ${key}:`, error)
        return false
    }
}

export const loadProfiles = () => readStorage(STORAGE_KEYS.profiles, {})
export const saveProfiles = (profiles) => writeStorage(STORAGE_KEYS.profiles, profiles)

export const loadConflicts = () => readStorage(STORAGE_KEYS.conflicts, [])
export const saveConflicts = (conflicts) => writeStorage(STORAGE_KEYS.conflicts, conflicts)

export const loadMeta = () => readStorage(STORAGE_KEYS.meta, {})
export const saveMeta = (meta) => writeStorage(STORAGE_KEYS.meta, meta)

export const loadRoster = () => readStorage(STORAGE_KEYS.roster, [])
export const saveRoster = (roster) => writeStorage(STORAGE_KEYS.roster, roster)

export const loadRosterMeta = () => readStorage(STORAGE_KEYS.rosterMeta, {})
export const saveRosterMeta = (meta) => writeStorage(STORAGE_KEYS.rosterMeta, meta)

