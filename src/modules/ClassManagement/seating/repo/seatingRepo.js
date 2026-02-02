export const SEATING_KEYS = {
    setup: 'bisinif_class_seating_setup_v1',
    rules: 'bisinif_class_seating_rules_v1',
    plan: 'bisinif_class_seating_plan_v2' // Upgraded to v2
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

const writeStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.warn(`[SeatingRepo] Failed to write ${key}:`, error)
        return false
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
    loadPlan: () => {
        const plan = readStorage(SEATING_KEYS.plan, null)
        if (plan && !plan.pinnedSeatIds) plan.pinnedSeatIds = [] // Safety
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
    }
}
