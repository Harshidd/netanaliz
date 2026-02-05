import { classRepo } from '../../repo/classRepo'
import { seatingRepo } from '../repo/seatingRepo'

/**
 * DETERMINISTIC SEATING ALGORITHM V5 (Strict 3-Criteria)
 * 1) Front Row Priority
 * 2) Gender Balance (Balanced Sort)
 * 3) Conflict (Hard Constraint)
 */

// --- 1. DETERMINISTIC PRNG ---
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// --- 2. WEEKLY SEED ---
const getWeeklySeed = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000)
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    const weekNum = Math.floor(diff / oneWeek)
    return (now.getFullYear() * 100) + weekNum
}

// --- 3. HELPERS ---
const deterministicShuffle = (array, seed) => {
    const rng = mulberry32(seed)
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled
}

/**
 * Balanced Sort Logic
 * Takes a list of students, separates by gender, shuffles each, 
 * then zips them [G, B, G, B...] for max entropy/balance.
 */
const balancedSort = (students, seed) => {
    const boys = students.filter(s => s.gender === 'E')
    const girls = students.filter(s => s.gender === 'K')
    const others = students.filter(s => s.gender !== 'E' && s.gender !== 'K')

    const shuffledBoys = deterministicShuffle(boys, seed + 1)
    const shuffledGirls = deterministicShuffle(girls, seed + 2)
    const shuffledOthers = deterministicShuffle(others, seed + 3)

    const result = []
    const maxLen = Math.max(shuffledBoys.length, shuffledGirls.length)

    for (let i = 0; i < maxLen; i++) {
        if (i < shuffledGirls.length) result.push(shuffledGirls[i])
        if (i < shuffledBoys.length) result.push(shuffledBoys[i])
    }

    // Append any others (rare)
    return [...result, ...shuffledOthers]
}


