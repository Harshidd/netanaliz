import { storageBatcher } from '../../utils/performanceUtils'
import { KEY_MAP } from '../../backup/backupKeys'

// Use KEY_MAP as SSOT - no hardcoded keys
export const SEATING_KEYS = {
    setup: KEY_MAP.SEATING_SETUP,
    rules: KEY_MAP.SEATING_RULES,
    plan: KEY_MAP.SEATING_PLAN,
    history: KEY_MAP.SEATING_HISTORY,
    analyticsMap: KEY_MAP.ANALYTICS_MAP,
    selectedExam: KEY_MAP.ANALYTICS_SELECTED_EXAM
}

const readStorage = (key, defaultValue) => {
    try {
        const raw = localStorage.getItem(key)
        if (!raw) {
            // Check for v1 Migration
            if (key === SEATING_KEYS.plan) {
                const v1 = localStorage.getItem('bisinif_class_seating_plan_v1')
                if (v1) {
                    console.log('[SeatingRepo] Migrating v1 plan to v2...')
                    const v1Data = JSON.parse(v1)
                    // Normalize v1 to v2
                    return {
                        ...v1Data,
                        pinnedSeatIds: v1Data.pinnedSeatIds || [], // Ensure exists
                        manualMoves: v1Data.manualMoves || 0,
                        updatedAt: new Date().toISOString()
                    }
                }
            }
            return defaultValue
        }
        return JSON.parse(raw)
    } catch (error) {
        console.warn(`[SeatingRepo] Failed to read ${key}:`, error)
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
        console.warn(`[SeatingRepo] Failed to write ${key}:`, error)
        return false
    }
}

// ============================================
// INTEGRITY GUARDS
// ============================================

/**
 * Validate snapshot schema before saving to history
 * Returns { valid: boolean, errors: string[] }
 */
const validateSnapshot = (snapshot) => {
    const errors = []
    const IS_DEV = import.meta.env.DEV

    if (!snapshot.rows || snapshot.rows <= 0) errors.push('Invalid rows')
    if (!snapshot.cols || snapshot.cols <= 0) errors.push('Invalid cols')
    if (!snapshot.layout || typeof snapshot.layout !== 'object') errors.push('Invalid layout')
    if (!snapshot.id) errors.push('Missing id')
    if (!snapshot.createdAt) errors.push('Missing createdAt')

    if (errors.length > 0 && IS_DEV) {
        console.warn('[SeatingRepo] Invalid snapshot:', errors, snapshot)
    }

    return { valid: errors.length === 0, errors }
}

/**
 * Sanitize plan by removing seats with non-existent students
 * Prevents crashes when roster changes
 */
const sanitizePlan = (plan, validStudentIds) => {
    if (!plan || !plan.assignments) return plan

    const IS_DEV = import.meta.env.DEV
    const cleanedAssignments = {}
    let removedCount = 0

    Object.entries(plan.assignments).forEach(([seatId, studentId]) => {
        if (validStudentIds.includes(studentId)) {
            cleanedAssignments[seatId] = studentId
        } else {
            removedCount++
            if (IS_DEV) {
                console.warn(`[SeatingRepo] Removing orphaned seat ${seatId} (student ${studentId} not in roster)`)
            }
        }
    })

    if (removedCount > 0 && IS_DEV) {
        console.log(`[SeatingRepo] Sanitized plan: removed ${removedCount} orphaned seats`)
    }

    return {
        ...plan,
        assignments: cleanedAssignments
    }
}

