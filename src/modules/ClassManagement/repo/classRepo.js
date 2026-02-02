import { loadProjectState } from '../../../storage'
import {
    loadProfiles, saveProfiles, loadConflicts, saveConflicts,
    saveMeta, loadMeta, loadRoster, saveRoster
} from '../storage/classStorage'
import { v4 as uuidv4 } from 'uuid'
import { generateStudentId } from '../utils/studentId'

// ID Migration Helper
const migrateProfilesIfNeeded = () => {
    const meta = loadMeta()
    if (meta?.version === 1) return

    const profiles = loadProfiles()
    const newProfiles = {}

    Object.keys(profiles).forEach(key => {
        newProfiles[key] = profiles[key]
    })

    saveProfiles(newProfiles)
    saveMeta({ version: 1, migratedAt: new Date().toISOString() })
}
migrateProfilesIfNeeded()

// --- HELPER: Normalization for matching ---
const normalizeForMatch = (text) => {
    if (!text) return ''
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
}

export const classRepo = {
    // 1. Roster Management (Single Source of Truth)
    listRoster: () => {
        return loadRoster()
    },

    upsertRosterStudent: (student) => {
        const roster = loadRoster()

        // Check for duplicate: Match by SchoolNo OR Name
        const targetNo = normalizeForMatch(student.schoolNo || student.no || student.studentNumber)
        const targetName = normalizeForMatch(student.fullName || student.name || student.adSoyad)

        const existingIndex = roster.findIndex(existing => {
            const existNo = normalizeForMatch(existing.schoolNo)
            const existName = normalizeForMatch(existing.fullName)

            // Strict match on Number (if both have it)
            if (targetNo && existNo && targetNo === existNo) return true

            // Exact name match (fallback)
            if (targetName === existName) return true
            return false
        })

        const newStudent = {
            rosterId: existingIndex > -1 ? roster[existingIndex].rosterId : uuidv4(),
            fullName: student.fullName || student.name || student.adSoyad,
            schoolNo: student.schoolNo || student.no || student.studentNumber || '',
            gender: student.gender || '',
            notes: student.notes || '',
            updatedAt: new Date().toISOString()
        }

        if (existingIndex > -1) {
            roster[existingIndex] = { ...roster[existingIndex], ...newStudent } // Merge/Update
        } else {
            newStudent.createdAt = new Date().toISOString()
            roster.push(newStudent)
        }

        saveRoster(roster)
        return newStudent
    },

    upsertRosterBulk: (students) => {
        const roster = loadRoster()
        let addedCount = 0
        let updatedCount = 0

        students.forEach(student => {
            // Check for duplicate
            const targetNo = normalizeForMatch(student.schoolNo || student.no || student.studentNumber)
            const targetName = normalizeForMatch(student.fullName || student.name || student.adSoyad)

            const existingIndex = roster.findIndex(existing => {
                const existNo = normalizeForMatch(existing.schoolNo)
                const existName = normalizeForMatch(existing.fullName)

                if (targetNo && existNo && targetNo === existNo) return true
                if (targetName === existName) return true
                return false
            })

            const data = {
                fullName: student.fullName || student.name || student.adSoyad,
                schoolNo: student.schoolNo || student.no || student.studentNumber || '',
                updatedAt: new Date().toISOString()
            }

            if (existingIndex > -1) {
                roster[existingIndex] = { ...roster[existingIndex], ...data }
                updatedCount++
            } else {
                roster.push({
                    rosterId: uuidv4(),
                    createdAt: new Date().toISOString(),
                    ...data
                })
                addedCount++
            }
        })

        saveRoster(roster)
        return { added: addedCount, updated: updatedCount }
    },

    removeRosterStudent: (rosterId) => {
        const roster = loadRoster()
        const filtered = roster.filter(s => s.rosterId !== rosterId)
        saveRoster(filtered)
    },

    // 2. Get Students (View Layer)
    // Merges Roster with Profiles.
    // Legacy support: If roster is empty, tries to pull from ProjectState to populate Roster (One-time migration logic could go here)
    getStudents: () => {
        let roster = loadRoster()

        // Fallback: If roster is empty, try to import from active Exam Analysis (legacy compatibility)
        if (roster.length === 0) {
            const projectState = loadProjectState()
            const examStudents = projectState?.students || []
            if (examStudents.length > 0) {
                console.log('[ClassRepo] Auto-migrating Exam students to Roster...')
                classRepo.upsertRosterBulk(examStudents)
                roster = loadRoster() // Reload updated roster
            }
        }

        const profiles = loadProfiles()

        return roster.map(s => {
            // Compatibility: The system uses generated IDs for profiles.
            // We should eventually switch to rosterId.
            // For now, let's generate the ID using the same logic as before so profiles match names/numbers.
            // Ideally, profiles should key by 'rosterId'. But to keep 'future-proof' with minimal refactor of previous step:
            // Let's key by rosterId if we can, but previous step keyed by generateStudentId().
            // Migration: The previous step used number-name hash. 
            // Let's stick to generateStudentId(s) for the 'id' field exposed to UI to maintain compatibility with profiles created in previous step.

            // However, we should start using rosterId for new profiles.
            // Let's support both.

            // Construct an object that generateStudentId expects
            const studentObjForId = { no: s.schoolNo, name: s.fullName }
            const legacyId = generateStudentId(studentObjForId)

            // Try to find profile by rosterId (future) or legacyId (past)
            const profile = profiles[s.rosterId] || profiles[legacyId] || {}

            return {
                id: s.rosterId, // Use Roster UUID as primary ID now
                legacyId, // Keep for debug/fallback
                name: s.fullName,
                no: s.schoolNo,
                studentNumber: s.schoolNo,
                _profile: {
                    talkativeness: profile.talkativeness ?? 3,
                    attention: profile.attention ?? 3,
                    disciplineRisk: profile.disciplineRisk ?? 0,
                    specialNeeds: profile.specialNeeds ?? '',
                    notes: profile.notes ?? '',
                    updatedAt: profile.updatedAt
                }
            }
        })
    },

    // 3. Profile Management
    upsertProfile: (studentId, updates) => {
        const profiles = loadProfiles()
        const current = profiles[studentId] || {}

        profiles[studentId] = {
            ...current,
            ...updates,
            updatedAt: new Date().toISOString()
        }

        saveProfiles(profiles)
        return true
    },

    // 4. Conflict Management
    listConflicts: () => {
        return loadConflicts()
    },

    addConflict: (studentIdA, studentIdB, reason = '') => {
        if (studentIdA === studentIdB) return { success: false, error: 'Same student' }

        const conflicts = loadConflicts()

        const exists = conflicts.some(c =>
            (c.studentIdA === studentIdA && c.studentIdB === studentIdB) ||
            (c.studentIdA === studentIdB && c.studentIdB === studentIdA)
        )

        if (exists) return { success: false, error: 'Conflict already exists' }

        const newConflict = {
            id: uuidv4(),
            studentIdA,
            studentIdB,
            reason,
            createdAt: new Date().toISOString()
        }

        conflicts.push(newConflict)
        saveConflicts(conflicts)
        return { success: true, conflict: newConflict }
    },

    removeConflict: (conflictId) => {
        const conflicts = loadConflicts()
        const filtered = conflicts.filter(c => c.id !== conflictId)
        saveConflicts(filtered)
    },
}
