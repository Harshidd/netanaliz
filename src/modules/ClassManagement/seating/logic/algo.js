import { classRepo } from '../../repo/classRepo'
import { seatingRepo } from '../repo/seatingRepo'

/**
 * Baseline Seating Algorithm v3
 * Supports partial generation, pinned seats, gender balance mode, and special needs priority.
 */
export const generateSeatingPlan = (existingPlan = null, mode = 'free') => {
    console.log(`[SeatingAlgo] Starting generation... Mode: ${mode}`)

    // 1. Gather Data
    const roster = classRepo.getStudents()
    const conflicts = classRepo.listConflicts()
    const setup = seatingRepo.loadSetup()
    const rules = seatingRepo.loadRules()

    if (roster.length === 0) return { error: 'Öğrenci listesi (Roster) boş.' }

    // 2. Prepare Grid (Seats)
    const seats = []
    const capacity = setup.rows * setup.cols * (setup.deskType === 'double' ? 2 : 1)

    for (let r = 1; r <= setup.rows; r++) {
        for (let c = 1; c <= setup.cols; c++) {
            const isFront = r <= setup.frontRows
            if (setup.deskType === 'double') {
                seats.push({ id: `R${r}-C${c}-L`, row: r, col: c, position: 'left', isFront })
                seats.push({ id: `R${r}-C${c}-R`, row: r, col: c, position: 'right', isFront })
            } else {
                seats.push({ id: `R${r}-C${c}`, row: r, col: c, position: 'single', isFront })
            }
        }
    }

    if (roster.length > capacity) {
        return { error: `Kapasite yetersiz. ${roster.length} öğrenci var ama sadece ${capacity} koltuk var.` }
    }

    // 3. Handle Pinned Seats (v2)
    const assignments = {}
    const pinnedSeatIds = existingPlan?.pinnedSeatIds ? new Set(existingPlan.pinnedSeatIds) : new Set()
    const placedStudentIds = new Set()

    if (existingPlan?.assignments) {
        pinnedSeatIds.forEach(seatId => {
            if (seats.some(s => s.id === seatId)) {
                const studentId = existingPlan.assignments[seatId]
                if (studentId && roster.some(s => s.id === studentId)) {
                    assignments[seatId] = studentId
                    placedStudentIds.add(studentId)
                } else if (studentId) {
                    pinnedSeatIds.delete(seatId)
                }
            } else {
                pinnedSeatIds.delete(seatId)
            }
        })
    }

    // 4. Sort Remaining Students by Priority
    // Priority: Special Needs > Manual Priority > Random
    const remainingStudents = roster.filter(s => !placedStudentIds.has(s.id))
    const shuffledStudents = [...remainingStudents].sort(() => Math.random() - 0.5)

    const priorityQueue = shuffledStudents.sort((a, b) => {
        // Special Needs First (Explicit Boolean check)
        const aNeeds = a._profile?.specialNeeds ? 1 : 0
        const bNeeds = b._profile?.specialNeeds ? 1 : 0
        if (bNeeds !== aNeeds) return bNeeds - aNeeds

        // Then Discipline Risk
        if ((b._profile?.disciplineRisk || 0) !== (a._profile?.disciplineRisk || 0)) {
            return (b._profile?.disciplineRisk || 0) - (a._profile?.disciplineRisk || 0)
        }
        return 0
    })

    // Helper: Valid check
    const isValid = (student, seatId) => {
        // Enforce Special Needs Front Rule HARD
        // If student has special needs, they MUST be in front row if unpinned.
        if (student._profile?.specialNeeds) {
            const seat = seats.find(s => s.id === seatId)
            if (!seat.isFront) return false
        }
        return true
    }

    // Helper: Cost function
    const calculateCost = (student, seatId) => {
        let cost = 0
        const seat = seats.find(s => s.id === seatId)

        // Neighbor check
        let neighborId = null
        if (setup.deskType === 'double') {
            const suffix = seat.id.endsWith('-L') ? '-R' : '-L'
            const base = seat.id.substring(0, seat.id.length - 2)
            const neighborSeatId = base + suffix
            if (assignments[neighborSeatId]) neighborId = assignments[neighborSeatId]
        }

        if (neighborId) {
            const neighbor = roster.find(s => s.id === neighborId)
            if (neighbor) {
                // Conflict
                const hasConflict = conflicts.some(c =>
                    (c.studentIdA === student.id && c.studentIdB === neighbor.id) ||
                    (c.studentIdA === neighbor.id && c.studentIdB === student.id)
                )
                if (hasConflict) cost += 1000

                // Mode: Girl-Boy (Penalty for Same Gender)
                if (mode === 'girl_boy') {
                    // Assuming 'gender' or simplified check. 
                    // If no gender data, this doesn't work well, but logic is here.
                    if (student.gender && neighbor.gender && student.gender === neighbor.gender) {
                        cost += 500
                    }
                }

                // Talkativeness
                if ((student._profile?.talkativeness || 0) > 3 && (neighbor._profile?.talkativeness || 0) > 3) {
                    cost += (rules.weights?.talkativenessWeight || 1) * 10
                }

                // Discipline
                if ((student._profile?.disciplineRisk || 0) > 0 && (neighbor._profile?.disciplineRisk || 0) > 0) {
                    cost += (rules.weights?.disciplineWeight || 1) * 20
                }
            }
        }

        // Front preference (Attention) - Only applies if NOT special needs (who are forced anyway)
        if (!student._profile?.specialNeeds && (student._profile?.attention || 0) < 3) {
            cost += (seat.row - 1) * (rules.weights?.attentionWeight || 1)
        }

        return cost
    }

    // 5. Place Remaining Students
    for (const student of priorityQueue) {
        let bestSeat = null
        let minCost = Infinity

        // Candidate seats: Empty and Valid
        const candidateSeats = seats.filter(s =>
            !assignments[s.id] &&
            !pinnedSeatIds.has(s.id)
        ).sort(() => Math.random() - 0.5)

        for (const seat of candidateSeats) {
            if (!isValid(student, seat.id)) continue

            const cost = calculateCost(student, seat.id)
            const randomizedCost = cost + Math.random()

            if (randomizedCost < minCost) {
                minCost = randomizedCost
                bestSeat = seat.id
            }
        }

        if (bestSeat) {
            assignments[bestSeat] = student.id
            placedStudentIds.add(student.id)
        } else {
            // Fallback for Special Needs: Try ANY empty seat if front is full
            if (student._profile?.specialNeeds) {
                for (const seat of candidateSeats) {
                    const cost = calculateCost(student, seat.id) + 100
                    if (cost < minCost) {
                        minCost = cost
                        bestSeat = seat.id
                    }
                }
                if (bestSeat) {
                    assignments[bestSeat] = student.id
                    placedStudentIds.add(student.id)
                }
            }
        }
    }

    // 6. Validation
    const violations = validatePlan(assignments, seats, roster, conflicts, rules)

    const stats = {
        totalStudents: roster.length,
        placed: placedStudentIds.size,
        unplaced: roster.length - placedStudentIds.size,
        conflictsViolated: violations.filter(v => v.type === 'conflict').length,
        specialNeedsViolation: violations.filter(v => v.type === 'specialNeeds').length
    }

    return {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        assignments,
        pinnedSeatIds: Array.from(pinnedSeatIds),
        manualMoves: existingPlan?.manualMoves || 0,
        seats,
        stats,
        violations
    }
}