// --- 4. MAIN ALGORITHM ---
export const generateSeatingPlan = (existingPlan = null, mode = 'free', seedModifier = 0) => {
    const baseSeed = getWeeklySeed()
    const seed = baseSeed + seedModifier
    console.log(`[Algorithm] V5 Strict Criteria. Base Seed: ${baseSeed}, Modifier: ${seedModifier}, Final Seed: ${seed}`)

    // A. Load Data
    const allStudents = classRepo.getStudents()
    const conflicts = classRepo.listConflicts()
    const layout = seatingRepo.loadSetup()

    if (!allStudents || allStudents.length === 0) return { error: 'Öğrenci listesi boş.' }

    // B. Pinned Seats
    const assignments = {}
    const pinnedSeatIds = existingPlan?.pinnedSeatIds ? new Set(existingPlan.pinnedSeatIds) : new Set()
    const placedStudentIds = new Set()

    if (existingPlan?.assignments) {
        pinnedSeatIds.forEach(seatId => {
            const studentId = existingPlan.assignments[seatId]
            const studentExists = allStudents.some(s => s.id === studentId)
            if (studentId && studentExists) {
                assignments[seatId] = studentId
                placedStudentIds.add(studentId)
            } else {
                pinnedSeatIds.delete(seatId)
            }
        })
    }

    // C. Pool Preparation
    const pool = allStudents.filter(s => !placedStudentIds.has(s.id))

    // D. TIERING (Only 2 Tiers now: Front vs Standard)
    const tierFront = []
    const tierStandard = []

    pool.forEach(s => {
        // We respect "FrontRowPreferred" strictly.
        // We also map "SpecialNeeds" to Front Row implicitly if we want kindness,
        // (User said "ignore special needs" but usually that implies "don't create a separate tier for it", 
        // but physically they need front. I will include them in Front Tier to be safe, but sort them mixed).
        // Actually user said "Özel durum... devre dışı". I will STICK TO THE FLAGS strictly.
        // Convert null/undefined to false
        const isFront = s._profile?.frontRowPreferred || false

        if (isFront) {
            tierFront.push(s)
        } else {
            tierStandard.push(s)
        }
    })

    // E. SORTING (Balanced Gender)
    const readyFront = balancedSort(tierFront, seed + 10)
    const readyStandard = balancedSort(tierStandard, seed + 20)

    const distributionQueue = [...readyFront, ...readyStandard]

    // F. DESK QUEUE (Front-to-Back)
    const desks = []
    for (let r = 1; r <= layout.rows; r++) {
        for (let c = 1; c <= layout.cols; c++) {
            const deskId = `D-R${r}-C${c}`
            const isFront = r <= layout.frontRows
            const desk = { id: deskId, row: r, col: c, isFront, seats: [] }

            if (layout.deskType === 'double') {
                desk.seats.push({ id: `R${r}-C${c}-L` })
                desk.seats.push({ id: `R${r}-C${c}-R` })
            } else {
                desk.seats.push({ id: `R${r}-C${c}` })
            }
            desks.push(desk)
        }
    }
    // Sort: Row -> Col
    desks.sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row
        return a.col - b.col
    })

    // G. HELPER: HARD CONFLICT CHECK
    const hasConflict = (s1, s2) => {
        if (!s1 || !s2) return false
        return conflicts.some(c =>
            (c.studentIdA === s1.id && c.studentIdB === s2.id) ||
            (c.studentIdA === s2.id && c.studentIdB === s1.id)
        )
    }

    // H. PLACEMENT
    for (const desk of desks) {
        if (distributionQueue.length === 0) break
        const seats = desk.seats

        // Single Desk
        if (seats.length === 1) {
            const sId = seats[0].id
            if (assignments[sId]) continue
            const student = distributionQueue.shift()
            assignments[sId] = student.id
            placedStudentIds.add(student.id)
            continue
        }

        // Double Desk
        const idL = seats[0].id
        const idR = seats[1].id
        const pinL = assignments[idL]
        const pinR = assignments[idR]

        if (pinL && pinR) continue

        // 1 Pinned
        if (pinL || pinR) {
            const fixedId = pinL ? pinL : pinR
            const targetId = pinL ? idR : idL
            const fixedStudent = allStudents.find(s => s.id === fixedId)

            // Find partner
            let matchIdx = -1
            for (let i = 0; i < distributionQueue.length; i++) {
                if (!hasConflict(fixedStudent, distributionQueue[i])) {
                    matchIdx = i
                    break
                }
            }

            if (matchIdx !== -1) {
                const partner = distributionQueue.splice(matchIdx, 1)[0]
                assignments[targetId] = partner.id
                placedStudentIds.add(partner.id)
            }
            // If conflict only, leave empty (Hard rule)
            continue
        }

        // 0 Pinned -> Fill first seat
        if (distributionQueue.length === 0) break

        // Taking first student (s1)
        const s1 = distributionQueue.shift()
        assignments[idL] = s1.id
        placedStudentIds.add(s1.id)

        if (distributionQueue.length === 0) break

        // Find partner for s1 inside the remaining queue
        // We want to maintain balance, so we iterate sequentially (linear scan is fine for <50 students)
        let partnerIdx = -1
        for (let i = 0; i < distributionQueue.length; i++) {
            if (!hasConflict(s1, distributionQueue[i])) {
                partnerIdx = i
                break
            }
        }

        if (partnerIdx !== -1) {
            const s2 = distributionQueue.splice(partnerIdx, 1)[0]
            assignments[idR] = s2.id
            placedStudentIds.add(s2.id)
        }
        // If conflict with everyone (rare), s1 sits alone
    }

    // I. COMPILE & VALIDATE
    const flatSeats = []
    desks.forEach(d => {
        d.seats.forEach(s => flatSeats.push({
            ...s, row: d.row, col: d.col, isFront: d.isFront
        }))
    })

    const violations = validatePlan(assignments, flatSeats, allStudents, conflicts)

    return {
        id: Date.now(),
        seed,
        createdAt: new Date().toISOString(),
        assignments,
        pinnedSeatIds: Array.from(pinnedSeatIds),
        manualMoves: existingPlan?.manualMoves || 0,
        seats: flatSeats,
        violations,
        stats: {
            placed: placedStudentIds.size,
            total: allStudents.length,
            conflicts: violations.length
        }
    }
}

/**
 * VALIDATE (Only Checks Conflicts & Front Row Preference)
 * Removes Special Needs chcek as it's "disabled" in criteria
 */
export const validatePlan = (assignments, seats, roster, conflicts) => {
    const violations = []

    Object.entries(assignments).forEach(([seatId, studentId]) => {
        if (!studentId) return
        const student = roster.find(s => s.id === studentId)
        if (!student) return
        const seat = seats.find(s => s.id === seatId)
        if (!seat) return

        // 1. Front Row Check (Strict Preference)
        if (student._profile?.frontRowPreferred && !seat.isFront) {
            violations.push({
                type: 'frontRow',
                seatId,
                message: `${student.name} ön sıra istiyor.`
            })
        }

        // 2. Conflict Check (Hard)
        if (seatId.endsWith('-L')) {
            const rightId = seatId.replace('-L', '-R')
            const neighborId = assignments[rightId]
            if (neighborId) {
                const hasConflict = conflicts.some(c =>
                    (c.studentIdA === studentId && c.studentIdB === neighborId) ||
                    (c.studentIdA === neighborId && c.studentIdB === studentId)
                )
                if (hasConflict) {
                    violations.push({
                        type: 'conflict',
                        seatId,
                        message: `ÇATIŞMA: ${student.name} kural ihlali!`
                    })
                }
            }
        }
    })
    return violations
}