export const seatingRepo = {
    // 1. Setup (Geometry)
    loadSetup: () => readStorage(SEATING_KEYS.setup, {
        rows: 5,
        cols: 3,
        deskType: 'double', // 'single' | 'double'
        frontRows: 1
    }),
    saveSetup: (setup) => writeStorage(SEATING_KEYS.setup, setup),

    // 2. Rules (Strategy)
    loadRules: () => readStorage(SEATING_KEYS.rules, {
        scenario: 'daily', // 'exam' | 'daily' | 'group'
        hard: {
            enforceConflicts: true,
            forceSpecialNeedsFront: true
        },
        weights: {
            talkativenessWeight: 8,
            attentionWeight: 6,
            genderBalanceWeight: 4,
            disciplineWeight: 5
        }
    }),
    saveRules: (rules) => writeStorage(SEATING_KEYS.rules, rules),

    // 3. Plan (Result)
    loadPlan: (validStudentIds = []) => {
        const plan = readStorage(SEATING_KEYS.plan, null)
        if (!plan) return null

        // Safety: ensure v2 fields
        if (!plan.pinnedSeatIds) plan.pinnedSeatIds = []

        // Integrity: remove orphaned students (if roster provided)
        if (validStudentIds.length > 0) {
            return sanitizePlan(plan, validStudentIds)
        }

        return plan
    },
    savePlan: (plan) => {
        // Ensure v2 fields
        return writeStorage(SEATING_KEYS.plan, {
            ...plan,
            pinnedSeatIds: plan.pinnedSeatIds || [],
            manualMoves: plan.manualMoves || 0,
            updatedAt: new Date().toISOString()
        })
    },

    // 4. History
    loadHistory: () => {
        const history = readStorage(SEATING_KEYS.history, [])
        // Migration: Ensure titles exist
        return history.map(item => {
            if (!item.title) {
                const date = new Date(item.createdAt)
                return {
                    ...item,
                    title: `Oturma Planı – ${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}`
                }
            }
            return item
        })
    },

    pushToHistory: (plan, isAuto = false) => {
        let history = readStorage(SEATING_KEYS.history, [])
        const last = history[0]

        // Duplicate Guard
        const isDuplicate = last &&
            JSON.stringify(last.layout) === JSON.stringify(plan.assignments) &&
            JSON.stringify(last.pinnedSeatIds) === JSON.stringify(plan.pinnedSeatIds) &&
            JSON.stringify(last.setup) === JSON.stringify(plan.setup)

        if (isDuplicate) {
            const updatedLast = {
                ...last,
                updatedAt: new Date().toISOString(),
                // If it was auto and now we manually save, it might deserve promotion, but sticking to update time for now
            }
            const newHistory = [updatedLast, ...history.slice(1)]
            return writeStorage(SEATING_KEYS.history, newHistory, true) // Immediate for history
        }

        const date = new Date()
        const snapshot = {
            id: crypto.randomUUID(),
            createdAt: date.toISOString(),
            title: plan.title || `Oturma Planı – ${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}`,
            rows: plan.rows || plan.setup?.rows || 0,
            cols: plan.cols || plan.setup?.cols || 0,
            layout: plan.assignments || {},
            pinnedSeatIds: plan.pinnedSeatIds || [],
            manualMoves: plan.manualMoves || 0,
            stats: plan.stats || {},
            setup: plan.setup || null,
            isAuto: isAuto,
            isPinned: false
        }

        // Validate snapshot schema
        const validation = validateSnapshot(snapshot)
        if (!validation.valid) {
            console.error('[SeatingRepo] Dropping invalid snapshot:', validation.errors)
            return false // Don't save corrupt data
        }

        // --- RETENTION POLICY ---
        // 1. Add new item
        let newHistory = [snapshot, ...history]

        // 2. Limit "Auto" items: Keep max 10 auto items per day
        if (isAuto) {
            const todayStr = date.toISOString().slice(0, 10) // YYYY-MM-DD
            const todaysAuto = newHistory.filter(h => h.isAuto && h.createdAt.startsWith(todayStr))

            if (todaysAuto.length > 10) {
                // Remove the oldest auto item from today
                // Since list is sorted new->old, the last one in todaysAuto is the oldest
                const oldestId = todaysAuto[todaysAuto.length - 1].id
                newHistory = newHistory.filter(h => h.id !== oldestId)
            }
        }

        // 3. Global Safety Limit (50) - BUT protect pinned items
        if (newHistory.length > 50) {
            // Try to remove unpinned/auto items from the end first
            // Create a list of candidates to remove (not pinned)
            const candidates = newHistory.filter(h => !h.isPinned)
            if (candidates.length > 0) {
                // Remove oldest candidate (last one)
                const toRemove = candidates[candidates.length - 1]
                newHistory = newHistory.filter(h => h.id !== toRemove.id)
            } else {
                // If all 50 are pinned, unfortunately start dropping oldest pinned (hard limit)
                newHistory = newHistory.slice(0, 50)
            }
        }

        return writeStorage(SEATING_KEYS.history, newHistory, true) // Immediate for history
    },

    updateHistoryItemPinned: (id, isPinned) => {
        const history = readStorage(SEATING_KEYS.history, [])
        const newHistory = history.map(item => item.id === id ? { ...item, isPinned } : item)
        return writeStorage(SEATING_KEYS.history, newHistory)
    },

    deleteHistoryItem: (id) => {
        const history = readStorage(SEATING_KEYS.history, [])
        const newHistory = history.filter(item => item.id !== id)
        return writeStorage(SEATING_KEYS.history, newHistory, true) // Immediate for delete
    },

    updateHistoryItemTitle: (id, newTitle) => {
        const history = readStorage(SEATING_KEYS.history, [])
        const newHistory = history.map(item => item.id === id ? { ...item, title: newTitle } : item)
        return writeStorage(SEATING_KEYS.history, newHistory)
    },

    // 5. Analytics Mapping (Read/Write for Correction)
    loadAnalyticsMap: () => readStorage(SEATING_KEYS.analyticsMap, {}),
    saveAnalyticsMap: (map) => writeStorage(SEATING_KEYS.analyticsMap, map),

    // 6. UI Preference
    loadSelectedExamId: () => readStorage(SEATING_KEYS.selectedExam, null),
    saveSelectedExamId: (id) => writeStorage(SEATING_KEYS.selectedExam, id),

    // 7. Cascading Delete Helper
    removeStudentFromAllRecords: (studentId) => {
        if (!studentId) return

        // A. Active Plan
        const plan = seatingRepo.loadPlan()
        if (plan && plan.assignments) {
            let planDirty = false
            Object.entries(plan.assignments).forEach(([seatId, assignedStudentId]) => {
                if (assignedStudentId === studentId) {
                    delete plan.assignments[seatId]
                    planDirty = true
                    // Remove from pins if exists
                    if (plan.pinnedSeatIds && plan.pinnedSeatIds.includes(seatId)) {
                        plan.pinnedSeatIds = plan.pinnedSeatIds.filter(id => id !== seatId)
                    }
                }
            })
            if (planDirty) {
                seatingRepo.savePlan(plan)
            }
        }

        // B. History
        const history = seatingRepo.loadHistory()
        let historyDirty = false
        const cleanedHistory = history.map(h => {
            if (!h.layout) return h

            let itemDirty = false
            const newLayout = { ...h.layout }
            let newPins = h.pinnedSeatIds ? [...h.pinnedSeatIds] : []

            Object.entries(newLayout).forEach(([seatId, assignedId]) => {
                if (assignedId === studentId) {
                    delete newLayout[seatId]
                    itemDirty = true
                    // Unpin seat if it contained the deleted student
                    if (newPins.includes(seatId)) {
                        newPins = newPins.filter(id => id !== seatId)
                    }
                }
            })

            if (itemDirty) {
                historyDirty = true
                return { ...h, layout: newLayout, pinnedSeatIds: newPins, manualMoves: 0 } // Reset manual if altered? Maybe safest.
            }
            return h
        })

        if (historyDirty) {
            writeStorage(SEATING_KEYS.history, cleanedHistory, true) // Immediate for cascade delete
        }

        // C. Analytics Map (Manual pairings)
        try {
            const map = seatingRepo.loadAnalyticsMap()
            let mapDirty = false
            // Check keys (if studentId is key) and values (if studentId is value)
            Object.keys(map).forEach(key => {
                if (key === studentId || map[key] === studentId) {
                    delete map[key]
                    mapDirty = true
                }
            })
            if (mapDirty) {
                seatingRepo.saveAnalyticsMap(map)
            }
        } catch (e) { console.warn('Analytics map clean fail', e) }
    }
}