/**
 * Validates a plan and returns violation objects
 */
export const validatePlan = (assignments, seats, roster, conflicts, rules) => {
    const violations = []

    Object.entries(assignments).forEach(([seatId, studentId]) => {
        if (!studentId) return
        const student = roster.find(s => s.id === studentId)
        if (!student) return
        const seat = seats.find(s => s.id === seatId)
        if (!seat) return

        // 1. Special Needs Front Check
        // Explicitly check boolean flag now
        if (student._profile?.specialNeeds && !seat.isFront) {
            violations.push({
                type: 'specialNeeds',
                seatId,
                studentId,
                message: `${student.name} (Özel Durum) ön sırada olmalı.`
            })
        }

        // 2. Conflict Check (Neighbor)
        if (seat.id.includes('-L') || seat.id.includes('-R')) {
            const suffix = seat.id.endsWith('-L') ? '-R' : '-L'
            const base = seat.id.substring(0, seat.id.length - 2)
            const neighborId = assignments[base + suffix]

            if (neighborId) {
                if (seatId.includes('-L')) {
                    const hasConflict = conflicts.some(c =>
                        (c.studentIdA === studentId && c.studentIdB === neighborId) ||
                        (c.studentIdA === neighborId && c.studentIdB === studentId)
                    )
                    if (hasConflict) {
                        violations.push({
                            type: 'conflict',
                            seatId,
                            neighborSeatId: base + suffix,
                            message: `${student.name} ve yanındaki öğrenci arasında çatışma kuralı var.`
                        })
                    }
                }
            }
        }
    })

    return violations
}
