/**
 * PERFORMANCE UTILITIES FOR CLASSMANAGEMENT MODULE
 * 
 * Dev-only performance monitoring and localStorage batching.
 */

import { CLASS_MANAGEMENT_KEYS } from '../backup/backupKeys'

const IS_DEV = import.meta.env.DEV

// ============================================
// 1. PERFORMANCE COUNTERS (DEV ONLY)
// ============================================

class PerformanceMonitor {
    constructor() {
        this.renderCounts = new Map()
        this.timers = new Map()
    }

    incrementRender(componentName) {
        if (!IS_DEV) return
        const current = this.renderCounts.get(componentName) || 0
        this.renderCounts.set(componentName, current + 1)
    }

    getRenderCount(componentName) {
        return this.renderCounts.get(componentName) || 0
    }

    startTimer(label) {
        if (!IS_DEV) return
        this.timers.set(label, performance.now())
    }

    endTimer(label) {
        if (!IS_DEV) return
        const start = this.timers.get(label)
        if (start) {
            const duration = performance.now() - start
            console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`)
            this.timers.delete(label)
        }
    }

    reset() {
        this.renderCounts.clear()
        this.timers.clear()
    }

    logReport() {
        if (!IS_DEV) return
        console.group('📊 Performance Report')
        console.log('Render Counts:')
        this.renderCounts.forEach((count, component) => {
            console.log(`  ${component}: ${count}`)
        })
        console.groupEnd()
    }
}

export const perfMonitor = new PerformanceMonitor()

// ============================================
// 2. LOCALSTORAGE BATCH WRITER
// ============================================

class LocalStorageBatcher {
    constructor() {
        this.pendingWrites = new Map()
        this.debounceTimer = null
        this.DEBOUNCE_MS = 500
        this.allowedKeys = new Set(CLASS_MANAGEMENT_KEYS)

        // Flush on page unload
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => this.flushNow())
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.flushNow()
                }
            })
        }
    }

    /**
     * Schedule a write (debounced)
     */
    scheduleWrite(key, value) {
        if (!this.allowedKeys.has(key)) {
            console.warn(`[LocalStorage] Attempted write to non-whitelisted key: ${key}`)
            return
        }

        this.pendingWrites.set(key, value)

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
        }

        this.debounceTimer = setTimeout(() => {
            this.flushNow()
        }, this.DEBOUNCE_MS)
    }

    /**
     * Write immediately (for critical operations like delete/import)
     * Retries once on failure
     */
    writeNow(key, value) {
        if (!this.allowedKeys.has(key)) {
            console.warn(`[LocalStorage] Attempted write to non-whitelisted key: ${key}`)
            return false
        }

        const attemptWrite = () => {
            try {
                const serialized = JSON.stringify(value)
                localStorage.setItem(key, serialized)
                if (IS_DEV) {
                    console.log(`[LocalStorage] Immediate write: ${key} (${(serialized.length / 1024).toFixed(2)}KB)`)
                }
                return true
            } catch (err) {
                console.error(`[LocalStorage] Write failed for ${key}:`, err)
                return false
            }
        }

        // Try once, retry on failure (setTimeout 0 = next tick)
        const success = attemptWrite()
        if (!success) {
            setTimeout(() => {
                const retrySuccess = attemptWrite()
                if (!retrySuccess && IS_DEV) {
                    console.error(`[LocalStorage] Retry also failed for ${key}`)
                }
            }, 0)
        }
        return success
    }

    /**
     * Flush all pending writes
     * Returns { success, fail } counts
     */
    flushNow() {
        if (this.pendingWrites.size === 0) return { success: 0, fail: 0 }

        if (IS_DEV) {
            perfMonitor.startTimer('localStorage-batch-write')
        }

        let successCount = 0
        let failCount = 0

        this.pendingWrites.forEach((value, key) => {
            try {
                const serialized = JSON.stringify(value)
                localStorage.setItem(key, serialized)
                successCount++
            } catch (err) {
                console.error(`[LocalStorage] Batch write failed for ${key}:`, err)
                failCount++
                // Retry once on next tick
                setTimeout(() => {
                    try {
                        localStorage.setItem(key, JSON.stringify(value))
                        if (IS_DEV) console.log(`[LocalStorage] Retry succeeded for ${key}`)
                    } catch (retryErr) {
                        if (IS_DEV) console.error(`[LocalStorage] Retry also failed for ${key}`, retryErr)
                    }
                }, 0)
            }
        })

        if (IS_DEV) {
            perfMonitor.endTimer('localStorage-batch-write')
            console.log(`[LocalStorage] Batch flush: ${successCount} success, ${failCount} failed`)
        }

        this.pendingWrites.clear()
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
            this.debounceTimer = null
        }
        return { success: successCount, fail: failCount }
    }
}

export const storageBatcher = new LocalStorageBatcher()

// ============================================
// 3. SHALLOW EQUALITY HELPER
// ============================================

/**
 * Shallow equality check for objects
 * Used to prevent unnecessary re-renders
 */
export function shallowEqual(objA, objB) {
    if (objA === objB) return true
    if (!objA || !objB) return false

    const keysA = Object.keys(objA)
    const keysB = Object.keys(objB)

    if (keysA.length !== keysB.length) return false

    for (let key of keysA) {
        if (objA[key] !== objB[key]) return false
    }

    return true
}

// ============================================
// 4. DEV-ONLY CONTRACT TEST
// ============================================

/**
 * Validate that all storage layers use keys from backupKeys.js SSOT
 * Runs once at module load in DEV mode
 */
if (IS_DEV && typeof window !== 'undefined') {
    // Delay to ensure all modules are loaded
    setTimeout(() => {
        try {
            // Import storage layers dynamically to avoid circular deps
            import('../storage/classStorage.js').then(({ STORAGE_KEYS }) => {
                const storageValues = Object.values(STORAGE_KEYS)
                const missingInBackup = storageValues.filter(key => !CLASS_MANAGEMENT_KEYS.includes(key))
                
                if (missingInBackup.length > 0) {
                    console.error(
                        '?? KEY CONTRACT BROKEN: classStorage keys not in backupKeys.js SSOT:',
                        missingInBackup
                    )
                } else {
                    console.log('? KEY CONTRACT: classStorage keys validated')
                }
            })

            import('../seating/repo/seatingRepo.js').then(({ SEATING_KEYS }) => {
                const seatingValues = Object.values(SEATING_KEYS)
                const missingInBackup = seatingValues.filter(key => !CLASS_MANAGEMENT_KEYS.includes(key))
                
                if (missingInBackup.length > 0) {
                    console.error(
                        '?? KEY CONTRACT BROKEN: seatingRepo keys not in backupKeys.js SSOT:',
                        missingInBackup
                    )
                } else {
                    console.log('? KEY CONTRACT: seatingRepo keys validated')
                }
            })
        } catch (err) {
            console.warn('[Contract Test] Failed to validate keys:', err)
        }
    }, 1000)
}
